import os
import hashlib
import hmac
import secrets
from datetime import datetime
from functools import wraps

# pyrefly: ignore [missing-import]
import mysql.connector
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "db"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "database": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
}


def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)


def hash_password(password):
    salt = secrets.token_bytes(16)
    iterations = 200_000
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        iterations,
    )
    return f"pbkdf2_sha256${iterations}${salt.hex()}${digest.hex()}"


def verify_password(password, stored_hash):
    try:
        algorithm, iterations, salt_hex, digest_hex = stored_hash.split("$")
        if algorithm != "pbkdf2_sha256":
            return False

        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            bytes.fromhex(salt_hex),
            int(iterations),
        )

        return hmac.compare_digest(digest.hex(), digest_hex)
    except Exception:
        return False


def token_required(route_function):
    @wraps(route_function)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authorization token required"}), 401

        token = auth_header.split(" ", 1)[1]

        try:
            user_id = int(token)
        except ValueError:
            return jsonify({"error": "Invalid token"}), 401

        connection = None
        cursor = None

        try:
            connection = get_db_connection()
            cursor = connection.cursor(dictionary=True)

            cursor.execute(
                "SELECT id, name, email, created_at FROM users WHERE id = %s",
                (user_id,),
            )
            user = cursor.fetchone()

            if not user:
                return jsonify({"error": "User not found"}), 401

            return route_function(user, *args, **kwargs)

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

    return wrapper


@app.get("/health")
def health():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()

        return jsonify({
            "status": "ok",
            "service": "flask-backend",
            "database": "connected"
        })

    except mysql.connector.Error:
        return jsonify({
            "status": "error",
            "service": "flask-backend",
            "database": "unavailable"
        }), 503

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@app.post("/api/register")
def register():
    data = request.get_json(silent=True) or {}

    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not name:
        return jsonify({"error": "Name is required"}), 400

    if not email or "@" not in email:
        return jsonify({"error": "Valid email is required"}), 400

    if len(password) < 6:
        return jsonify({
            "error": "Password must be at least 6 characters"
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "SELECT id FROM users WHERE email = %s",
            (email,),
        )

        if cursor.fetchone():
            return jsonify({
                "error": "Email already registered"
            }), 409

        password_hash = hash_password(password)

        cursor.execute(
            """
            INSERT INTO users (name, email, password_hash)
            VALUES (%s, %s, %s)
            """,
            (name, email, password_hash),
        )

        connection.commit()

        return jsonify({
            "message": "Registration successful"
        }), 201

    except mysql.connector.Error:
        if connection:
            connection.rollback()

        return jsonify({
            "error": "Database error"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@app.post("/api/login")
def login():
    data = request.get_json(silent=True) or {}

    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not email or not password:
        return jsonify({
            "error": "Email and password are required"
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT id, name, email, password_hash, created_at
            FROM users
            WHERE email = %s
            """,
            (email,),
        )

        user = cursor.fetchone()

        if not user or not verify_password(
            password,
            user["password_hash"],
        ):
            return jsonify({
                "error": "Invalid email or password"
            }), 401

        token = str(user["id"])

        return jsonify({
            "message": "Login successful",
            "token": token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "created_at": (
                    user["created_at"].isoformat()
                    if isinstance(user["created_at"], datetime)
                    else user["created_at"]
                ),
            },
        })

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@app.get("/api/me")
@token_required
def me(user):
    created_at = user["created_at"]

    return jsonify({
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "created_at": (
            created_at.isoformat()
            if isinstance(created_at, datetime)
            else created_at
        ),
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)