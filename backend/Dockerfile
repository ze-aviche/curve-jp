# syntax=docker/dockerfile:1
# Multi-stage build keeps the runtime image small (no build toolchain shipped).
FROM python:3.12-slim AS base
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install deps first (layer cache: only re-runs when requirements change).
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# App code.
COPY . .

# Non-root user — never run containers as root in production.
RUN useradd --create-home appuser && chown -R appuser /app
USER appuser

EXPOSE 8000

# Default command runs the API; the worker service overrides this in compose.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
