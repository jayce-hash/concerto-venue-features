// ============================================================
// Concerto · Rideshare Guide
// ============================================================

// Data + state
let venues = {};
let selectedVenue = null;

// DOM elements (must match index.html IDs)
const searchInput      = document.getElementById("venueSearch");
const searchResultsEl  = document.getElementById("searchResults");
const browseListEl     = document.getElementById("browseList");

const infoPanelEl      = document.getElementById("infoPanel");
const infoContentEl    = document.querySelector(".info-content");
const venueNameEl      = document.getElementById("venueName");
const venueLocationEl  = document.getElementById("venueLocation");

const overviewCardEl   = document.getElementById("rideshareOverviewCard");
const overviewTextEl   = document.getElementById("overviewText");

const linksCardEl      = document.getElementById("rideshareLinksCard");
const uberToBtn        = document.getElementById("uberTo");
const uberFromBtn      = document.getElementById("uberFrom");
const lyftToBtn        = document.getElementById("lyftTo");
const lyftFromBtn      = document.getElementById("lyftFrom");


// ----------------------------------------------------------
// Load rideshare.json (expects file in same folder as index.html)
// ----------------------------------------------------------
fetch("rideshare.json")
  .then((res) => {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} when loading rideshare.json`);
    }
    return res.json();
  })
  .then((data) => {
    venues = data || {};
    populateBrowseList();
  })
  .catch((err) => {
    console.error("Failed to load rideshare.json:", err);
    if (browseListEl) {
      browseListEl.innerHTML =
        '<div class="browse-item">Could not load rideshare data.</div>';
    }
  });


// ----------------------------------------------------------
// Populate browse list (randomized or A–Z; here A–Z)
// ----------------------------------------------------------
function populateBrowseList() {
  const all = Object.values(venues);
  if (!all.length) {
    browseListEl.innerHTML =
      '<div class="browse-item">No venues found in rideshare.json</div>';
    return;
  }

  const sorted = all.slice().sort((a, b) =>
    (a.venueName || "").localeCompare(b.venueName || "")
  );

  browseListEl.innerHTML = "";

  sorted.forEach((v) => {
    const div = document.createElement("div");
    div.className = "browse-item";
    div.textContent = `${v.venueName} — ${v.city}, ${v.state}`;
    div.onclick = () => selectVenue(v);
    browseListEl.appendChild(div);
  });
}


// ----------------------------------------------------------
// Search
// ----------------------------------------------------------
if (searchInput) {
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase().trim();

    if (!q) {
      searchResultsEl.classList.remove("visible");
      searchResultsEl.innerHTML = "";
      return;
    }

    const matches = Object.values(venues).filter((v) =>
      (v.venueName || "").toLowerCase().includes(q)
    );

    searchResultsEl.innerHTML = "";

    matches.forEach((v) => {
      const item = document.createElement("div");
      item.className = "search-result-item";
      item.textContent = `${v.venueName} — ${v.city}, ${v.state}`;
      item.onclick = () => {
        searchInput.value = "";
        searchResultsEl.innerHTML = "";
        searchResultsEl.classList.remove("visible");
        selectVenue(v);
      };
      searchResultsEl.appendChild(item);
    });

    if (matches.length) {
      searchResultsEl.classList.add("visible");
    } else {
      searchResultsEl.classList.remove("visible");
    }
  });
}


// ----------------------------------------------------------
// Select a venue → fill overview + wire 4 buttons
// ----------------------------------------------------------
function selectVenue(v) {
  selectedVenue = v;

  // Switch from empty state to content
  if (infoPanelEl) {
    infoPanelEl.classList.remove("info-panel--empty");
  }
  if (infoContentEl) {
    infoContentEl.hidden = false;
  }

  venueNameEl.textContent = v.venueName || "";
  venueLocationEl.textContent = [v.city, v.state].filter(Boolean).join(", ");

  // ------ Overview text ------
  const note = (v.note || "").trim();
  if (note) {
    overviewTextEl.textContent = note;
    overviewCardEl.hidden = false;
  } else {
    overviewCardEl.hidden = true;
  }

  // ------ 4 rideshare buttons (always visible) ------
  linksCardEl.hidden = false;

  const lat = v.lat;
  const lng = v.lng;

  // If lat/lng missing, we still show buttons but they'll just open the app without a pre-filled stop
  const hasCoords = typeof lat === "number" && typeof lng === "number";

  const encodedName = encodeURIComponent(v.venueName || "Venue");

  // Uber to venue
  let uberToUrl = "https://m.uber.com/ul/";
  if (hasCoords) {
    uberToUrl =
      `https://m.uber.com/ul/?action=setPickup` +
      `&pickup=my_location` +
      `&dropoff[latitude]=${lat}` +
      `&dropoff[longitude]=${lng}` +
      `&dropoff[nickname]=${encodedName}`;
  }
  uberToBtn.setAttribute("href", uberToUrl);

  // Uber from venue
  let uberFromUrl = "https://m.uber.com/ul/";
  if (hasCoords) {
    uberFromUrl =
      `https://m.uber.com/ul/?action=setPickup` +
      `&pickup[latitude]=${lat}` +
      `&pickup[longitude]=${lng}` +
      `&pickup[nickname]=${encodedName}`;
  }
  uberFromBtn.setAttribute("href", uberFromUrl);

  // Lyft to venue
  let lyftToUrl = "https://ride.lyft.com/";
  if (hasCoords) {
    lyftToUrl =
      `https://ride.lyft.com/?destination[latitude]=${lat}` +
      `&destination[longitude]=${lng}` +
      `&destination[nickname]=${encodedName}`;
  }
  lyftToBtn.setAttribute("href", lyftToUrl);

  // Lyft from venue
  let lyftFromUrl = "https://ride.lyft.com/";
  if (hasCoords) {
    lyftFromUrl =
      `https://ride.lyft.com/?pickup[latitude]=${lat}` +
      `&pickup[longitude]=${lng}` +
      `&pickup[nickname]=${encodedName}`;
  }
  lyftFromBtn.setAttribute("href", lyftFromUrl);
}
