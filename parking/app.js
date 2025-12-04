// Concerto — Parking Feature (Clean, Stable, Shared CSS Version)

const folderView = document.getElementById("folderView");
const detailView = document.getElementById("detailView");

const venueListEl = document.getElementById("venueList");

const searchInput = document.getElementById("venueSearch");
const searchDropdown = document.getElementById("searchResults");

const detailVenueNameEl = document.getElementById("detailVenueName");
const updatedBadgeEl = document.getElementById("updatedBadge");
const parkingNoteEl = document.getElementById("parkingNote");
const parkingStatusEl = document.getElementById("parkingStatus");

const openParkingPageBtn = document.getElementById("openParkingPageBtn");
const openMapsBtn = document.getElementById("openMapsBtn");
const backToListBtn = document.getElementById("backToListBtn");

let parkingData = {};
let venueIds = [];

// Convert slug → Display Name
function displayNameFromSlug(slug) {
  return slug
    .split("_")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// LIST RENDERING
function renderList(filter = "") {
  const term = filter.toLowerCase();
  venueListEl.innerHTML = "";

  const filtered = venueIds.filter(id =>
    displayNameFromSlug(id).toLowerCase().includes(term)
  );

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "guide-results hint";
    empty.textContent = "No matching venues.";
    venueListEl.appendChild(empty);
    return;
  }

  filtered.forEach(id => {
    const v = parkingData[id];
    const card = document.createElement("div");
    card.className = "place-card";
    card.style.cursor = "pointer";

    const name = document.createElement("h3");
    name.className = "place-name";
    name.textContent = displayNameFromSlug(id);

    const meta = document.createElement("p");
    meta.className = "place-meta";
    meta.textContent = v.officialParkingUrl
      ? "Official parking available"
      : "Parking link not added yet";

    card.appendChild(name);
    card.appendChild(meta);

    card.onclick = () => openDetail(id);

    venueListEl.appendChild(card);
  });
}

// DETAIL VIEW
function openDetail(id) {
  const v = parkingData[id];
  const displayName = displayNameFromSlug(id);

  folderView.style.display = "none";
  detailView.style.display = "block";

  detailVenueNameEl.textContent = `Parking at ${displayName}`;
  updatedBadgeEl.textContent = v.updated || "Updated";

  parkingNoteEl.textContent =
    v.note ||
    "Parking details not added yet. Please check the official page or maps.";

  parkingStatusEl.textContent = v.officialParkingUrl
    ? ""
    : "No official link added for this venue yet.";

  // Primary: Official Parking Page
  if (v.officialParkingUrl) {
    openParkingPageBtn.disabled = false;
    openParkingPageBtn.textContent = "View Official Parking Info";
    openParkingPageBtn.onclick = () =>
      window.open(v.officialParkingUrl, "_blank");
  } else {
    openParkingPageBtn.disabled = true;
    openParkingPageBtn.textContent = "Parking Link Coming Soon";
    openParkingPageBtn.onclick = null;
  }

  // Secondary: Open in Google Maps
  const mapsQuery = encodeURIComponent(`${displayName} Parking`);
  openMapsBtn.onclick = () =>
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`,
      "_blank"
    );
}

// BACK BUTTON
backToListBtn.onclick = () => {
  detailView.style.display = "none";
  folderView.style.display = "block";
  renderList(searchInput.value);
};

// SEARCH (top field & dropdown)
searchInput.addEventListener("input", e => {
  const value = e.target.value;
  renderList(value);
});

// INITIAL LOAD
async function init() {
  try {
    const res = await fetch("/data/parking.json");
    if (!res.ok) throw new Error("Failed to load JSON");

    parkingData = await res.json();
    venueIds = Object.keys(parkingData).sort((a, b) =>
      displayNameFromSlug(a).localeCompare(displayNameFromSlug(b))
    );

    renderList();
  } catch (err) {
    console.error(err);
    venueListEl.innerHTML =
      "<div class='place-meta'>Could not load parking data.</div>";
  }
}

init();