import os
from dotenv import load_dotenv

load_dotenv()
from flask import Flask
from routes import main

def create_app():
    from routes import DEMO_MODE
    app = Flask(__name__)
    app.register_blueprint(main)
    
    status = "DEMO MODE" if DEMO_MODE else "REAL MODE (Stripe enabled)"
    print(f" * [SYSTEM] payment-gateway-wrapper starting in {status}", flush=True)
    
    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5010))
    app.run(host='0.0.0.0', port=port)

