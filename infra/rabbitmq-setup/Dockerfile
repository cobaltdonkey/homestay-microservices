FROM python:3.11-slim
WORKDIR /app
COPY rabbitmq_setup.py .
RUN pip install pika
CMD ["python", "rabbitmq_setup.py"]
