"""
Deposit Resolution Service — Pure Composite Orchestrator
=========================================================
This service has NO database or data ownership of its own.
It coordinates deposit resolution by calling other domain
services via synchronous HTTP REST and publishing async
events to RabbitMQ (AMQP).
"""
import os
from dotenv import load_dotenv

load_dotenv()

from flask import Flask


def create_app():
    app = Flask(__name__)

    from routes import bp
    app.register_blueprint(bp)

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(
        host='0.0.0.0',
        port=int(os.environ.get('PORT', 5002)),
        debug=False
    )
