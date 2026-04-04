"""
helpers.py — HTTP client helpers and RabbitMQ publishing for the
Deposit Resolution orchestrator.

Includes:
- Retry-capable HTTP client with exponential backoff
- Dedicated OutSystems HTTP caller (longer timeout, different error handling)
- RabbitMQ event publisher with idempotency key support
"""
import os
import json
import time
import pika
import requests

# ─────────────────────────────────────────────────────────────
# Service URLs (read from env vars, fallback to Docker DNS)
# ─────────────────────────────────────────────────────────────
STAY_SERVICE_URL = os.environ.get(
    "STAY_SERVICE_URL", "http://stay-service:5006"
)
INSPECTION_SERVICE_URL = os.environ.get(
    "INSPECTION_SERVICE_URL",
    "https://personal-c9barqdh.outsystemscloud.com/InspectionService/rest/InspectionAPI"
)
PAYMENT_GATEWAY_URL = os.environ.get(
    "PAYMENT_GATEWAY_URL", "http://payment-gateway-wrapper:5010"
)
USERS_SERVICE_URL = os.environ.get(
    "USERS_SERVICE_URL", "http://users-service:5003"
)
PAYMENT_LOGS_SERVICE_URL = os.environ.get(
    "PAYMENT_LOGS_SERVICE_URL", "http://payment-logs-service:5008"
)
BOOKING_DETAIL_SERVICE_URL = os.environ.get(
    "BOOKING_DETAIL_SERVICE_URL", "http://booking-detail-service:5012"
)

RABBITMQ_URL = os.environ.get(
    "RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/"
)

# RabbitMQ
EXCHANGE_NAME = "booking_events"


# ─────────────────────────────────────────────────────────────
# HTTP Client — internal services (with optional retry)
# ─────────────────────────────────────────────────────────────
def call_service(method, url, payload=None, *, timeout=10, retries=0, backoff=1.0):
    """
    Call an internal microservice. Returns (status_code, response_json).

    Parameters
    ----------
    retries : int
        Number of additional retries on failure (0 = no retries).
    backoff : float
        Initial backoff in seconds; doubles on each retry.
    """
    attempts = 0
    last_err = None

    while attempts <= retries:
        try:
            kwargs = {"timeout": timeout}
            if payload is not None:
                kwargs["json"] = payload

            response = getattr(requests, method)(url, **kwargs)
            return (response.status_code, response.json())

        except requests.exceptions.RequestException as e:
            last_err = e
            attempts += 1
            if attempts <= retries:
                wait = backoff * (2 ** (attempts - 1))
                print(
                    f"[RETRY] {method.upper()} {url} failed (attempt {attempts}/{retries+1}): {e}. "
                    f"Retrying in {wait:.1f}s ...",
                    flush=True,
                )
                time.sleep(wait)
            else:
                print(f"[ERROR] Service call failed after {attempts} attempt(s): {url} | {e}", flush=True)

        except Exception as e:
            print(f"[ERROR] Unexpected error calling {url}: {e}", flush=True)
            return (503, {"error": "Unexpected error"})

    return (503, {"error": f"Service unavailable: {last_err}"})


# ─────────────────────────────────────────────────────────────
# HTTP Client — OutSystems (external, longer timeout)
# ─────────────────────────────────────────────────────────────
def call_outsystems(url, payload, *, timeout=15, retries=1, backoff=2.0):
    """
    POST to the external OutSystems Inspection Service.
    Returns (status_code, response_json | None).
    Uses a longer timeout and a single retry by default.
    """
    attempts = 0
    last_err = None

    while attempts <= retries:
        try:
            response = requests.post(url, json=payload, timeout=timeout)
            try:
                body = response.json()
            except ValueError:
                body = {"raw": response.text}
            return (response.status_code, body)

        except requests.exceptions.Timeout as e:
            last_err = e
            attempts += 1
            if attempts <= retries:
                wait = backoff * (2 ** (attempts - 1))
                print(
                    f"[RETRY] OutSystems POST {url} timed out (attempt {attempts}/{retries+1}). "
                    f"Retrying in {wait:.1f}s ...",
                    flush=True,
                )
                time.sleep(wait)
            else:
                print(f"[ERROR] OutSystems call timed out after {attempts} attempt(s): {url}", flush=True)

        except requests.exceptions.RequestException as e:
            last_err = e
            attempts += 1
            if attempts <= retries:
                wait = backoff * (2 ** (attempts - 1))
                print(
                    f"[RETRY] OutSystems POST {url} failed (attempt {attempts}/{retries+1}): {e}. "
                    f"Retrying in {wait:.1f}s ...",
                    flush=True,
                )
                time.sleep(wait)
            else:
                print(f"[ERROR] OutSystems call failed after {attempts} attempt(s): {url} | {e}", flush=True)

        except Exception as e:
            print(f"[ERROR] Unexpected error calling OutSystems: {e}", flush=True)
            return (503, {"error": f"Unexpected error: {e}"})

    return (503, {"error": f"OutSystems service unavailable: {last_err}"})


# ─────────────────────────────────────────────────────────────
# RabbitMQ Publisher — with idempotency key header
# ─────────────────────────────────────────────────────────────
def publish_event(routing_key, payload_dict, *, idempotency_key=None):
    """
    Publish a message to the ``booking_events`` topic exchange.

    Parameters
    ----------
    routing_key : str
        e.g. ``deposit.resolved``, ``deposit.notification``
    payload_dict : dict
        JSON-serialisable message body.
    idempotency_key : str | None
        If provided, set as a message header for downstream consumers
        to de-duplicate processing.
    """
    try:
        parameters = pika.URLParameters(RABBITMQ_URL)
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()

        channel.exchange_declare(
            exchange=EXCHANGE_NAME,
            exchange_type='topic',
            durable=True,
        )

        # Build properties
        headers = {}
        if idempotency_key:
            headers["x-idempotency-key"] = idempotency_key

        properties = pika.BasicProperties(
            delivery_mode=2,  # persistent
            headers=headers if headers else None,
        )

        channel.basic_publish(
            exchange=EXCHANGE_NAME,
            routing_key=routing_key,
            body=json.dumps(payload_dict).encode(),
            properties=properties,
        )

        connection.close()
        print(
            f"[AMQP] Published {routing_key} "
            f"(idempotency={idempotency_key or 'none'})",
            flush=True,
        )

    except Exception as e:
        print(f"[WARN] AMQP publish failed ({routing_key}): {e}", flush=True)
