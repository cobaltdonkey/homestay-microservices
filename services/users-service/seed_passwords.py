"""
seed_passwords.py — Run once after docker compose up to set demo user passwords.

Usage:
    docker exec homestay-microservices-users-service-1 python /app/seed_passwords.py

This script is necessary because werkzeug scrypt hashes use a random salt, so they
cannot be pre-computed and embedded in static SQL seed files.
"""
from app import create_app
from db import db
from models import UserProfile
from werkzeug.security import generate_password_hash

DEMO_PASSWORD = 'password123'
DEMO_EMAILS = ['alice2@demo.com', 'bob2@demo.com']

app = create_app()
with app.app_context():
    h = generate_password_hash(DEMO_PASSWORD)
    updated = 0
    for email in DEMO_EMAILS:
        user = UserProfile.query.filter_by(email=email).first()
        if user:
            user.password = h
            updated += 1
            print(f'  [OK] Updated password for {email}')
        else:
            print(f'  [SKIP] User not found: {email}')
    db.session.commit()
    print(f'\nDone. Updated {updated} user(s). Password: {DEMO_PASSWORD}')
