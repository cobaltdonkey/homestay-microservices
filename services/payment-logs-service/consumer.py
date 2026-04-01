import os
import json
import time
import uuid
import pika
from sqlalchemy.exc import IntegrityError

RABBITMQ_URL = os.environ.get('RABBITMQ_URL', 'amqp://guest:guest@rabbitmq:5672/')

def start_consumer(app):
    with app.app_context():
        from models import PaymentTransaction
        from db import db
        import shared.constants as constants
        
        while True:
            try:
                print("Connecting to RabbitMQ...", flush=True)
                parameters = pika.URLParameters(RABBITMQ_URL)
                connection = pika.BlockingConnection(parameters)
                channel = connection.channel()
                
                queue_name = 'payment_logs_queue'
                
                def callback(ch, method, properties, body):
                    print(f"Received message: {method.routing_key} {body}", flush=True)
                    try:
                        data = json.loads(body)
                        amount = data.get('amount', 0)
                        booking_id = data.get('bookingId', 'unknown')
                        payment_txn_id = data.get('paymentTxnId', str(uuid.uuid4()))
                        transaction_type = data.get('transactionType', constants.TXN_TYPE_BOOKING_CAPTURE)
                        idempotency_key = data.get('idempotencyKey')
                        
                        status = "CAPTURED"
                        routing_key = method.routing_key
                        
                        if routing_key == 'payment.authorised':
                            status = 'AUTHORIZED'
                        elif routing_key == 'deposit.preauthorised':
                            status = 'AUTHORIZED'
                        elif routing_key == 'payment.error':
                            status = 'FAILED'
                            
                        record = PaymentTransaction(
                            log_id=str(uuid.uuid4()),
                            booking_id=booking_id,
                            payment_txn_id=payment_txn_id,
                            transaction_type=transaction_type,
                            amount=amount,
                            status=status,
                            idempotency_key=idempotency_key
                        )
                        
                        db.session.add(record)
                        db.session.commit()
                        print(f"Inserted payment log for booking {booking_id}", flush=True)
                    except IntegrityError:
                        db.session.rollback()
                        print("Idempotency key duplicate ignored.", flush=True)
                    except Exception as e:
                        db.session.rollback()
                        print(f"Error processing message: {e}", flush=True)
                
                channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)
                print("Starting consume loop...", flush=True)
                channel.start_consuming()
            except pika.exceptions.AMQPConnectionError as e:
                print(f"RabbitMQ connection error: {e}. Retrying in 5 seconds...", flush=True)
                time.sleep(5)
            except Exception as e:
                print(f"Unexpected error in consumer: {e}. Retrying in 5 seconds...", flush=True)
                time.sleep(5)
