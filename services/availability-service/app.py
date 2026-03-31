import os
from dotenv import load_dotenv

load_dotenv()
from flask import Flask
from db import db
from routes import main
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__)

    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL is not set")

    # Ensure search_path is set to the availability_db schema
    if "options=-csearch_path" not in database_url:
        separator = "&" if "?" in database_url else "?"
        database_url = f"{database_url}{separator}options=-csearch_path%3Davailability_db"

    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    app.register_blueprint(main)

    return app


if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get('PORT', 5005))
    app.run(host='0.0.0.0', port=port)

