// Parking folder + detail view

const folderViewP = document.getElementById("folderView");
const detailViewP = document.getElementById("detailView");

const searchInputP = document.getElementById("venueSearch");
const venueListElP = document.getElementById("venueList");

const detailVenueNameElP = document.getElementById("detailVenueName");
const updatedBadgeElP = document.getElementById("updatedBadge");
const parkingNoteEl = document.getElementById("parkingNote");
const parkingStatusEl = document.getElementById("parkingStatus");
const openParkingPageBtn = document.getElementById("openParkingPageBtn");
const backToListBtnP = document.getElementById("backToListBtn");

let parkingData = {};
let parkingVenueIds = [];

// Turn "dickies_arena" into "Dickies Arena"
function displayNameFromSlug(slug) {
  return slug
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Render the folder list
function renderFolderViewParking(filterText = "") {
  folderViewP.style.display = "block";
  detailViewP.style.display = "none";

  const term = filterText.trim().toLowerCase();
  venueListElP.innerHTML = "";

  const filteredIds = parkingVenueIds.filter((id) => {
    const name = displayNameFromSlug(id).toLowerCase();
    return !term || name.includes(term);
  });

  if (!filteredIds.length) {
    const empty = document.createElement("div");
    empty.className = "status-text";
    empty.textContent = "No venues match that search yet.";
    venueListElP.appendChild(empty);
    return;
  }

  filteredIds.forEach((id) => {
    const venueData = parkingData[id] || {};
    const card = document.createElement("div");
    card.className = "list-item";
    card.style.cursor = "pointer";

    const title = document.createElement("div");
    title.className = "list-item-title";
    title.textContent = displayNameFromSlug(id);

    const meta = document.createElement("div");
    meta.className = "list-item-meta";

    if (venueData.officialParkingUrl) {
      meta.textContent = "Official parking page available";
    } else {
      meta.textContent = "Parking link not added yet";
    }

    card.appendChild(title);
    card.appendChild(meta);

    card.onclick = () => showDetailViewParking(id);

    venueListElP.appendChild(card);
  });
}

// Render the detail view for a single venue
function showDetailViewParking(venueId) {
  const venueData = parkingData[venueId] || {};
  const displayName = displayNameFromSlug(venueId);

  folderViewP.style.display = "none";
  detailViewP.style.display = "block";

  detailVenueNameElP.textContent = displayName;

  // Main parking note (use note field or default)
  parkingNoteEl.textContent =
    venueData.note ||
    "We haven’t added specific parking notes for this venue yet.";

  updatedBadgeElP.textContent = venueData.updated || "Updated";

  // Status text
  if (!venueData.officialParkingUrl) {
    parkingStatusEl.textContent =
      "We don’t have a direct parking page linked for this venue yet. Please check your ticket or the venue website for the latest info.";
  } else {
    parkingStatusEl.textContent = "";
  }

  // Button behavior — NO GOOGLE FALLBACK
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
}

// Load JSON and initialize
async function initParking() {
  try {
    const res = await fetch("/data/parking.json");
    if (!res.ok) {
      throw new Error("Failed to fetch parking.json: " + res.status);
    }

    parkingData = await res.json();
    parkingVenueIds = Object.keys(parkingData || {}).sort((a, b) =>
      displayNameFromSlug(a).localeCompare(displayNameFromSlug(b))
    );

    renderFolderViewParking();
  } catch (err) {
    console.error(err);
    venueListElP.innerHTML = "";
    const error = document.createElement("div");
    error.className = "status-text";
    error.textContent =
      "We couldn't load parking data right now. Please try again later.";
    venueListElP.appendChild(error);
  }
}

// Wire up search
if (searchInputP) {
  searchInputP.addEventListener("input", (e) => {
    renderFolderViewParking(e.target.value);
  });
}

// Wire up "Back to All Venues"
if (backToListBtnP) {
  backToListBtnP.onclick = () => {
    renderFolderViewParking(searchInputP ? searchInputP.value : "");
  };
}

// Kick things off
initParking();