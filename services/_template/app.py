import os
from dotenv import load_dotenv

load_dotenv()
from flask import Flask
from db import db
from routes import main
from shared.constants import *

def create_app():
    app = Flask(__name__)
    
    # Configure Database from environment variable
    database_url = os.environ.get('DATABASE_URL', 'sqlite:///:memory:')
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize SQLAlchemy
    db.init_app(app)
    
    # Register blueprints
    app.register_blueprint(main)
    
    # Create tables
    with app.app_context():
        import models
        db.create_all()
        
    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)

