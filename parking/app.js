// Concerto — Parking Guides (Pro-style, matching Venue Map visual system)

// Elements
const searchInput = document.getElementById("venueSearch");
const searchResultsDropdown = document.getElementById("searchResults");

const listView = document.getElementById("listView");
const detailView = document.getElementById("detailView");
const venueListEl = document.getElementById("venueList");

const backToListBtn = document.getElementById("backToListBtn");
const detailVenueNameEl = document.getElementById("detailVenueName");
const detailUpdatedEl = document.getElementById("detailUpdated");
const parkingNoteEl = document.getElementById("parkingNote");
const parkingStatusEl = document.getElementById("parkingStatus");
const openParkingPageBtn = document.getElementById("openParkingPageBtn");
const openMapsBtn = document.getElementById("openMapsBtn");

let parkingData = {};
let venueIds = [];

// Slug → display name
function displayNameFromSlug(slug) {
  return slug
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ========== LIST RENDERING ==========

function renderList(filterText = "") {
  const term = filterText.trim().toLowerCase();
  venueListEl.innerHTML = "";

  const filteredIds = venueIds.filter((id) => {
    const name = displayNameFromSlug(id).toLowerCase();
    return !term || name.includes(term);
  });

  if (!filteredIds.length) {
    const empty = document.createElement("div");
    empty.className = "guide-results hint";
    empty.textContent = "No venues match that search yet.";
    venueListEl.appendChild(empty);
    return;
  }

  filteredIds.forEach((id) => {
    const venueData = parkingData[id] || {};
    const card = document.createElement("div");
    card.className = "place-card";

    const title = document.createElement("h3");
    title.className = "place-name";
    title.textContent = displayNameFromSlug(id);

    const meta = document.createElement("p");
    meta.className = "place-meta";
    meta.textContent = venueData.officialParkingUrl
      ? "Official parking page available"
      : "Parking link not added yet";

    card.appendChild(title);
    card.appendChild(meta);

    card.onclick = () => showDetail(id);

    venueListEl.appendChild(card);
  });
}

// ========== DETAIL VIEW ==========

function showDetail(venueId) {
  const venueData = parkingData[venueId] || {};
  const displayName = displayNameFromSlug(venueId);

  // Swap views
  listView.hidden = true;
  detailView.hidden = false;

  // Header
  detailVenueNameEl.textContent = `Parking at ${displayName}`;
  detailUpdatedEl.textContent = venueData.updated
    ? `Updated ${venueData.updated}`
    : "Updated recently";

  // Overview
  parkingNoteEl.textContent =
    venueData.note ||
    "We haven’t added specific parking notes for this venue yet. Use the official parking info and map for the latest details.";

  // Concerto notes / status
  if (!venueData.officialParkingUrl) {
    parkingStatusEl.textContent =
      "We don’t have a direct parking page linked for this venue yet. Please check your ticket or visit the venue’s website for up-to-date parking information.";
  } else {
    parkingStatusEl.textContent = "";
  }

  // Primary button — official parking page
  if (venueData.officialParkingUrl) {
    openParkingPageBtn.disabled = false;
    openParkingPageBtn.textContent = "View Official Parking Info";
    openParkingPageBtn.onclick = () => {
      window.open(venueData.officialParkingUrl, "_blank");
    };
  } else {
    openParkingPageBtn.disabled = true;
    openParkingPageBtn.textContent = "Parking Link Coming Soon";
    openParkingPageBtn.onclick = null;
  }

  // Secondary button — open in Google Maps (helper)
  const mapsQuery = encodeURIComponent(`${displayName} parking`);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  openMapsBtn.onclick = () => {
    window.open(mapsUrl, "_blank");
  };
}

// Back to list
if (backToListBtn) {
  backToListBtn.addEventListener("click", () => {
    detailView.hidden = true;
    listView.hidden = false;
  });
}

// ========== SEARCH (top bar) ==========

function renderSearchDropdown(filterText = "") {
  const term = filterText.trim().toLowerCase();
  searchResultsDropdown.innerHTML = "";

  if (!term) {
    searchResultsDropdown.classList.remove("visible");
    return;
  }

  const matches = venueIds.filter((id) =>
    displayNameFromSlug(id).toLowerCase().includes(term)
  );

  if (!matches.length) {
    searchResultsDropdown.classList.remove("visible");
    return;
  }

  matches.slice(0, 12).forEach((id) => {
    const item = document.createElement("div");
    item.className = "search-result-item";
    item.textContent = displayNameFromSlug(id);
    item.onclick = () => {
      searchInput.value = displayNameFromSlug(id);
      searchResultsDropdown.classList.remove("visible");
      // Jump straight to detail for that venue
      showDetail(id);
    };
    searchResultsDropdown.appendChild(item);
  });

  searchResultsDropdown.classList.add("visible");
}

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const value = e.target.value;
    renderSearchDropdown(value);
    // Also filter the main list view
    renderList(value);
  });

  // Hide dropdown on blur (with a tiny delay to allow click)
  searchInput.addEventListener("blur", () => {
    setTimeout(() => {
      searchResultsDropdown.classList.remove("visible");
    }, 150);
  });
}

// ========== INIT ==========

async function initParking() {
  try {
    const res = await fetch("data/parking.json");
    if (!res.ok) {
      throw new Error("Failed to fetch parking.json: " + res.status);
    }

    parkingData = await res.json();
    venueIds = Object.keys(parkingData || {}).sort((a, b) =>
      displayNameFromSlug(a).localeCompare(displayNameFromSlug(b))
    );

    renderList();
  } catch (err) {
    console.error(err);
    venueListEl.innerHTML = "";
    const error = document.createElement("div");
    error.className = "guide-results hint";
    error.textContent =
      "We couldn't load parking data right now. Please try again later.";
    venueListEl.appendChild(error);
  }
}

initParking();