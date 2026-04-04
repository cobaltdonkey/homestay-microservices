import os
import json
import time
import uuid
import pika
from sqlalchemy.exc import IntegrityError

RABBITMQ_URL = os.environ.get('RABBITMQ_URL', 'amqp://guest:guest@rabbitmq:5672/')

def start_consumer(app):
    with app.app_context():
        from models import PaymentLog
        from db import db
        
        while True:
            try:
                print("Connecting to RabbitMQ...", flush=True)
                parameters = pika.URLParameters(RABBITMQ_URL)
                connection = pika.BlockingConnection(parameters)
                channel = connection.channel()

                # Declare exchange
                channel.exchange_declare(
                    exchange='booking_events',
                    exchange_type='topic',
                    durable=True
                )

                queue_name = 'payment_logs_queue'
                # Set up payment_logs_queue
                channel.queue_declare(queue=queue_name, durable=True)
                
                # Bind for both payment and deposit events
                channel.queue_bind(exchange='booking_events', queue=queue_name, routing_key='payment.*')
                channel.queue_bind(exchange='booking_events', queue=queue_name, routing_key='deposit.*')
                
                def callback(ch, method, properties, body):
                    print(f"Received message: {method.routing_key} {body}", flush=True)
                    try:
                        data = json.loads(body)
                        booking_id = data.get('bookingId', 'unknown')
                        routing_key = method.routing_key
                        
                        payment_txn_id = None
                        deposit_txn_id = None
                        amount = None
                        deposit_amount = None
                        status = 'AUTHORIZED'
                        transaction_type = 'UNKNOWN'
                        reason = data.get('reason')
                        
                        # Labels and defaults based on routing key
                        if routing_key == 'payment.preauthorised':
                            transaction_type = 'BOOKING_PAYMENT_PREAUTHORIZE'
                            payment_txn_id = data.get('paymentTxnId')
                            amount = data.get('bookingAmount', 0)
                            status = 'PREAUTHORISED'
                        elif routing_key == 'payment.captured':
                            transaction_type = 'BOOKING_PAYMENT_CAPTURED'
                            payment_txn_id = data.get('paymentTxnId')
                            amount = data.get('amount') or data.get('bookingAmount', 0)
                            status = 'SUCCESS'
                        elif routing_key == 'deposit.preauthorised':
                            transaction_type = 'DEPOSIT_PREAUTHORIZE'
                            deposit_txn_id = data.get('depositTxnId')
                            deposit_amount = data.get('depositAmount', 0)
                            status = 'PREAUTHORISED'
                        elif routing_key == 'deposit.captured':
                            transaction_type = 'DEPOSIT_CAPTURED'
                            deposit_txn_id = data.get('depositTxnId')
                            deposit_amount = data.get('depositAmount') or data.get('amount', 0)
                            status = 'SUCCESS'
                        elif routing_key == 'payment.voided':
                            transaction_type = 'BOOKING_PAYMENT_VOIDED'
                            payment_txn_id = data.get('paymentTxnId')
                            status = 'VOIDED'
                        elif routing_key == 'deposit.released' or routing_key == 'deposit.voided':
                            transaction_type = 'DEPOSIT_VOIDED'
                            deposit_txn_id = data.get('depositTxnId') or data.get('deposit_txn_id')
                            deposit_amount = data.get('depositAmount') or data.get('deposit_amount', 0)
                            status = 'VOIDED'
                        elif routing_key == 'deposit.resolved':
                            # Published by the deposit-resolution orchestrator
                            transaction_type = data.get('transaction_type', 'DEPOSIT_RELEASE')
                            deposit_txn_id = data.get('deposit_txn_id') or data.get('depositTxnId')
                            amount = data.get('amount', 0)
                            deposit_amount = data.get('deposit_amount') or data.get('depositAmount', 0)
                            status = data.get('status', 'RELEASED')
                            reason = data.get('reason')
                            booking_id = data.get('booking_id') or data.get('bookingId', 'unknown')
                        elif routing_key == 'payment.error':
                            transaction_type = 'PAYMENT_FAILED'
                            payment_txn_id = data.get('paymentTxnId', 'ERROR')
                            amount = data.get('amount', 0)
                            status = 'FAILED'
                        else:
                            transaction_type = f"UNHANDLED_{routing_key.upper()}"
                            payment_txn_id = data.get('paymentTxnId')
                            deposit_txn_id = data.get('depositTxnId')
                            amount = data.get('amount', 0)
                            status = 'RECEIVED'

                        idempotency_key = data.get('idempotency_key') or data.get('idempotencyKey') or f"{routing_key}-{booking_id}-{uuid.uuid4().hex[:8]}"
                        
                        record = PaymentLog(
                            log_id=str(uuid.uuid4()),
                            booking_id=booking_id,
                            payment_txn_id=payment_txn_id,
                            deposit_txn_id=deposit_txn_id,
                            transaction_type=transaction_type,
                            amount=amount,
                            deposit_amount=deposit_amount,
                            status=status,
                            reason=reason,
                            idempotency_key=idempotency_key
                        )
                        
                        db.session.add(record)
                        db.session.commit()
                        print(f"Inserted unified {transaction_type} log for booking {booking_id}", flush=True)
                    except IntegrityError:
                        db.session.rollback()
                        print("Idempotency key duplicate ignored.", flush=True)
                    except Exception as e:
                        db.session.rollback()
                        print(f"Error processing message: {e}", flush=True)
                    finally:
                        ch.basic_ack(delivery_tag=method.delivery_tag)
                
                channel.basic_consume(queue=queue_name, on_message_callback=callback)
                print("Starting consume loop...", flush=True)
                channel.start_consuming()
            except pika.exceptions.AMQPConnectionError as e:
                print(f"RabbitMQ connection error: {e}. Retrying in 5 seconds...", flush=True)
                time.sleep(5)
            except Exception as e:
                print(f"Unexpected error in consumer: {e}. Retrying in 5 seconds...", flush=True)
                time.sleep(5)
