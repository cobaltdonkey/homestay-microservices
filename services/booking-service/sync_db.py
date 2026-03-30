from sqlalchemy import text

app = create_app()
with app.app_context():
    print("Syncing database schema (adding columns if missing)...")
    
    # Raw SQL checks for Postgres (ALTER TABLE ADD COLUMN IF NOT EXISTS)
    alter_queries = [
        "ALTER TABLE booking ADD COLUMN IF NOT EXISTS listing_title VARCHAR(255)",
        "ALTER TABLE booking ADD COLUMN IF NOT EXISTS listing_image TEXT",
        "ALTER TABLE booking ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2)",
        "ALTER TABLE booking ADD COLUMN IF NOT EXISTS guests INTEGER"
    ]
    
    for query in alter_queries:
        try:
            db.session.execute(text(query))
            print(f"Executed: {query}")
        except Exception as e:
            print(f"Error executing {query}: {e}")
            
    db.session.commit()
    print("Database sync complete.")
