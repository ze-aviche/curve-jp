const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      req<{ access_token: string; token_type: string; role: string }>("/api/v1/auth/login", {
        method: "POST",
        body: new URLSearchParams({ username: email, password }).toString(),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }),
    register: (data: { email: string; password: string; full_name: string; role?: string }) =>
      req("/api/v1/auth/register", { method: "POST", body: JSON.stringify(data) }),
  },
  clients: {
    list: () => req<unknown[]>("/api/v1/clients/"),
    create: (data: unknown) => req("/api/v1/clients/", { method: "POST", body: JSON.stringify(data) }),
    get: (id: string) => req(`/api/v1/clients/${id}`),
    audit: (id: string) => req(`/api/v1/clients/${id}/audit`),
    gaps: (id: string, severity?: string) =>
      req(`/api/v1/clients/${id}/gaps${severity ? `?severity=${severity}` : ""}`),
    dataCollection: (id: string) => req(`/api/v1/clients/${id}/data-collection`),
  },
  industryPlayers: {
    list: (category?: string) =>
      req(`/api/v1/industry-players/${category ? `?category=${category}` : ""}`),
  },
  voice: {
    analytics: () =>
      req<{
        total_calls: number
        contained_calls: number
        escalated_calls: number
        containment_rate: number
        avg_handle_secs: number
        agent_minutes_deflected: number
        estimated_savings_usd: number
        outcomes: Record<string, number>
        by_tenant: { tenant: string; total_calls: number; containment_rate: number; avg_handle_secs: number }[]
      }>("/api/v1/voice/analytics"),
    intents: (useLlm = false) =>
      req<{
        classifier: string
        by_intent: { intent: string; total_calls: number; containment_rate: number }[]
      }>(`/api/v1/voice/intents?use_llm=${useLlm}`),
  },
  chat: {
    ask: (
      question: string,
      history?: { role: "user" | "assistant"; content: string }[],
      k?: number,
    ) =>
      req<{
        answer: string
        sources: { source: string; distance: number }[]
        grounded: boolean
        guardrail: { score?: number; blocked?: boolean; grounded?: boolean; reason?: string } | null
      }>("/api/v1/chat", {
        method: "POST",
        body: JSON.stringify({ question, history, k }),
      }),
  },
}
