import os
from flask import Flask
from db import db
from sqlalchemy import text
from app import create_app

app = create_app()

with app.app_context():
    print("Syncing availability database schema...")
    
    # Ensure the schema exists
    db.session.execute(text("CREATE SCHEMA IF NOT EXISTS availability_db"))
    db.session.commit()
    
    # Create tables defined in models.py
    # Since we set __table_args__ = {'schema': 'availability_db'}, 
    # db.create_all() will create them in the availability_db schema.
    db.create_all()
    
    print("Database sync complete. Tables created in 'availability_db' schema.")
