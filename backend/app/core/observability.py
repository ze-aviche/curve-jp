"""
Observability — structured request logging, timing, and Prometheus metrics.

OPERATIONAL READINESS:
At enterprise scale you can't debug what you can't see. This adds the three
pillars cheaply:
  - a request id on every request (trace correlation across logs/services)
  - latency + status logged per request (the basis of SLOs)
  - Prometheus metrics at /metrics (request count + latency histogram) that an
    enterprise scrape (Prometheus/Grafana, Datadog) consumes for dashboards and
    alerting.
"""
from __future__ import annotations

import time
import uuid

from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

REQUESTS = Counter(
    "http_requests_total", "Total HTTP requests", ["method", "path", "status"]
)
LATENCY = Histogram(
    "http_request_duration_seconds", "Request latency", ["method", "path"]
)


class ObservabilityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
        start = time.perf_counter()
        # Use the route template (not the raw path) so metrics don't explode
        # into one label per id, e.g. /integrations/{name}/sync.
        route = request.scope.get("route")
        path_label = getattr(route, "path", request.url.path)

        try:
            response = await call_next(request)
            status = response.status_code
        except Exception:
            status = 500
            REQUESTS.labels(request.method, path_label, status).inc()
            raise
        finally:
            elapsed = time.perf_counter() - start
            LATENCY.labels(request.method, path_label).observe(elapsed)

        REQUESTS.labels(request.method, path_label, status).inc()
        response.headers["x-request-id"] = request_id
        response.headers["x-response-time-ms"] = f"{elapsed * 1000:.1f}"
        print(f'[req] id={request_id} {request.method} {request.url.path} '
              f'-> {status} {elapsed * 1000:.1f}ms')
        return response


def metrics_response() -> Response:
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
