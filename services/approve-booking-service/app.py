import os
from flask import Flask
from routes import bp

def create_app():
    app = Flask(__name__)
    app.register_blueprint(bp, name='main_root')
    # Also mount it on /bookings in case kong routes there
    app.register_blueprint(bp, url_prefix='/approve', name='approve_prefix')
    # Actually, the user asked for /approve. 
    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5013))
    app.run(host='0.0.0.0', port=port, debug=False)
