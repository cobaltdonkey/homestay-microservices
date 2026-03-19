import os
from flask import Flask
from routes import main

def create_app():
    app = Flask(__name__)
    app.register_blueprint(main)
    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5010))
    app.run(host='0.0.0.0', port=port)
