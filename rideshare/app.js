let rideshareData = {};
let venues = [];
let currentVenue = null;

document.addEventListener("DOMContentLoaded", () => {
  initRideshare();
});

function initRideshare() {
  // Match the pattern used in other microfeatures: data in ../data/
  fetch("../data/rideshare.json")
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

  // Sort alphabetically like the other features
  list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

function renderVenueList(list) {
  const container = document.getElementById("venueList");
  if (!container) return;

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
  if (!input) return;

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

  if (!detailPanel || !detailHint || !detailContent || !nameEl || !locEl) {
    console.warn("Detail DOM elements missing.");
    return;
  }

  nameEl.textContent = venue.name;
  locEl.textContent = [venue.city, venue.state].filter(Boolean).join(", ");

  // Switch from hint state to content state
  detailPanel.classList.remove("detail-panel--empty");
  detailHint.style.display = "none";
  detailContent.hidden = false;

  renderRideshare(venue);
}

function renderRideshare(venue) {
  const infoSection = document.getElementById("rideshare-info");
  const infoText = document.getElementById("rideshare-text");
  const buttonsSection = document.getElementById("rideshare-buttons");

  if (!infoSection || !infoText || !buttonsSection) {
    console.warn("Rideshare DOM elements missing.");
    return;
  }

  const rideshareNotes = (venue.rideshare || "").trim();
  const lat = venue.lat;
  const lng = venue.lng;

  // ===== 1) Rideshare info block visibility =====
  if (!rideshareNotes) {
    // No venue-specific copy → hide the info section completely
    infoSection.hidden = true;
  } else {
    infoSection.hidden = false;
    infoText.textContent = rideshareNotes;
  }

  // ===== 2) Buttons visibility based on lat/lng =====
  if (
    lat === null ||
    lat === undefined ||
    lng === null ||
    lng === undefined
  ) {
    // No coordinates → no deep links
    buttonsSection.hidden = true;
    return;
  }

  buttonsSection.hidden = false;

  const venueName = venue.name || "Venue";

  const uberTo = document.getElementById("uber-to");
  const uberFrom = document.getElementById("uber-from");
  const lyftTo = document.getElementById("lyft-to");
  const lyftFrom = document.getElementById("lyft-from");

  if (!uberTo || !uberFrom || !lyftTo || !lyftFrom) {
    console.warn("One or more rideshare buttons missing.");
    return;
  }

  // Button labels with venue name
  uberTo.textContent = `Uber to ${venueName}`;
  uberFrom.textContent = `Uber from ${venueName}`;
  lyftTo.textContent = `Lyft to ${venueName}`;
  lyftFrom.textContent = `Lyft from ${venueName}`;

  // ===== 3) Native app deep links (popup-friendly) =====
  // Use app schemes so the popup WebView can trigger Uber/Lyft directly.

  const latEnc = encodeURIComponent(lat);
  const lngEnc = encodeURIComponent(lng);
  const nameEnc = encodeURIComponent(venueName);

  // Uber TO venue: pickup = my_location, dropoff = venue
  uberTo.href =
    "uber://?action=setPickup" +
    "&pickup=my_location" +
    `&dropoff[latitude]=${latEnc}` +
    `&dropoff[longitude]=${lngEnc}` +
    `&dropoff[nickname]=${nameEnc}`;

  // Uber FROM venue: pickup = venue, user chooses destination
  uberFrom.href =
    "uber://?action=setPickup" +
    `&pickup[latitude]=${latEnc}` +
    `&pickup[longitude]=${lngEnc}` +
    `&pickup[nickname]=${nameEnc}`;

  // Lyft TO venue: destination = venue
  lyftTo.href =
    "lyft://ridetype?id=lyft" +
    `&destination[latitude]=${latEnc}` +
    `&destination[longitude]=${lngEnc}`;

  // Lyft FROM venue: pickup = venue
  lyftFrom.href =
    "lyft://ridetype?id=lyft" +
    `&pickup[latitude]=${latEnc}` +
    `&pickup[longitude]=${lngEnc}`;
}
