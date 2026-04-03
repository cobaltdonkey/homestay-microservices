import os
import requests
from dotenv import load_dotenv

load_dotenv()

def check_holds():
    url = "http://localhost:8000/availability/holds"
    try:
        res = requests.get(url)
        print(f"Status: {res.status_code}")
        print(f"Data: {res.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_holds()
