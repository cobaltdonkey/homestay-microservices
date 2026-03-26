import os
from flask import Flask
from db import db
from routes import main
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(name)

    # Use USER_DB_URL (from your .env)
    database_url = os.environ.get('USER_DB_URL')

    # Add SSL for Supabase
    if database_url and "sslmode" not in database_url:
        database_url += "?sslmode=require"

    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    app.register_blueprint(main)

    return app


if name == 'main':
    app = create_app()
    port = int(os.environ.get('PORT', 5003))
    app.run(host='0.0.0.0', port=port)