"""
Policy Q&A chatbot — the "G" (generation) end of the RAG pipeline.

This is a grounded question-answering bot over the documents you ingested into the
`cc_knowledge` collection (policy PDFs, benchmarks, transcripts). The flow:

    user question
        -> embed + semantic search the vector store      (RETRIEVE)
        -> paste the top chunks into the prompt as context (AUGMENT)
        -> Claude answers using ONLY that context          (GENERATE)

Why "ONLY that context" matters for *testing*: the system prompt forbids the model
from using its own training knowledge and tells it to say it doesn't know when the
answer isn't in the retrieved chunks. That makes the bot's correctness a clean test
of your retrieval + corpus — if it answers wrong, either the chunk wasn't retrieved
or the corpus doesn't cover it, not because the LLM "knew" something unrelated.

Note: the metric-driven `retrieve.py` builds its query from a client's weak metrics.
This module instead embeds the *user's natural-language question* directly — that's
the difference between automated-audit retrieval and a human-facing chatbot.

Run an interactive session (from backend/, venv active, ANTHROPIC_API_KEY set):
    python -m app.rag.chat
"""
from __future__ import annotations

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from app.core.config import settings
from app.rag.guardrails import apply_groundedness_guardrail
from app.rag.rag_logging import get_logger, preview
from app.rag.router import route_doc_types
from app.rag.store import get_store

log = get_logger("chat")

MODEL = "claude-sonnet-4-6"
DEFAULT_K = 5
# Scope of retrieval (the collection is shared across policies, transcripts, voice
# calls, CRM cases, benchmarks). Options for `doc_type`:
#   "auto"  -> a router LLM classifies the question and picks the relevant type(s)
#   None    -> search everything
#   "policy" / ["policy", "crm_case"] -> force a fixed scope
DEFAULT_DOC_TYPE: object = "auto"

SYSTEM_PROMPT = """You are a company policy assistant. Answer the user's question \
using ONLY the reference context provided below. The context is retrieved from the \
company's own policy and knowledge documents.

Rules:
- Base your answer strictly on the context. Do NOT use outside/general knowledge.
- If the context does not contain the answer, say: "I don't have that information in \
the policy documents." Do not guess or invent details.
- Be concise and direct. Quote specific figures, limits, or conditions when present.
- When useful, mention which document the answer came from (the [source] tag)."""


def _llm() -> ChatAnthropic:
    return ChatAnthropic(
        model=MODEL,
        temperature=0.0,  # deterministic — we want faithful retrieval, not creativity
        max_tokens=1024,
        api_key=settings.ANTHROPIC_API_KEY,
    )


def _resolve_scope(question: str, doc_type: object) -> list[str]:
    """Turn the `doc_type` setting into a concrete list of types to search.

    "auto" -> ask the router; None -> [] (all); str -> [str]; list -> list.
    """
    if doc_type == "auto":
        return route_doc_types(question)
    if doc_type is None:
        return []
    if isinstance(doc_type, str):
        return [doc_type]
    return list(doc_type)  # already a list/tuple of types


def _where_for(types: list[str]) -> dict | None:
    """Build a Chroma metadata filter from a list of types."""
    if not types:
        return None  # no filter -> search everything
    if len(types) == 1:
        return {"type": types[0]}
    return {"type": {"$in": types}}


def retrieve_for_question(
    question: str,
    k: int = DEFAULT_K,
    doc_type: object = DEFAULT_DOC_TYPE,
) -> list[dict]:
    """Semantic-search the knowledge base with the raw question.

    `doc_type` controls which document types are eligible (see DEFAULT_DOC_TYPE):
    "auto" routes via an LLM, None searches all, a str/list forces a fixed scope.

    Returns the raw hits (text + metadata + distance) so callers can both build the
    prompt and surface citations to the user.
    """
    store = get_store()
    if store.count() == 0:
        return []
    types = _resolve_scope(question, doc_type)
    return store.query(question, k=k, where=_where_for(types))


def _format_context(hits: list[dict]) -> str:
    blocks = []
    for h in hits:
        src = h["metadata"].get("source", "unknown")
        blocks.append(f"[source: {src}]\n{h['text']}")
    return "\n\n---\n\n".join(blocks)


def answer_question(
    question: str,
    history: list[dict] | None = None,
    k: int = DEFAULT_K,
    doc_type: object = DEFAULT_DOC_TYPE,
    guardrails: bool = True,
) -> dict:
    """Answer one question with RAG grounding.

    `history` is an optional list of prior turns: [{"role": "user"|"assistant",
    "content": "..."}], enabling follow-up questions. Retrieval always uses the
    *current* question.

    Returns {"answer": str, "sources": [{"source", "distance"}], "grounded": bool}.
    """
    log.info("=== CHAT turn ===")
    log.info("question: %s", preview(question, 120))
    log.info("history: %d prior turns", len(history or []))

    # --- 0. ROUTE: decide which document types to search (once) ---
    log.info("routing (doc_type setting=%r)…", doc_type)
    types = _resolve_scope(question, doc_type)
    log.info("scope: %s", types or "ALL types")

    # --- 1. RETRIEVE (pass concrete types so we don't route twice) ---
    hits = retrieve_for_question(question, k=k, doc_type=types or None)
    if not hits:
        log.warning("no hits — knowledge base empty; returning fallback answer")
        return {
            "answer": "The knowledge base is empty — ingest documents first with "
            "`python -m app.rag.ingest`.",
            "sources": [],
            "grounded": False,
        }

    # --- 2. AUGMENT ---
    context = _format_context(hits)
    log.info("augment: injecting %d chunks (%d chars of context) into the prompt",
             len(hits), len(context))

    messages: list = [SystemMessage(content=SYSTEM_PROMPT)]
    for turn in history or []:
        if turn["role"] == "user":
            messages.append(HumanMessage(content=turn["content"]))
        else:
            messages.append(AIMessage(content=turn["content"]))
    messages.append(
        HumanMessage(
            content=f"Reference context:\n\n{context}\n\n"
            f"---\n\nQuestion: {question}"
        )
    )

    # --- 3. GENERATE ---
    log.info("generate: calling %s (temp=0) with %d messages…", MODEL, len(messages))
    response = _llm().invoke(messages)
    answer = response.content if isinstance(response.content, str) else str(response.content)
    usage = getattr(response, "usage_metadata", None) or {}
    log.info("answer (%d chars, tokens in/out=%s/%s): %s",
             len(answer), usage.get("input_tokens", "?"),
             usage.get("output_tokens", "?"), preview(answer, 120))

    # De-duplicate sources while preserving best (smallest) distance order.
    seen: dict[str, float] = {}
    for h in hits:
        src = h["metadata"].get("source", "unknown")
        if src not in seen or h["distance"] < seen[src]:
            seen[src] = h["distance"]
    sources = [
        {"source": s, "distance": round(d, 3)}
        for s, d in sorted(seen.items(), key=lambda kv: kv[1])
    ]
    log.info("sources: %s", ", ".join(f"{s['source']}({s['distance']})" for s in sources))

    # --- 4. GUARDRAIL: verify the answer is grounded before returning it ---
    guardrail_info = None
    if guardrails:
        log.info("guardrail: checking groundedness…")
        gr = apply_groundedness_guardrail(answer, context)
        answer = gr["answer"]            # possibly replaced with a safe refusal
        guardrail_info = gr["verdict"] | {"blocked": gr["blocked"]}

    return {
        "answer": answer,
        "sources": sources,
        "grounded": True if guardrail_info is None else not guardrail_info["blocked"],
        "guardrail": guardrail_info,
    }


def _repl() -> None:
    """Tiny interactive loop for manual testing of the policy bot."""
    store = get_store()
    print(f"Policy chatbot — {store.count()} chunks in '{store._col.name}'.")
    if store.count() == 0:
        print("No documents indexed. Run: python -m app.rag.ingest")
        return
    print("Ask a policy question (Ctrl-C or blank line to quit).\n")

    history: list[dict] = []
    try:
        while True:
            q = input("you> ").strip()
            if not q:
                break
            result = answer_question(q, history=history)
            print(f"\nbot> {result['answer']}")
            if result["sources"]:
                cites = ", ".join(
                    f"{s['source']} ({s['distance']})" for s in result["sources"]
                )
                print(f"     sources: {cites}\n")
            history.append({"role": "user", "content": q})
            history.append({"role": "assistant", "content": result["answer"]})
    except (KeyboardInterrupt, EOFError):
        print()


if __name__ == "__main__":
    import logging

    from app.rag.rag_logging import configure
    configure(logging.INFO)  # set to logging.DEBUG to also see chunk/query previews
    _repl()
