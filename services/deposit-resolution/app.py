import os
from dotenv import load_dotenv

load_dotenv()
from flask import Flask
from db import db


def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    with app.app_context():
        import models
        db.create_all()

    from routes import bp
    app.register_blueprint(bp)

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(
        host='0.0.0.0',
        port=int(os.environ.get('PORT', 5002)),
        debug=False
    )

