import os
from dotenv import load_dotenv

load_dotenv()
from flask import Flask
from db import db
from routes import main
import psycopg2

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
    
    # Ensure scheme/table + column creation
    with app.app_context():
        import models
        db.create_all()
        # In SQLAlchemy if columns don't exist it doesn't add them. I should try to raw execute alter table if needed, but the prompt says just make it run and it's a new database context.
        # But wait, existing booking table won't get new columns via create_all. Let's do a workaround.
        try:
            db.session.execute(db.text("ALTER TABLE booking_db.booking ADD COLUMN IF NOT EXISTS booking_amount NUMERIC(10, 2);"))
            db.session.execute(db.text("ALTER TABLE booking_db.booking ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10, 2);"))
            db.session.execute(db.text("ALTER TABLE booking_db.booking ADD COLUMN IF NOT EXISTS listing_title VARCHAR(255);"))
            db.session.execute(db.text("ALTER TABLE booking_db.booking ADD COLUMN IF NOT EXISTS listing_image VARCHAR(500);"))
            db.session.execute(db.text("ALTER TABLE booking_db.booking ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2);"))
            db.session.execute(db.text("ALTER TABLE booking_db.booking ADD COLUMN IF NOT EXISTS guests INTEGER;"))
            db.session.commit()
        except BaseException as e:
            # Table might not exist yet, or not postgres
            db.session.rollback()

    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5012))
    app.run(host='0.0.0.0', port=port)
