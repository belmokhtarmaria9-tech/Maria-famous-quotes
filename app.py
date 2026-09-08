import json
import os
import random
from flask import Flask, jsonify, render_template, request

app = Flask(__name__, template_folder="templates", static_folder="static")

DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "quotes.json")


def load_quotes():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/quotes/random")
def get_random_quote():
    quotes = load_quotes()
    category = request.args.get("category", "").strip().lower()
    author = request.args.get("author", "").strip().lower()

    filtered = quotes
    if category and category != "all":
        filtered = [q for q in filtered if q["category"].lower() == category]
    if author:
        filtered = [q for q in filtered if author in q["author"].lower()]

    if not filtered:
        return jsonify({"error": "No quotes found matching criteria"}), 404

    selected = random.choice(filtered)
    return jsonify(selected)


@app.route("/api/quotes")
def get_quotes():
    quotes = load_quotes()
    category = request.args.get("category", "").strip().lower()
    author = request.args.get("author", "").strip().lower()
    query = request.args.get("q", "").strip().lower()

    filtered = quotes
    if category and category != "all":
        filtered = [q for q in filtered if q["category"].lower() == category]
    if author:
        filtered = [q for q in filtered if author in q["author"].lower()]
    if query:
        filtered = [
            q for q in filtered
            if query in q["quote"].lower() or query in q["author"].lower() or query in q["category"].lower()
        ]

    return jsonify({
        "total": len(filtered),
        "quotes": filtered
    })


@app.route("/api/categories")
def get_categories():
    quotes = load_quotes()
    counts = {}
    for q in quotes:
        cat = q["category"]
        counts[cat] = counts.get(cat, 0) + 1

    sorted_categories = sorted(
        [{"name": name, "count": count} for name, count in counts.items()],
        key=lambda x: x["name"]
    )
    return jsonify({
        "total": len(quotes),
        "categories": sorted_categories
    })


@app.route("/api/authors")
def get_authors():
    quotes = load_quotes()
    authors = sorted(list(set(q["author"] for q in quotes if q.get("author"))))
    return jsonify({"authors": authors, "total": len(authors)})


@app.errorhandler(404)
def not_found(e):
    if request.path.startswith("/api/"):
        return jsonify({"error": "Resource not found"}), 404
    return render_template("index.html"), 404


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
