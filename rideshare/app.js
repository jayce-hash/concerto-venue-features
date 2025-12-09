let rideshareData = {};
let venues = [];
let currentVenue = null;

document.addEventListener("DOMContentLoaded", () => {
  initRideshare();
});

function initRideshare() {
  // rideshare.json is in the same folder
  fetch("rideshare.json")
    .then((res) => res.json())
    .then((data) => {
      rideshareData = data || {};
      venues = buildVenuesList(rideshareData);
      renderVenueList(venues);
      wireSearch();
      // 👇 NEW: try to auto-open a venue from ?venueId=
      autoOpenVenueFromQuery();
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
      // JSON uses "venueName"
      name: v.venueName || v.name || slug,
      city: v.city || "",
      state: v.state || "",
      // JSON uses "note" for the rideshare description
      rideshareRaw: (v.note || v.rideshare || v.rideshareNotes || "").trim(),
      lat: v.lat,
      lng: v.lng,
    });
  }

  // Sort A–Z by venue name
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

  // Clean up the note + hide generic "No specific rideshare notes..." ones
  let rideshareNotes = venue.rideshareRaw || "";
  const lower = rideshareNotes.toLowerCase();

  if (lower.startsWith("no specific rideshare notes available")) {
    rideshareNotes = "";
  }

  // 1) Info block visibility
  if (!rideshareNotes) {
    infoSection.hidden = true;
  } else {
    infoSection.hidden = false;
    infoText.textContent = rideshareNotes;
  }

  // 2) Buttons visibility based on lat/lng
  const lat = venue.lat;
  const lng = venue.lng;

  if (
    lat === null ||
    lat === undefined ||
    lng === null ||
    lng === undefined
  ) {
    // No coords yet → hide buttons so we don't have broken deep links
    buttonsSection.hidden = true;
    return;
  }

  buttonsSection.hidden = false;

  const venueName = venue.name || "Venue";

  const uberToBtn = document.getElementById("uber-to");
  const uberFromBtn = document.getElementById("uber-from");
  const lyftToBtn = document.getElementById("lyft-to");
  const lyftFromBtn = document.getElementById("lyft-from");

  if (!uberToBtn || !uberFromBtn || !lyftToBtn || !lyftFromBtn) {
    console.warn("One or more rideshare buttons missing.");
    return;
  }

  // Button labels
  uberToBtn.textContent = `Uber to ${venueName}`;
  uberFromBtn.textContent = `Uber from ${venueName}`;
  lyftToBtn.textContent = `Lyft to ${venueName}`;
  lyftFromBtn.textContent = `Lyft from ${venueName}`;

  const latEnc = encodeURIComponent(lat);
  const lngEnc = encodeURIComponent(lng);
  const nameEnc = encodeURIComponent(venueName);

  // Deep links (same pattern as your working BF snippet)
  const uberToUrl =
    "https://m.uber.com/ul/?" +
    "action=setPickup" +
    "&pickup=my_location" +
    `&dropoff[latitude]=${latEnc}` +
    `&dropoff[longitude]=${lngEnc}` +
    `&dropoff[nickname]=${nameEnc}`;

  const uberFromUrl =
    "https://m.uber.com/ul/?" +
    "action=setPickup" +
    `&pickup[latitude]=${latEnc}` +
    `&pickup[longitude]=${lngEnc}` +
    `&pickup[nickname]=${nameEnc}`;

  const lyftToUrl =
    "https://ride.lyft.com/?" +
    "destination[latitude]=" +
    latEnc +
    "&destination[longitude]=" +
    lngEnc;

  const lyftFromUrl =
    "https://ride.lyft.com/?" +
    "pickup[latitude]=" +
    latEnc +
    "&pickup[longitude]=" +
    lngEnc;

  attachActionButton(uberToBtn, uberToUrl, `Uber to ${venueName}`);
  attachActionButton(uberFromBtn, uberFromUrl, `Uber from ${venueName}`);
  attachActionButton(lyftToBtn, lyftToUrl, `Lyft to ${venueName}`);
  attachActionButton(lyftFromBtn, lyftFromUrl, `Lyft from ${venueName}`);
}

function attachActionButton(btn, url, title) {
  // Reset previous handler
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);

  newBtn.addEventListener("click", (e) => {
    e.preventDefault();

    const actionItem = {
      title,
      action: "linkToWeb",
      openIn: "_system",
      url,
    };

    try {
      if (
        window.buildfire &&
        buildfire.actionItems &&
        typeof buildfire.actionItems.execute === "function"
      ) {
        buildfire.actionItems.execute(actionItem, () => {});
      } else {
        window.location.href = url;
      }
    } catch (err) {
      console.error("buildfire.actionItems.execute failed", err);
      window.location.href = url;
    }
  });
}

/* ========= NEW: deep-link support via ?venueId=slug ========= */

function getVenueIdFromQuery() {
  try {
    const params = new URLSearchParams(window.location.search || "");
    // Support both ?venueId= and ?venue= just in case
    return params.get("venueId") || params.get("venue") || null;
  } catch (e) {
    console.warn("Unable to read query params", e);
    return null;
  }
}

function autoOpenVenueFromQuery() {
  const raw = getVenueIdFromQuery();
  if (!raw || !Array.isArray(venues) || !venues.length) return;

  const needle = raw.toLowerCase();

  // 1) Try slug/id match (best)
  let match =
    venues.find((v) => (v.id || "").toLowerCase() === needle) || null;

  // 2) Fallback: match by name
  if (!match) {
    match =
      venues.find((v) => (v.name || "").toLowerCase() === needle) || null;
  }

  if (!match) return;

  // Open the venue details just like a user tap
  showVenueDetail(match);

  // Optional: you can scroll the list to that venue if you want later
}
