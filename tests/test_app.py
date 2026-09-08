import json
import os
import unittest
from app import app, DATA_FILE, load_quotes


class TestWisdomVaultApp(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    # --- Dataset Integrity Tests ---
    def test_quotes_file_exists_and_valid(self):
        self.assertTrue(os.path.exists(DATA_FILE), "quotes.json must exist")
        quotes = load_quotes()
        self.assertEqual(len(quotes), 100, f"Expected 100 quotes, found {len(quotes)}")

    def test_quotes_schema(self):
        quotes = load_quotes()
        ids = set()
        for q in quotes:
            self.assertIn("id", q)
            self.assertIn("quote", q)
            self.assertIn("author", q)
            self.assertIn("category", q)

            self.assertIsInstance(q["id"], int)
            self.assertIsInstance(q["quote"], str)
            self.assertIsInstance(q["author"], str)
            self.assertIsInstance(q["category"], str)

            self.assertTrue(len(q["quote"].strip()) > 0)
            self.assertTrue(len(q["author"].strip()) > 0)
            self.assertTrue(len(q["category"].strip()) > 0)

            ids.add(q["id"])

        self.assertEqual(len(ids), 100, "All 100 quotes must have unique IDs")

    # --- Page Route Tests ---
    def test_index_route(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        html = response.get_data(as_text=True)
        self.assertIn("Wisdom Vault", html)
        self.assertIn("spotlightCard", html)
        self.assertIn("authorSearchInput", html)

    # --- Random Quote Endpoint Tests ---
    def test_random_quote_endpoint(self):
        response = self.client.get("/api/quotes/random")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn("id", data)
        self.assertIn("quote", data)
        self.assertIn("author", data)
        self.assertIn("category", data)

    def test_random_quote_with_category(self):
        response = self.client.get("/api/quotes/random?category=Philosophy")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["category"].lower(), "philosophy")

    def test_random_quote_not_found(self):
        response = self.client.get("/api/quotes/random?category=ImaginaryCategory999")
        self.assertEqual(response.status_code, 404)

    # --- Search & Filter Endpoint Tests ---
    def test_get_all_quotes(self):
        response = self.client.get("/api/quotes")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["total"], 100)
        self.assertEqual(len(data["quotes"]), 100)

    def test_search_quotes_by_author(self):
        response = self.client.get("/api/quotes?author=Einstein")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertGreaterEqual(data["total"], 1)
        for q in data["quotes"]:
            self.assertIn("einstein", q["author"].lower())

    def test_search_quotes_by_category(self):
        response = self.client.get("/api/quotes?category=Science")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertGreaterEqual(data["total"], 1)
        for q in data["quotes"]:
            self.assertEqual(q["category"].lower(), "science")

    def test_search_quotes_author_and_category_combined(self):
        response = self.client.get("/api/quotes?author=Einstein&category=Science")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertGreaterEqual(data["total"], 1)
        for q in data["quotes"]:
            self.assertIn("einstein", q["author"].lower())
            self.assertEqual(q["category"].lower(), "science")

    def test_search_no_results(self):
        response = self.client.get("/api/quotes?author=NobodyWithThisName12345")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["total"], 0)
        self.assertEqual(len(data["quotes"]), 0)

    # --- Categories Endpoint Tests ---
    def test_categories_endpoint(self):
        response = self.client.get("/api/categories")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["total"], 100)
        self.assertGreater(len(data["categories"]), 0)
        total_counted = sum(c["count"] for c in data["categories"])
        self.assertEqual(total_counted, 100)

    # --- Authors Endpoint Tests ---
    def test_authors_endpoint(self):
        response = self.client.get("/api/authors")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertGreater(data["total"], 0)
        self.assertIn("Albert Einstein", data["authors"])
        self.assertIn("Socrates", data["authors"])

    # --- Static Assets Delivery Tests ---
    def test_static_css(self):
        response = self.client.get("/static/css/style.css")
        self.assertEqual(response.status_code, 200)
        self.assertIn("spotlight-card", response.get_data(as_text=True))

    def test_static_js(self):
        response = self.client.get("/static/js/app.js")
        self.assertEqual(response.status_code, 200)
        self.assertIn("loadRandomQuote", response.get_data(as_text=True))


if __name__ == "__main__":
    unittest.main()
