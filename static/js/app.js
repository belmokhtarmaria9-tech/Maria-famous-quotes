/**
 * Wisdom Vault - Plain Vanilla JavaScript Application
 * Interacts with Flask REST API without external libraries.
 */

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const spotlightQuote = document.getElementById("spotlightQuote");
  const spotlightAuthor = document.getElementById("spotlightAuthor");
  const spotlightCategory = document.getElementById("spotlightCategory");
  const spotlightId = document.getElementById("spotlightId");
  const btnNewRandom = document.getElementById("btnNewRandom");
  const btnCopyQuote = document.getElementById("btnCopyQuote");
  const btnShareQuote = document.getElementById("btnShareQuote");

  const authorSearchInput = document.getElementById("authorSearchInput");
  const btnClearSearch = document.getElementById("btnClearSearch");
  const btnResetFilters = document.getElementById("btnResetFilters");
  const btnEmptyReset = document.getElementById("btnEmptyReset");
  const categoryPillsContainer = document.getElementById("categoryPills");

  const resultsCount = document.getElementById("resultsCount");
  const quotesGrid = document.getElementById("quotesGrid");
  const emptyState = document.getElementById("emptyState");
  const totalQuotesBadge = document.getElementById("totalQuotesBadge");
  const toast = document.getElementById("toastNotification");
  const themeToggleBtn = document.getElementById("themeToggleBtn");

  // State
  let currentQuote = null;
  let activeCategory = "all";
  let searchDebounceTimer = null;
  let toastTimer = null;

  // Initial Load
  init();

  async function init() {
    initTheme();
    setupEventListeners();
    await Promise.all([
      loadCategories(),
      loadRandomQuote(),
      loadQuotes()
    ]);
  }

  function setupEventListeners() {
    // Spotlight actions
    btnNewRandom.addEventListener("click", () => {
      loadRandomQuote(activeCategory !== "all" ? activeCategory : "");
    });

    btnCopyQuote.addEventListener("click", () => {
      if (currentQuote) {
        copyQuoteToClipboard(currentQuote);
      }
    });

    btnShareQuote.addEventListener("click", () => {
      if (currentQuote) {
        shareQuote(currentQuote);
      }
    });

    // Author & keyword search
    authorSearchInput.addEventListener("input", (e) => {
      const query = e.target.value.trim();
      btnClearSearch.style.display = query.length > 0 ? "block" : "none";

      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        loadQuotes();
      }, 250);
    });

    btnClearSearch.addEventListener("click", () => {
      authorSearchInput.value = "";
      btnClearSearch.style.display = "none";
      loadQuotes();
      authorSearchInput.focus();
    });

    // Reset filters
    btnResetFilters.addEventListener("click", resetAllFilters);
    btnEmptyReset.addEventListener("click", resetAllFilters);
  }

  function resetAllFilters() {
    authorSearchInput.value = "";
    btnClearSearch.style.display = "none";
    setActiveCategory("all");
    loadQuotes();
  }

  /**
   * Load categories from Flask API and render filter pills
   */
  async function loadCategories() {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();

      totalQuotesBadge.textContent = `${data.total} Quotes`;

      renderCategoryPills(data.categories, data.total);
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  }

  function renderCategoryPills(categories, totalQuotes) {
    categoryPillsContainer.innerHTML = "";

    // "All" Pill
    const allPill = document.createElement("button");
    allPill.type = "button";
    allPill.className = "pill active";
    allPill.dataset.category = "all";
    allPill.innerHTML = `All <span class="pill-count">${totalQuotes}</span>`;
    allPill.addEventListener("click", () => onCategorySelect("all"));
    categoryPillsContainer.appendChild(allPill);

    // Individual category pills
    categories.forEach(cat => {
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = "pill";
      pill.dataset.category = cat.name.toLowerCase();
      pill.innerHTML = `${cat.name} <span class="pill-count">${cat.count}</span>`;
      pill.addEventListener("click", () => onCategorySelect(cat.name.toLowerCase()));
      categoryPillsContainer.appendChild(pill);
    });
  }

  function onCategorySelect(category) {
    setActiveCategory(category);
    loadQuotes();
  }

  function setActiveCategory(category) {
    activeCategory = category;
    const pills = categoryPillsContainer.querySelectorAll(".pill");
    pills.forEach(pill => {
      if (pill.dataset.category === category) {
        pill.classList.add("active");
      } else {
        pill.classList.remove("active");
      }
    });
  }

  /**
   * Load random quote from Flask API
   */
  async function loadRandomQuote(category = "") {
    try {
      btnNewRandom.disabled = true;
      spotlightQuote.style.opacity = "0.3";

      let url = "/api/quotes/random";
      const params = new URLSearchParams();
      if (category && category !== "all") {
        params.append("category", category);
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        // If filtered category has no quotes or fails, fall back to unfiltered random
        const fallbackRes = await fetch("/api/quotes/random");
        const fallbackData = await fallbackRes.json();
        renderSpotlightQuote(fallbackData);
        return;
      }

      const quote = await res.json();
      renderSpotlightQuote(quote);
    } catch (err) {
      console.error("Error loading random quote:", err);
      spotlightQuote.textContent = "Unable to load quote at this moment.";
    } finally {
      btnNewRandom.disabled = false;
      spotlightQuote.style.opacity = "1";
    }
  }

  function renderSpotlightQuote(quote) {
    currentQuote = quote;
    spotlightQuote.textContent = `"${quote.quote}"`;
    spotlightAuthor.textContent = `— ${quote.author}`;
    spotlightCategory.textContent = quote.category;
    spotlightId.textContent = `#${quote.id}`;
  }

  /**
   * Load quotes list based on search input and selected category
   */
  async function loadQuotes() {
    try {
      quotesGrid.setAttribute("aria-busy", "true");
      const authorQuery = authorSearchInput.value.trim();

      const params = new URLSearchParams();
      if (activeCategory && activeCategory !== "all") {
        params.append("category", activeCategory);
      }
      if (authorQuery) {
        params.append("author", authorQuery);
      }

      const url = `/api/quotes?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch quotes");

      const data = await res.json();
      renderQuotesGrid(data.quotes, data.total);
    } catch (err) {
      console.error("Error fetching quotes:", err);
      resultsCount.textContent = "Error loading quotes.";
    } finally {
      quotesGrid.setAttribute("aria-busy", "false");
    }
  }

  function renderQuotesGrid(quotes, total) {
    quotesGrid.innerHTML = "";

    if (!quotes || quotes.length === 0) {
      quotesGrid.style.display = "none";
      emptyState.style.display = "block";
      resultsCount.textContent = "0 quotes found";
      return;
    }

    quotesGrid.style.display = "grid";
    emptyState.style.display = "none";
    resultsCount.textContent = `Showing ${total} ${total === 1 ? "quote" : "quotes"}`;

    quotes.forEach(item => {
      const card = document.createElement("article");
      card.className = "quote-card";
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "article");
      card.setAttribute("aria-label", `Quote by ${item.author}`);

      card.innerHTML = `
        <div class="quote-card-header">
          <span class="card-category">${escapeHtml(item.category)}</span>
          <span class="card-id">#${item.id}</span>
        </div>
        <p class="card-body">"${escapeHtml(item.quote)}"</p>
        <div class="quote-card-footer">
          <span class="card-author">${escapeHtml(item.author)}</span>
          <button type="button" class="card-copy-btn" title="Copy this quote" aria-label="Copy quote by ${escapeHtml(item.author)}">
            &#128203; Copy
          </button>
        </div>
      `;

      // Spotlight quote on card click
      card.addEventListener("click", (e) => {
        // Prevent spotlighting if copy button was clicked
        if (e.target.closest(".card-copy-btn")) return;
        renderSpotlightQuote(item);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      // Copy button on card
      const copyBtn = card.querySelector(".card-copy-btn");
      copyBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        copyQuoteToClipboard(item);
      });

      // Keyboard accessibility (Enter to spotlight)
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          renderSpotlightQuote(item);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });

      quotesGrid.appendChild(card);
    });
  }

  /**
   * Clipboard Copy with Toast Notification
   */
  async function copyQuoteToClipboard(quoteObj) {
    const formatted = `"${quoteObj.quote}" — ${quoteObj.author}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(formatted);
      } else {
        // Fallback for older browsers / environments
        const textArea = document.createElement("textarea");
        textArea.value = formatted;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      showToast("Quote copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy quote:", err);
      showToast("Could not copy to clipboard.");
    }
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);
  }

  /**
   * Share on Twitter / X
   */
  function shareQuote(quoteObj) {
    const text = encodeURIComponent(`"${quoteObj.quote}" — ${quoteObj.author}`);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
  }

  /**
   * Theme Switcher (Dark / Light mode)
   */
  function initTheme() {
    const savedTheme = localStorage.getItem("wisdom_vault_theme");
    if (savedTheme) {
      applyTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(prefersDark ? "dark" : "light");
    }

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        applyTheme(newTheme);
        localStorage.setItem("wisdom_vault_theme", newTheme);
      });
    }
  }

  function applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      if (themeToggleBtn) {
        themeToggleBtn.setAttribute("title", "Switch to light mode");
        themeToggleBtn.setAttribute("aria-label", "Switch to light mode");
      }
    } else {
      document.documentElement.removeAttribute("data-theme");
      if (themeToggleBtn) {
        themeToggleBtn.setAttribute("title", "Switch to dark mode");
        themeToggleBtn.setAttribute("aria-label", "Switch to dark mode");
      }
    }
  }

  function escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
});
