let rideshareData = {};
let venues = [];
let currentVenue = null;

document.addEventListener("DOMContentLoaded", () => {
  initRideshare();
});

function initRideshare() {
  // JSON lives in this folder: /rideshare/rideshare.json
  fetch("rideshare.json")
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
      rideshare: v.rideshare || v.rideshareNotes || "",
      lat: v.lat,
      lng: v.lng,
    });
  }

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

  const rideshareNotes = (venue.rideshare || "").trim();
  const lat = venue.lat;
  const lng = venue.lng;

  // 1) Info block visibility
  if (!rideshareNotes) {
    infoSection.hidden = true;
  } else {
    infoSection.hidden = false;
    infoText.textContent = rideshareNotes;
  }

  // 2) Buttons visibility based on lat/lng
  if (
    lat === null ||
    lat === undefined ||
    lng === null ||
    lng === undefined
  ) {
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

  // Labels
  uberToBtn.textContent = `Uber to ${venueName}`;
  uberFromBtn.textContent = `Uber from ${venueName}`;
  lyftToBtn.textContent = `Lyft to ${venueName}`;
  lyftFromBtn.textContent = `Lyft from ${venueName}`;

  const latEnc = encodeURIComponent(lat);
  const lngEnc = encodeURIComponent(lng);
  const nameEnc = encodeURIComponent(venueName);

  // Deep links (same structure as your working BF snippet)
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
  // Reset any previous click handler
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
        // Fallback: just navigate normally
        window.location.href = url;
      }
    } catch (err) {
      console.error("buildfire.actionItems.execute failed", err);
      window.location.href = url;
    }
  });
}
