import os
import json
import pika

RABBITMQ_URL = os.environ.get('RABBITMQ_URL', 'amqp://guest:guest@rabbitmq:5672/')

def publish_message(routing_key, message):
    """
    Publishes a message to the 'booking_events' exchange with the given routing_key.
    The exchange is a 'topic' exchange.
    """
    try:
        parameters = pika.URLParameters(RABBITMQ_URL)
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()

        # Ensure exchange exists
        channel.exchange_declare(
            exchange='booking_events',
            exchange_type='topic',
            durable=True
        )

        channel.basic_publish(
            exchange='booking_events',
            routing_key=routing_key,
            body=json.dumps(message),
            properties=pika.BasicProperties(
                delivery_mode=2,  # make message persistent
            )
        )
        print(f"[RabbitMQ] Published {routing_key}: {message}", flush=True)
        connection.close()
        return True
    except Exception as e:
        print(f"[RabbitMQ ERROR] Failed to publish {routing_key}: {e}", flush=True)
        return False
