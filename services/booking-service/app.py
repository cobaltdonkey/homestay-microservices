import os
from dotenv import load_dotenv

load_dotenv()
from flask import Flask
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__)
    


    from routes import bp
    # Use url_prefix to cleanly handle all /bookings requests
    app.register_blueprint(bp, url_prefix='/bookings')
    # Also register it without a prefix for routes that don't have it (like root /health)
    app.register_blueprint(bp, name='main_root')

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(
        host='0.0.0.0',
        port=int(os.environ.get('PORT', 5001)),
        debug=False
    )

