import os
import json
import requests


def call_service(method, url, payload=None):
    try:
        kwargs = {"timeout": 10}
        if payload is not None:
            kwargs["json"] = payload

        response = getattr(requests, method)(url, **kwargs)
        return (response.status_code, response.json())
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Service call failed: {url} | {e}", flush=True)
        return (503, {"error": "Service unavailable"})
    except Exception:
        return (503, {"error": "Unexpected error"})
