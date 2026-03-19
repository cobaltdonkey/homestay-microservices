import os
from flask import Flask
from db import db
from routes import main
from shared.constants import *

def create_app():
    app = Flask(__name__)
    
    database_url = os.environ.get('DATABASE_URL', 'sqlite:///:memory:')
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    app.register_blueprint(main)
    
    with app.app_context():
        import models
        db.create_all()
        
    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5005))
    app.run(host='0.0.0.0', port=port)
