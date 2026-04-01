import os
import json
import pika
import requests

def publish_event(routing_key, payload_dict):
    try:
        rabbitmq_url = os.environ.get('RABBITMQ_URL', 'amqp://guest:guest@rabbitmq:5672/')
        parameters = pika.URLParameters(rabbitmq_url)
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()

        channel.exchange_declare(
            exchange='booking_events',
            exchange_type='topic',
            durable=True
        )

        channel.basic_publish(
            exchange='booking_events',
            routing_key=routing_key,
            body=json.dumps(payload_dict).encode(),
            properties=pika.BasicProperties(delivery_mode=2)
        )

        connection.close()
    except Exception as e:
        print(f"[WARN] Publish failed: {e}", flush=True)

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
