let parkingData = {};
let venuesList = [];

const searchInput = document.getElementById("venueSearch");
const searchResultsEl = document.getElementById("searchResults");

const infoPanel = document.getElementById("infoPanel");
const infoContent = document.querySelector(".info-content");
const infoEmptyEl = document.querySelector(".info-empty");
const browseListEl = document.getElementById("browseList");

const venueNameEl = document.getElementById("venueName");
const venueLocationEl = document.getElementById("venueLocation");
const rideshareNoteEl = document.getElementById("rideshareNote");

const uberToEl = document.getElementById("uberTo");
const uberFromEl = document.getElementById("uberFrom");
const lyftToEl = document.getElementById("lyftTo");
const lyftFromEl = document.getElementById("lyftFrom");

// Fetch parking JSON and use it as the rideshare data source
fetch("/data/parking.json")
  .then((res) => res.json())
  .then((data) => {
    parkingData = data || {};
    venuesList = buildVenuesList(parkingData);
    renderBrowseList();
  })
  .catch((err) => {
    console.error("Error loading parking.json for rideshare guide", err);
  });

function buildVenuesList(data) {
  const items = [];
  for (const slug in data) {
    const v = data[slug];
    const nameGuess = prettifySlug(slug);
    const city = v.city || "";
    const state = v.state || "";
    const label = state ? `${nameGuess} — ${city}, ${state}` : nameGuess;

    items.push({ slug, label, city, state, displayName: nameGuess });
  }
  return items.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

function prettifySlug(slug) {
  if (!slug) return "";
  return slug
    .split("_")
    .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : ""))
    .join(" ");
}

function renderBrowseList() {
  if (!browseListEl || !venuesList.length) return;

  const shuffled = [...venuesList];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const sample = shuffled.slice(0, 12);

  browseListEl.innerHTML = sample
    .map(
      (v) =>
        `<div class="browse-item" data-slug="${v.slug}">
          ${v.label}
        </div>`
    )
    .join("");
}

// Search behavior
searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) {
    searchResultsEl.classList.remove("visible");
    searchResultsEl.innerHTML = "";
    if (browseListEl) browseListEl.style.display = "block";
    return;
  }

  if (browseListEl) browseListEl.style.display = "none";

  const matches = venuesList.filter((v) =>
    v.displayName.toLowerCase().includes(q)
  );

  if (!matches.length) {
    searchResultsEl.classList.remove("visible");
    searchResultsEl.innerHTML = "";
    return;
  }

  searchResultsEl.innerHTML = matches
    .map(
      (v) =>
        `<div class="search-result-item" data-slug="${v.slug}">
          ${v.label}
        </div>`
    )
    .join("");

  searchResultsEl.classList.add("visible");
});

// Click on search result
searchResultsEl.addEventListener("click", (evt) => {
  const item = evt.target.closest(".search-result-item");
  if (!item) return;
  const slug = item.getAttribute("data-slug");
  const venue = venuesList.find((v) => v.slug === slug);
  if (!venue) return;

  searchInput.value = venue.displayName;
  searchResultsEl.classList.remove("visible");
  showVenue(slug);
});

// Click on browse item
if (browseListEl) {
  browseListEl.addEventListener("click", (evt) => {
    const item = evt.target.closest(".browse-item");
    if (!item) return;
    const slug = item.getAttribute("data-slug");
    showVenue(slug);
  });
}

// Hide search dropdown when clicking away
document.addEventListener("click", (evt) => {
  if (!searchResultsEl.contains(evt.target) && evt.target !== searchInput) {
    searchResultsEl.classList.remove("visible");
  }
});

function showVenue(slug) {
  const v = parkingData[slug];
  if (!v) return;

  infoPanel.classList.remove("info-panel--empty");
  infoContent.hidden = false;
  if (infoEmptyEl) infoEmptyEl.style.display = "none";

  const prettyName = prettifySlug(slug);
  const city = v.city || "";
  const state = v.state || "";

  venueNameEl.textContent = prettyName;
  const locParts = [];
  if (city) locParts.push(city);
  if (state) locParts.push(state);
  venueLocationEl.textContent = locParts.join(", ");

  // Rideshare note
  rideshareNoteEl.textContent =
    (v.rideshare && v.rideshare.trim().length
      ? v.rideshare
      : "We haven’t added specific rideshare notes for this venue yet. Check your ticket or the venue’s website for the latest pickup and dropoff details."
    );

  // Generate the 4 deep links
  const lat = v.lat;
  const lng = v.lng;
  const hasCoords =
    lat !== undefined &&
    lng !== undefined &&
    lat !== null &&
    lng !== null &&
    String(lat).trim() !== "" &&
    String(lng).trim() !== "";

  const name = prettyName;
  const addressBase = [prettyName, city, state].filter(Boolean).join(", ");

  // Helper for encoding
  const enc = encodeURIComponent;

  let uberToUrl = "";
  let uberFromUrl = "";
  let lyftToUrl = "";
  let lyftFromUrl = "";

  if (hasCoords) {
    const latStr = String(lat);
    const lngStr = String(lng);

    // Uber to venue (pickup = my_location, dropoff = venue coords)
    uberToUrl =
      `https://m.uber.com/ul/?action=setPickup` +
      `&pickup=my_location` +
      `&dropoff[latitude]=${enc(latStr)}` +
      `&dropoff[longitude]=${enc(lngStr)}` +
      `&dropoff[nickname]=${enc(name)}`;

    // Uber from venue (pickup = venue coords)
    uberFromUrl =
      `https://m.uber.com/ul/?action=setPickup` +
      `&pickup[latitude]=${enc(latStr)}` +
      `&pickup[longitude]=${enc(lngStr)}` +
      `&pickup[nickname]=${enc(name)}`;

    // Lyft to venue
    lyftToUrl =
      `https://ride.lyft.com/?destination[latitude]=${enc(latStr)}` +
      `&destination[longitude]=${enc(lngStr)}`;

    // Lyft from venue
    lyftFromUrl =
      `https://ride.lyft.com/?pickup[latitude]=${enc(latStr)}` +
      `&pickup[longitude]=${enc(lngStr)}`;
  } else {
    // Fallback: use text-based address (still very usable)
    const addr = enc(addressBase);

    uberToUrl =
      `https://m.uber.com/ul/?action=setPickup` +
      `&pickup=my_location` +
      `&dropoff[formatted_address]=${addr}` +
      `&dropoff[nickname]=${enc(name)}`;

    uberFromUrl =
      `https://m.uber.com/ul/?action=setPickup` +
      `&pickup[formatted_address]=${addr}` +
      `&pickup[nickname]=${enc(name)}`;

    // Lyft doesn't love pure text addresses, but this pushes users
    // into Lyft with the address in the URL.
    lyftToUrl =
      `https://ride.lyft.com/?destination[address]=${addr}`;
    lyftFromUrl =
      `https://ride.lyft.com/?pickup[address]=${addr}`;
  }

  uberToEl.href = uberToUrl;
  uberFromEl.href = uberFromUrl;
  lyftToEl.href = lyftToUrl;
  lyftFromEl.href = lyftFromUrl;
}
