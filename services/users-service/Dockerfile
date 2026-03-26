FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# The shared folder is mounted at /app/shared at runtime via docker-compose
CMD ["python", "app.py"]
