import os
import threading
import time
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()
from flask import Flask
from db import db
from routes import main

def run_cleanup(app):
    with app.app_context():
        while True:
            try:
                from models import Hold
                from db import db
                now = datetime.utcnow()
                # Delete EXPIRED holds if they have passed their deadline
                count = Hold.query.filter(Hold.expires_at <= now).delete()
                if count > 0:
                    db.session.commit()
                    print(f"[BACKGROUND CLEANUP] Deleted {count} expired holds at {now}", flush=True)
                else:
                    db.session.rollback()
            except Exception as e:
                db.session.rollback()
                print(f"[BACKGROUND CLEANUP ERROR] {e}", flush=True)
            time.sleep(5)

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

    # Start the background background cleanup thread
    cleanup_thread = threading.Thread(target=run_cleanup, args=(app,), daemon=True)
    cleanup_thread.start()

    return app


if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get('PORT', 5005))
    app.run(host='0.0.0.0', port=port)

