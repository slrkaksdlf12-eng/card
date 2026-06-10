from flask import Flask, render_template, request, redirect, url_for, session, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import json
import os
import random
from datetime import datetime

app = Flask(__name__)
app.secret_key = "card_secret_key"

# =====================
# POSTGRESQL DB 설정
# =====================
app.config['SQLALCHEMY_DATABASE_URI'] = "postgresql://jmdraw_user:hU1yO5dG24zFkuNjj7adkZVQ8BQ5eaWK@dpg-d8gekgvlk1mc73eq3ac0-a.singapore-postgres.render.com/jmdraw"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# -------------------
# USER MODEL
# -------------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# -------------------
# COLLECTION MODEL
# -------------------
class Collection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    rarity = db.Column(db.String(10))  # N / SR / SSR
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# =====================================================
# LOGIN PAGE
# =====================================================
@app.route("/")
def login():
    if "user" in session:
        return redirect(url_for("lobby"))
    return render_template("index.html")


# =====================================================
# REGISTER
# =====================================================
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]

        existing = User.query.filter_by(username=username).first()
        if existing:
            return redirect(url_for("register"))

        user = User(
            username=username,
            password_hash=generate_password_hash(password)
        )

        db.session.add(user)
        db.session.commit()

        return redirect(url_for("login"))

    return render_template("register.html")


# =====================================================
# LOGIN ACTION
# =====================================================
@app.route("/login", methods=["POST"])
def login_post():
    username = request.form["username"]
    password = request.form["password"]

    user = User.query.filter_by(username=username).first()

    if user and check_password_hash(user.password_hash, password):
        session["user"] = user.id
        return redirect(url_for("lobby"))

    return redirect(url_for("login"))


# =====================================================
# INTRO
# =====================================================
@app.route("/intro")
def intro():
    return render_template("intro.html")


# =====================================================
# LOBBY
# =====================================================
@app.route("/lobby")
def lobby():
    if "user" not in session:
        return redirect(url_for("login"))

    return render_template("lobby.html")


# =====================================================
# GACHA PAGE
# =====================================================
@app.route("/gacha")
def gacha():
    if "user" not in session:
        return redirect(url_for("login"))

    return render_template("gacha.html")


# =====================================================
# COLLECTION PAGE
# =====================================================
@app.route("/collection")
def collection():
    if "user" not in session:
        return redirect(url_for("login"))

    return render_template("collection.html")


# =====================================================
# LOGOUT
# =====================================================
@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect(url_for("login"))


# =====================================================
# 🌏 I18N API
# =====================================================
@app.route("/api/lang/<lang>")
def get_lang(lang):
    try:
        path = os.path.join("static", "lang", f"{lang}.json")
        with open(path, "r", encoding="utf-8") as f:
            return jsonify(json.load(f))
    except:
        return jsonify({})


# =====================================================
# 🎯 GACHA API (DB 저장 핵심)
# =====================================================
@app.route("/api/gacha", methods=["POST"])
def api_gacha():
    if "user" not in session:
        return jsonify({"error": "unauthorized"}), 401

    result = random.choice(["N", "SR", "SSR"])

    card = Collection(
        user_id=session["user"],
        rarity=result
    )

    db.session.add(card)
    db.session.commit()

    return jsonify({"result": result})


# =====================================================
# 📦 COLLECTION API
# =====================================================
@app.route("/api/collection")
def api_collection():
    if "user" not in session:
        return jsonify([])

    cards = Collection.query.filter_by(user_id=session["user"]).all()

    return jsonify([
        {
            "rarity": c.rarity,
            "time": c.created_at.isoformat()
        }
        for c in cards
    ])


# =====================================================
# PWA SUPPORT
# =====================================================
@app.route("/manifest.json")
def manifest():
    return send_from_directory("static", "manifest.json")


@app.route("/sw.js")
def service_worker():
    return send_from_directory("static/js", "sw.js")


# =====================================================
# INIT DB
# =====================================================
with app.app_context():
    db.create_all()


# =====================================================
# RUN
# =====================================================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)