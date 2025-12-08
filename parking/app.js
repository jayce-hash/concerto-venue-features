let parkingData = {};
let venuesList = [];

const searchInput = document.getElementById("venueSearch");
const searchResultsEl = document.getElementById("searchResults");

const infoPanel = document.getElementById("infoPanel");
const infoContent = document.querySelector(".info-content");
const infoEmptyEl = document.querySelector(".info-empty");

const browseListEl = document.getElementById("browseList");

const venueNameEl = document.getElementById("venueName");
const venueLocationEl = document.getElementById("venueLocation");

const parkingNoteEl = document.getElementById("parkingNote");
const rideshareCardEl = document.getElementById("rideshareCard");
const rideshareTextEl = document.getElementById("rideshareText");
const lotsCardEl = document.getElementById("lotsCard");
const lotsListEl = document.getElementById("lotsList");
const officialCardEl = document.getElementById("officialCard");
const parkingLinkEl = document.getElementById("parkingLink");

// Fetch parking JSON on load
fetch("/data/parking.json")
  .then((res) => res.json())
  .then((data) => {
    parkingData = data || {};
    venuesList = buildVenuesList(parkingData);
    renderBrowseList();
  })
  .catch((err) => {
    console.error("Error loading parking.json", err);
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
  return slug
    .split("_")
    .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : ""))
    .join(" ");
}

function renderBrowseList() {
  if (!browseListEl || !venuesList.length) return;

  // Shuffle and take first 12
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

// Search behavior
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

// Click on search result
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

// Click on browse item
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
  const v = parkingData[slug];
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

  // Overview
  parkingNoteEl.textContent =
    v.note ||
    "Parking details for this venue are not available yet. Use the official parking page for the latest information.";

  // Rideshare
  const rideshare = (v.rideshare || "").trim();
  if (rideshare.length) {
    rideshareTextEl.textContent = rideshare;
    rideshareCardEl.hidden = false;
  } else {
    rideshareTextEl.textContent = "";
    rideshareCardEl.hidden = true;
  }

  // Lots
  if (Array.isArray(v.lots) && v.lots.length) {
    lotsListEl.innerHTML = v.lots.map((lot) => `<li>${lot}</li>`).join("");
    lotsCardEl.hidden = false;
  } else {
    lotsListEl.innerHTML = "";
    lotsCardEl.hidden = true;
  }

  // Official parking link
  if (v.officialParkingUrl) {
    parkingLinkEl.href = v.officialParkingUrl;
    officialCardEl.hidden = false;
  } else {
    parkingLinkEl.href = "#";
    officialCardEl.hidden = true;
  }
}
