import os
import time
import pika

def setup_rabbitmq():
    rabbitmq_url = os.environ.get('RABBITMQ_URL', 'amqp://guest:guest@rabbitmq:5672/')
    
    connection_attempts = 0
    max_attempts = 10
    connection = None
    
    print(f"Attempting to connect to RabbitMQ at {rabbitmq_url}...")
    
    while connection_attempts < max_attempts:
        try:
            params = pika.URLParameters(rabbitmq_url)
            connection = pika.BlockingConnection(params)
            print("Successfully connected to RabbitMQ.")
            break
        except Exception as e:
            connection_attempts += 1
            print(f"Connection failed ({connection_attempts}/{max_attempts}): {e}")
            if connection_attempts == max_attempts:
                print("Max connection attempts reached. Raising exception.")
                raise
            time.sleep(5)
            
    channel = connection.channel()
    
    # Declare Exchange
    exchange_name = "booking_events"
    channel.exchange_declare(exchange=exchange_name, exchange_type='topic', durable=True)
    
    # Define Queues and their bindings
    # Note: payment_logs_queue needs both payment.* and deposit.*
    queues_bindings = [
        ("payment_logs_queue", "payment.*"),
        ("payment_logs_queue", "deposit.*"),
        ("notification_queue", "booking.*"),
        ("notification_deposit_queue", "deposit.*")
    ]
    
    # Declare and bind Queues
    for queue_name, routing_key in queues_bindings:
        channel.queue_declare(queue=queue_name, durable=True)
        channel.queue_bind(exchange=exchange_name, queue=queue_name, routing_key=routing_key)
        print(f"Declared/bound queue '{queue_name}' with routing key '{routing_key}'.")
        
    connection.close()
    print("RabbitMQ setup complete")

if __name__ == '__main__':
    setup_rabbitmq()
