let rideshareData = {};
let venues = [];
let currentVenue = null;

document.addEventListener("DOMContentLoaded", () => {
  initRideshare();
});

function initRideshare() {
  fetch("/data/rideshare.json")
    .then((res) => res.json())
    .then((data) => {
      rideshareData = data || {};
      venues = buildVenuesList(rideshareData);
      renderVenueList(venues);
      wireSearch();
    })
    .catch((err) => {
      console.error("Error loading rideshare.json", err);
    });
}

function buildVenuesList(dataObj) {
  const list = [];
  for (const [slug, v] of Object.entries(dataObj)) {
    list.push({
      id: slug,
      name: v.name || slug,
      city: v.city || "",
      state: v.state || "",
      rideshare: v.rideshare || "",
      lat: v.lat,
      lng: v.lng,
    });
  }

  list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

function renderVenueList(list) {
  const container = document.getElementById("venueList");
  container.innerHTML = "";

  if (!list.length) {
    const p = document.createElement("p");
    p.className = "detail-hint";
    p.textContent = "No venues available.";
    container.appendChild(p);
    return;
  }

  list.forEach((venue) => {
    const card = document.createElement("div");
    card.className = "venue-card";
    card.addEventListener("click", () => showVenueDetail(venue));

    const nameEl = document.createElement("p");
    nameEl.className = "venue-card-name";
    nameEl.textContent = venue.name;

    const metaEl = document.createElement("p");
    metaEl.className = "venue-card-meta";
    metaEl.textContent = [venue.city, venue.state].filter(Boolean).join(", ");

    card.appendChild(nameEl);
    card.appendChild(metaEl);

    container.appendChild(card);
  });
}

function wireSearch() {
  const input = document.getElementById("venueSearch");
  input.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (!term) {
      renderVenueList(venues);
      return;
    }

    const filtered = venues.filter((v) =>
      v.name.toLowerCase().includes(term)
    );
    renderVenueList(filtered);
  });
}

function showVenueDetail(venue) {
  currentVenue = venue;

  const detailPanel = document.getElementById("detailPanel");
  const detailHint = document.getElementById("detailHint");
  const detailContent = document.getElementById("detailContent");

  const nameEl = document.getElementById("venueName");
  const locEl = document.getElementById("venueLocation");

  nameEl.textContent = venue.name;
  locEl.textContent = [venue.city, venue.state].filter(Boolean).join(", ");

  // Switch panel from "hint" mode to "content" mode
  detailPanel.classList.remove("detail-panel--empty");
  detailHint.style.display = "none";
  detailContent.hidden = false;

  renderRideshare(venue);
}

function renderRideshare(venue) {
  const infoSection = document.getElementById("rideshare-info");
  const infoText = document.getElementById("rideshare-text");
  const buttonsSection = document.getElementById("rideshare-buttons");

  const rideshareNotes = (venue.rideshare || "").trim();
  const lat = venue.lat;
  const lng = venue.lng;

  // 1) Handle info section visibility
  if (!rideshareNotes) {
    infoSection.hidden = true;
  } else {
    infoSection.hidden = false;
    infoText.textContent = rideshareNotes;
  }

  // 2) Handle buttons based on lat/lng
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    buttonsSection.hidden = true;
    return;
  }

  buttonsSection.hidden = false;

  const venueName = venue.name || "Venue";
  const uberTo = document.getElementById("uber-to");
  const uberFrom = document.getElementById("uber-from");
  const lyftTo = document.getElementById("lyft-to");
  const lyftFrom = document.getElementById("lyft-from");

  // Uber to venue
  uberTo.href =
    "https://m.uber.com/ul/?action=setPickup" +
    "&pickup=my_location" +
    `&dropoff[latitude]=${lat}` +
    `&dropoff[longitude]=${lng}` +
    `&dropoff[nickname]=${encodeURIComponent(venueName)}`;

  // Uber from venue
  uberFrom.href =
    "https://m.uber.com/ul/?action=setPickup" +
    `&pickup[latitude]=${lat}` +
    `&pickup[longitude]=${lng}` +
    `&pickup[nickname]=${encodeURIComponent(venueName)}`;

  // Lyft to venue
  lyftTo.href =
    "https://ride.lyft.com/?destination[latitude]=" +
    encodeURIComponent(lat) +
    "&destination[longitude]=" +
    encodeURIComponent(lng);

  // Lyft from venue
  lyftFrom.href =
    "https://ride.lyft.com/?pickup[latitude]=" +
    encodeURIComponent(lat) +
    "&pickup[longitude]=" +
    encodeURIComponent(lng);
}
