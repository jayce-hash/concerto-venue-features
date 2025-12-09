// ============================================================
// Rideshare Guide App JS
// ============================================================

let venues = {};
let selectedVenue = null;

// DOM refs (IDs must match index.html)
const searchInput = document.getElementById("venueSearch");
const searchResults = document.getElementById("searchResults");
const browseList = document.getElementById("browseList");

const infoPanel = document.getElementById("infoPanel");
const infoContent = document.querySelector(".info-content");
const venueNameEl = document.getElementById("venueName");
const venueLocationEl = document.getElementById("venueLocation");

const overviewCard = document.getElementById("rideshareOverviewCard");
const overviewText = document.getElementById("overviewText");

const linksCard = document.getElementById("rideshareLinksCard");
const uberToBtn = document.getElementById("uberTo");
const uberFromBtn = document.getElementById("uberFrom");
const lyftToBtn = document.getElementById("lyftTo");
const lyftFromBtn = document.getElementById("lyftFrom");

// --------------------------------------------
// LOAD DATA
// --------------------------------------------

fetch("rideshare.json")  // ⚠️ expects rideshare.json in same folder
  .then((res) => {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} loading rideshare.json`);
    }
    return res.json();
  })
  .then((data) => {
    venues = data || {};
    populateBrowseList();
  })
  .catch((err) => {
    console.error("Failed to load rideshare.json:", err);
    // Optional: show a message in the UI so it isn’t just empty
    if (browseList) {
      browseList.innerHTML =
        '<div class="browse-item">Could not load rideshare data.</div>';
    }
  });

// --------------------------------------------
// POPULATE BROWSE LIST
// --------------------------------------------
function populateBrowseList() {
  const items = Object.values(venues).sort((a, b) =>
    a.venueName.localeCompare(b.venueName)
  );

  browseList.innerHTML = "";

  items.forEach((v) => {
    const div = document.createElement("div");
    div.className = "browse-item";
    div.textContent = `${v.venueName} — ${v.city}, ${v.state}`;
    div.onclick = () => selectVenue(v);
    browseList.appendChild(div);
  });
}

// --------------------------------------------
// SEARCH HANDLER
// --------------------------------------------
if (searchInput) {
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase().trim();

    if (!q) {
      searchResults.classList.remove("visible");
      searchResults.innerHTML = "";
      return;
    }

    const matched = Object.values(venues).filter((v) =>
      v.venueName.toLowerCase().includes(q)
    );

    searchResults.innerHTML = "";
    matched.forEach((v) => {
      const item = document.createElement("div");
      item.className = "search-result-item";
      item.textContent = `${v.venueName} — ${v.city}, ${v.state}`;
      item.onclick = () => {
        searchInput.value = "";
        searchResults.innerHTML = "";
        searchResults.classList.remove("visible");
        selectVenue(v);
      };
      searchResults.appendChild(item);
    });

    searchResults.classList.add("visible");
  });
}

// --------------------------------------------
// SELECT VENUE
// --------------------------------------------
function selectVenue(v) {
  selectedVenue = v;

  if (infoPanel) {
    infoPanel.classList.remove("info-panel--empty");
  }
  if (infoContent) {
    infoContent.hidden = false;
  }

  venueNameEl.textContent = v.venueName;
  venueLocationEl.textContent = `${v.city}, ${v.state}`;

  // OVERVIEW
  if (v.note && v.note.trim() !== "") {
    overviewText.textContent = v.note;
    overviewCard.hidden = false;
  } else {
    overviewCard.hidden = true;
  }

  // RIDESHARE LINKS (always visible, always 4)
  linksCard.hidden = false;

  const lat = v.lat;
  const lng = v.lng;
  const encodedName = encodeURIComponent(v.venueName);

  // Uber to venue
  uberToBtn.setAttribute(
    "href",
    `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${lat}&dropoff[longitude]=${lng}&dropoff[nickname]=${encodedName}`
  );

  // Uber from venue
  uberFromBtn.setAttribute(
    "href",
    `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${lat}&pickup[longitude]=${lng}&pickup[nickname]=${encodedName}`
  );

  // Lyft to venue
  lyftToBtn.setAttribute(
    "href",
    `https://ride.lyft.com/?destination[latitude]=${lat}&destination[longitude]=${lng}&destination[nickname]=${encodedName}`
  );

  // Lyft from venue
  lyftFromBtn.setAttribute(
    "href",
    `https://ride.lyft.com/?pickup[latitude]=${lat}&pickup[longitude]=${lng}&pickup[nickname]=${encodedName}`
  );
}
