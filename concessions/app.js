let concessionsData = {};
let venuesList = [];

const searchInput = document.getElementById("venueSearch");
const searchResultsEl = document.getElementById("searchResults");

const infoPanel = document.getElementById("infoPanel");
const infoContent = document.querySelector(".info-content");
const infoEmptyEl = document.querySelector(".info-empty");
const browseListEl = document.getElementById("browseList");

const venueNameEl = document.getElementById("venueName");
const venueLocationEl = document.getElementById("venueLocation");
const concessionsNoteEl = document.getElementById("concessionsNote");
const standsCardEl = document.getElementById("standsCard");
const standsListEl = document.getElementById("standsList");
const officialCardEl = document.getElementById("officialCard");
const concessionsLinkEl = document.getElementById("concessionsLink");

// Fetch JSON on load
fetch("/data/concessions.json")
  .then((res) => res.json())
  .then((data) => {
    concessionsData = data || {};
    venuesList = buildVenuesList(concessionsData);
    renderBrowseList();

    // 👇 NEW: auto-open venue if ?venueId= or ?venue= present
    autoOpenVenueFromQuery();
  })
  .catch((err) => {
    console.error("Error loading concessions.json", err);
  });

function buildVenuesList(data) {
  const items = [];
  for (const slug in data) {
    const v = data[slug];
    const nameGuess = prettifySlug(slug);
    const city = v.city || "";
    const state = v.state || "";
    const label = state ? `${nameGuess} — ${city}, ${state}` : nameGuess;

    items.push({ slug, label, city, state, displayName: nameGuess });
  }
  return items.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

function prettifySlug(slug) {
  if (!slug) return "";
  const parts = slug.split("_").map((p) => {
    if (!p) return "";
    return p.charAt(0).toUpperCase() + p.slice(1);
  });
  return parts.join(" ");
}

function renderBrowseList() {
  if (!browseListEl || !venuesList.length) return;

  const shuffled = [...venuesList];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const sample = shuffled.slice(0, 12);

  browseListEl.innerHTML = sample
    .map(
      (v) =>
        `<div class="browse-item" data-slug="${v.slug}">
          ${v.label}
        </div>`
    )
    .join("");
}

// Search handling
searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) {
    searchResultsEl.classList.remove("visible");
    searchResultsEl.innerHTML = "";
    if (browseListEl) browseListEl.style.display = "block";
    return;
  }

  if (browseListEl) browseListEl.style.display = "none";

  const matches = venuesList.filter((v) =>
    v.displayName.toLowerCase().includes(q)
  );

  if (!matches.length) {
    searchResultsEl.classList.remove("visible");
    searchResultsEl.innerHTML = "";
    return;
  }

  searchResultsEl.innerHTML = matches
    .map(
      (v) =>
        `<div class="search-result-item" data-slug="${v.slug}">
          ${v.label}
        </div>`
    )
    .join("");

  searchResultsEl.classList.add("visible");
});

// Click on a search result
searchResultsEl.addEventListener("click", (evt) => {
  const item = evt.target.closest(".search-result-item");
  if (!item) return;
  const slug = item.getAttribute("data-slug");
  const venue = venuesList.find((v) => v.slug === slug);
  if (!venue) return;

  searchInput.value = venue.displayName;
  searchResultsEl.classList.remove("visible");
  showVenue(slug);
});

// Click on a browse item
if (browseListEl) {
  browseListEl.addEventListener("click", (evt) => {
    const item = evt.target.closest(".browse-item");
    if (!item) return;
    const slug = item.getAttribute("data-slug");
    showVenue(slug);
  });
}

// Hide search dropdown when clicking away
document.addEventListener("click", (evt) => {
  if (!searchResultsEl.contains(evt.target) && evt.target !== searchInput) {
    searchResultsEl.classList.remove("visible");
  }
});

function showVenue(slug) {
  const v = concessionsData[slug];
  if (!v) return;

  infoPanel.classList.remove("info-panel--empty");
  infoContent.hidden = false;
  if (infoEmptyEl) infoEmptyEl.style.display = "none";

  const prettyName = prettifySlug(slug);
  venueNameEl.textContent = prettyName;

  const locParts = [];
  if (v.city) locParts.push(v.city);
  if (v.state) locParts.push(v.state);
  venueLocationEl.textContent = locParts.join(", ");

  concessionsNoteEl.textContent =
    v.note ||
    "Concessions details for this venue are not available yet. Use the official concessions page for the latest information.";

  // Stands
  if (Array.isArray(v.stands) && v.stands.length) {
    standsListEl.innerHTML = v.stands.map((s) => `<li>${s}</li>`).join("");
    standsCardEl.hidden = false;
  } else {
    standsListEl.innerHTML = "";
    standsCardEl.hidden = true;
  }

  // Official link
  if (v.officialConcessionsUrl) {
    concessionsLinkEl.href = v.officialConcessionsUrl;
    officialCardEl.hidden = false;
  } else {
    concessionsLinkEl.href = "#";
    officialCardEl.hidden = true;
  }
}

/* ========= NEW: deep-link support via ?venueId= or ?venue= ========= */

function getVenueIdFromQuery() {
  try {
    const params = new URLSearchParams(window.location.search || "");
    return params.get("venueId") || params.get("venue") || null;
  } catch (e) {
    console.warn("Unable to read query params", e);
    return null;
  }
}

function autoOpenVenueFromQuery() {
  const raw = getVenueIdFromQuery();
  if (!raw || !Array.isArray(venuesList) || !venuesList.length) return;

  const needle = raw.toLowerCase();

  // 1) Try slug match
  let match =
    venuesList.find((v) => (v.slug || "").toLowerCase() === needle) || null;

  // 2) Fallback: match by displayName
  if (!match) {
    match =
      venuesList.find(
        (v) => (v.displayName || "").toLowerCase() === needle
      ) || null;
  }

  if (!match) return;

  // Open like a user tap
  showVenue(match.slug);
}
