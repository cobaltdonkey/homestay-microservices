import os
from dotenv import load_dotenv

load_dotenv()
import threading
from flask import Flask
from routes import main
from consumer import start_consumer
from db import db

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    app.register_blueprint(main)

    with app.app_context():
        db.create_all()

    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5011))

    consumer_thread = threading.Thread(target=start_consumer, args=(app,), daemon=True)
    consumer_thread.start()

    app.run(host='0.0.0.0', port=port)

