from flask import Flask, render_template, request, redirect, url_for, session, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
import json
import os

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
    password = db.Column(db.String(80), nullable=False)

# -------------------
# LOGIN PAGE
# -------------------
@app.route("/")
def login():
    if "user" in session:
        return redirect(url_for("lobby"))
    return render_template("index.html")

# -------------------
# REGISTER PAGE
# -------------------
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]

        existing = User.query.filter_by(username=username).first()
        if existing:
            return redirect(url_for("register"))

        user = User(username=username, password=password)
        db.session.add(user)
        db.session.commit()

        return redirect(url_for("login"))

    return render_template("register.html")

# -------------------
# LOGIN ACTION
# -------------------
@app.route("/login", methods=["POST"])
def login_post():
    username = request.form["username"]
    password = request.form["password"]

    user = User.query.filter_by(username=username, password=password).first()

    if user:
        session["user"] = username
        return redirect(url_for("intro"))
    else:
        return redirect(url_for("login"))

# -------------------
# INTRO
# -------------------
@app.route("/intro")
def intro():
    return render_template("intro.html")

# -------------------
# LOBBY
# -------------------
@app.route("/lobby")
def lobby():
    if "user" not in session:
        return redirect(url_for("login"))

    return render_template("lobby.html", user=session["user"])

# -------------------
# GACHA
# -------------------
@app.route("/gacha")
def gacha():
    if "user" not in session:
        return redirect(url_for("login"))

    return render_template("gacha.html")

# -------------------
# COLLECTION
# -------------------
@app.route("/collection")
def collection():
    return render_template("collection.html")

# -------------------
# LOGOUT
# -------------------
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
            data = json.load(f)
        return jsonify(data)
    except Exception:
        return jsonify({})

# =====================================================
# 🚀 PWA SUPPORT (추가된 부분)
# =====================================================

# manifest.json 서빙
@app.route("/manifest.json")
def manifest():
    return send_from_directory("static", "manifest.json")

# service worker 서빙
@app.route("/sw.js")
def service_worker():
    return send_from_directory("static/js", "sw.js")


# -------------------
# RUN (Render용)
# -------------------
with app.app_context():
    db.create_all()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)