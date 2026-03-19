FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y default-libmysqlclient-dev pkg-config gcc && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# The shared folder is mounted at /app/shared at runtime via docker-compose
CMD ["python", "app.py"]
