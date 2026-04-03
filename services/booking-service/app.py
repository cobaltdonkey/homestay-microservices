import os
from dotenv import load_dotenv

load_dotenv()
from flask import Flask
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__)

    from routes import bp
    # Register blueprint once at root - routes.py already declares both
    # @bp.route('/bookings/...') and @bp.route('/...') decorators on each handler
    app.register_blueprint(bp)

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(
        host='0.0.0.0',
        port=int(os.environ.get('PORT', 5001)),
        debug=False
    )

