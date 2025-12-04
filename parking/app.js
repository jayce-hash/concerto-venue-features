// Concerto — Parking Guides (Pro Upgrade JS)

const listView = document.getElementById("listView");
const detailView = document.getElementById("detailView");

const venueListEl = document.getElementById("venueList");
const searchInput = document.getElementById("venueSearch");

const backToListBtn = document.getElementById("backToListBtn");

const detailVenueNameEl = document.getElementById("detailVenueName");
const detailSubtitleEl = document.getElementById("detailSubtitle");
const updatedBadgeEl = document.getElementById("updatedBadge");
const parkingMapEl = document.getElementById("parkingMap");
const parkingNoteEl = document.getElementById("parkingNote");
const rideshareTextEl = document.getElementById("rideshareText");
const lotsListEl = document.getElementById("lotsList");
const lotsEmptyEl = document.getElementById("lotsEmpty");
const parkingStatusEl = document.getElementById("parkingStatus");
const openParkingPageBtn = document.getElementById("openParkingPageBtn");
const openMapsBtn = document.getElementById("openMapsBtn");

let parkingData = {};
let venueIds = [];

// Helpers
function displayNameFromSlug(slug) {
  return slug
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// LIST RENDERING
function renderList(filterText = "") {
  const term = filterText.trim().toLowerCase();
  venueListEl.innerHTML = "";

  const filtered = venueIds.filter((id) =>
    displayNameFromSlug(id).toLowerCase().includes(term)
  );

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "place-meta";
    empty.style.padding = "6px 2px";
    empty.textContent = "No venues match that search.";
    venueListEl.appendChild(empty);
    return;
  }

  filtered.forEach((id) => {
    const data = parkingData[id];
    const card = document.createElement("div");
    card.className = "place-card";
    card.style.cursor = "pointer";

    const title = document.createElement("h3");
    title.className = "place-name";
    title.textContent = displayNameFromSlug(id);

    const meta = document.createElement("p");
    meta.className = "place-meta";
    meta.textContent = data.officialParkingUrl
      ? "Official parking page available"
      : "Parking link not added yet";

    card.appendChild(title);
    card.appendChild(meta);

    card.onclick = () => openDetail(id);

    venueListEl.appendChild(card);
  });
}

// DETAIL VIEW
function openDetail(venueId) {
  const data = parkingData[venueId];
  const displayName = displayNameFromSlug(venueId);

  listView.classList.add("card-shell--hidden");
  detailView.classList.remove("card-shell--hidden");

  detailVenueNameEl.textContent = `Parking at ${displayName}`;
  detailSubtitleEl.textContent = data.subtitle || "";
  updatedBadgeEl.textContent = data.updated || "Updated recently";

  // Map
  const query = encodeURIComponent(`${displayName} parking`);
  const mapUrl = `https://www.google.com/maps?q=${query}&output=embed`;
  parkingMapEl.src = mapUrl;

  // Overview
  parkingNoteEl.textContent =
    data.note ||
    "We haven’t added specific parking notes for this venue yet. Use the official parking link and map for the latest details.";

  // Rideshare
  if (data.rideshare && data.rideshare.trim()) {
    rideshareTextEl.textContent = data.rideshare;
    rideshareTextEl.classList.remove("body-text--muted");
  } else {
    rideshareTextEl.textContent =
      "No specific rideshare notes added yet. We recommend checking your ticket or the venue’s website for pickup / dropoff instructions.";
    rideshareTextEl.classList.add("body-text--muted");
  }

  // Lots
  lotsListEl.innerHTML = "";
  if (Array.isArray(data.lots) && data.lots.length > 0) {
    data.lots.forEach((lot) => {
      const li = document.createElement("li");
      li.textContent = lot;
      lotsListEl.appendChild(li);
    });
    lotsEmptyEl.style.display = "none";
  } else {
    lotsEmptyEl.style.display = "block";
  }

  // Status + buttons
  if (data.officialParkingUrl) {
    parkingStatusEl.textContent = "";
    openParkingPageBtn.disabled = false;
    openParkingPageBtn.textContent = "View Official Parking Info";
    openParkingPageBtn.onclick = () => {
      window.open(data.officialParkingUrl, "_blank");
    };
  } else {
    parkingStatusEl.textContent =
      "We don’t have a direct parking link for this venue yet. Please check your ticket or the venue’s website for up-to-date information.";
    openParkingPageBtn.disabled = true;
    openParkingPageBtn.textContent = "Parking Link Coming Soon";
    openParkingPageBtn.onclick = null;
  }

  // Open in Maps helper
  openMapsBtn.onclick = () => {
    const mapsSearch = encodeURIComponent(`${displayName} parking`);
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${mapsSearch}`,
      "_blank"
    );
  };
}

// BACK TO LIST
backToListBtn.addEventListener("click", () => {
  detailView.classList.add("card-shell--hidden");
  listView.classList.remove("card-shell--hidden");
});

// SEARCH
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    renderList(e.target.value);
  });
}

// INIT
async function initParking() {
  try {
    const res = await fetch("/data/parking.json");
    if (!res.ok) throw new Error("Failed to load /data/parking.json");

    parkingData = await res.json();
    venueIds = Object.keys(parkingData).sort((a, b) =>
      displayNameFromSlug(a).localeCompare(displayNameFromSlug(b))
    );

    renderList();
  } catch (err) {
    console.error(err);
    venueListEl.innerHTML =
      "<div class='place-meta' style='padding:6px 2px;'>We couldn't load parking data right now.</div>";
  }
}

initParking();
