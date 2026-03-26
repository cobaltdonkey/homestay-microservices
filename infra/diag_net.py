import psycopg2
import socket
import os
from urllib.parse import urlparse

def test_connection(host, port):
    print(f"Testing {host}:{port}...")
    try:
        s = socket.create_connection((host, port), timeout=5)
        s.close()
        print(f"  SUCCESS: {host}:{port} is REACHABLE")
        return True
    except Exception as e:
        print(f"  FAILED: {host}:{port} - {e}")
        return False

def test_db_auth(url):
    print(f"Testing DB AUTH for: {url.split('@')[1]}...")
    try:
        conn = psycopg2.connect(url, connect_timeout=5)
        conn.close()
        print("  SUCCESS: AUTHENTICATED")
        return True
    except Exception as e:
        print(f"  FAILED: AUTH - {e}")
        return False

def main():
    project_ref = "tqwoqxxpzfqdcnarmneh"
    password = "esd123esd12"
    
    # formats to test on the known reachable host
    host = "aws-0-ap-southeast-1.pooler.supabase.com"
    
    test_urls = [
        f"postgresql://postgres.{project_ref}:{password}@{host}:6543/postgres", # Standard Pooler
        f"postgresql://postgres:{password}@{host}:6543/postgres",              # Legacy/Direct-ish
        f"postgresql://{project_ref}:{password}@{host}:6543/postgres",        # Ref-as-user
    ]
    
    print("--- Network Probe Start ---")
    if test_connection(host, 6543):
        for url in test_urls:
            test_db_auth(url)
    print("--- Network Probe End ---")

if __name__ == "__main__":
    main()
