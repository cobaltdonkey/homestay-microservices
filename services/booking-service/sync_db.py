import os
from flask import Flask
from db import db
from sqlalchemy import text
from app import create_app

app = create_app()

with app.app_context():
    print("Syncing booking database schema...")
    
    # Ensure the schema exists
    db.session.execute(text("CREATE SCHEMA IF NOT EXISTS booking"))
    db.session.commit()
    
    # Create tables defined in models.py
    # Since we set __table_args__ = {'schema': 'booking'}, 
    # db.create_all() will create them in the booking schema.
    db.create_all()
    
    print("Database sync complete. Tables created in 'booking' schema.")
