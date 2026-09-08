# Wisdom Vault - 100 Famous Quotes Web Application

A full-featured web application built with **Python Flask**, **plain vanilla JavaScript (ES6+)**, **HTML5**, and responsive modern **CSS**. Explore, search, filter, and spotlight 100 timeless quotes from history's greatest philosophers, scientists, writers, and leaders.

---

## Features

- **Spotlight Hero Card**: Displays a random quote with attribution, category, and ID badge.
- **Random Quote Generator**: Click "New Random Quote" to load a new inspiration with smooth visual transitions.
- **Real-Time Author Search**: Instant debounced search filtering across authors and quotes with a clear button.
- **Dynamic Category Filter Pills**: Interactive pills showing quote counts for each category (*Philosophy, Science, Inspiration, Literature, Leadership, Wisdom, Humor, Life, Art*).
- **Interactive Quotes Grid**: Responsive grid displaying all quotes matching your search and category filters.
- **Quick Spotlight & Copy**:
  - Click any card in the grid to spotlight it at the top.
  - One-click copy with toast notification feedback.
  - Native Twitter/X share intent.
- **100% Vanilla Frontend**: Zero external JavaScript frameworks (no React, Vue, jQuery, or Bootstrap). Lightweight, fast, and accessible.
- **RESTful Flask API**: Clean JSON endpoints with filtering, search, and validation.

---

## Directory Structure

```
random-quotes-app/
├── app.py                  # Flask backend & REST endpoints
├── data/
│   └── quotes.json         # Curated database of 100 famous quotes
├── static/
│   ├── css/
│   │   └── style.css       # Responsive, modern CSS with CSS variables
│   └── js/
│       └── app.js          # Pure vanilla JS (DOM, fetch, clipboard, debounce)
├── templates/
│   └── index.html          # Semantic HTML5 layout
├── tests/
│   └── test_app.py         # Automated test suite (15 tests)
├── requirements.txt        # Flask dependencies
└── README.md               # Documentation
```

---

## Getting Started

### 1. Requirements
- Python 3.8+
- Flask

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Application
```bash
python app.py
```
Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## Running the Automated Tests

Run the test suite with Python's built-in `unittest`:
```bash
python -m unittest discover -s tests -p "test_*.py" -v
```

---

## API Endpoints

| Method | Endpoint | Query Parameters | Description |
|---|---|---|---|
| `GET` | `/` | — | Serves the main single-page application |
| `GET` | `/api/quotes/random` | `category`, `author` | Returns a single random quote (optionally filtered) |
| `GET` | `/api/quotes` | `author`, `category`, `q` | Returns filtered quotes with total count |
| `GET` | `/api/categories` | — | Returns list of categories with quote counts |
| `GET` | `/api/authors` | — | Returns sorted unique list of authors |

---

## Technologies Used

- **Backend**: Python 3, Flask 3.1
- **Frontend**: Plain Vanilla JavaScript (ES6+), HTML5, CSS3 Custom Properties
- **Testing**: Python `unittest`
