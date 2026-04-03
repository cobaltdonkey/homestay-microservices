import os
import requests
from dotenv import load_dotenv

load_dotenv()

def find_pending():
    url = "http://localhost:8000/bookings?status=PENDING_HOST"
    try:
        res = requests.get(url)
        print(f"Status: {res.status_code}")
        print(f"Body: {res.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    find_pending()
