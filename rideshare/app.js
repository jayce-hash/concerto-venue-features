let parkingData = {};
let venuesList = [];

// DOM elements
const searchInput = document.getElementById("venueSearch");
const searchResultsEl = document.getElementById("searchResults");

const infoPanel = document.getElementById("infoPanel");
const infoContent = document.querySelector(".info-content");
const infoEmptyEl = document.querySelector(".info-empty");
const browseListEl = document.getElementById("browseList");

const venueNameEl = document.getElementById("venueName");
const venueLocationEl = document.getElementById("venueLocation");
const rideshareNoteEl = document.getElementById("rideshareNote");
const rideshareHeadingEl = document.getElementById("rideshareHeading");
const rideshareCtaEl = document.getElementById("rideshareCta");

const uberToEl = document.getElementById("uberTo");
const uberFromEl = document.getElementById("uberFrom");
const lyftToEl = document.getElementById("lyftTo");
const lyftFromEl = document.getElementById("lyftFrom");

// Load parking.json as the data source (includes rideshare text + city/state)
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

/* ========== Search behavior ========== */
if (searchInput) {
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
}

// Click on search result
if (searchResultsEl) {
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
}

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
  if (!searchResultsEl) return;
  if (!searchResultsEl.contains(evt.target) && evt.target !== searchInput) {
    searchResultsEl.classList.remove("visible");
  }
});

/* ========== Core display ========== */
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

  // Heading + CTA copy to mirror your in-app feel
  if (rideshareHeadingEl) {
    rideshareHeadingEl.textContent = `${prettyName} Rideshare Tips`;
  }
  if (rideshareCtaEl) {
    rideshareCtaEl.textContent =
      "Click below to use rideshare apps for this venue.";
  }

  // Rideshare note from parking.json (already summarized by Colab),
  // with a polished fallback if it's empty.
  const note =
    v.rideshare && String(v.rideshare).trim().length
      ? v.rideshare
      : "We haven’t added specific rideshare notes for this venue yet. Check your ticket or the venue’s website for the latest pickup and dropoff details.";
  rideshareNoteEl.textContent = note;

  // Generate 4 deep links (Uber to/from, Lyft to/from)
  const enc = encodeURIComponent;

  let uberToUrl = "";
  let uberFromUrl = "";
  let lyftToUrl = "";
  let lyftFromUrl = "";

  const name = prettyName;
  const addressBase = [prettyName, city, state].filter(Boolean).join(", ");

  const lat = v.lat;
  const lng = v.lng;
  const hasCoords =
    lat !== undefined &&
    lng !== undefined &&
    lat !== null &&
    lng !== null &&
    String(lat).trim() !== "" &&
    String(lng).trim() !== "";

  if (hasCoords) {
    const latStr = String(lat);
    const lngStr = String(lng);

    // Uber to venue (pickup = my_location, dropoff = coords)
    uberToUrl =
      "https://m.uber.com/ul/?action=setPickup" +
      "&pickup=my_location" +
      "&dropoff%5Blatitude%5D=" +
      enc(latStr) +
      "&dropoff%5Blongitude%5D=" +
      enc(lngStr) +
      "&dropoff%5Bnickname%5D=" +
      enc(name);

    // Uber from venue (pickup = coords)
    uberFromUrl =
      "https://m.uber.com/ul/?action=setPickup" +
      "&pickup%5Blatitude%5D=" +
      enc(latStr) +
      "&pickup%5Blongitude%5D=" +
      enc(lngStr) +
      "&pickup%5Bnickname%5D=" +
      enc(name);

    // Lyft to venue
    lyftToUrl =
      "https://ride.lyft.com/?" +
      "destination%5Blatitude%5D=" +
      enc(latStr) +
      "&destination%5Blongitude%5D=" +
      enc(lngStr);

    // Lyft from venue
    lyftFromUrl =
      "https://ride.lyft.com/?" +
      "pickup%5Blatitude%5D=" +
      enc(latStr) +
      "&pickup%5Blongitude%5D=" +
      enc(lngStr);
  } else {
    // Fallback: text-based address if we don't have coordinates
    const addr = enc(addressBase);

    uberToUrl =
      "https://m.uber.com/ul/?action=setPickup" +
      "&pickup=my_location" +
      "&dropoff%5Bformatted_address%5D=" +
      addr +
      "&dropoff%5Bnickname%5D=" +
      enc(name);

    uberFromUrl =
      "https://m.uber.com/ul/?action=setPickup" +
      "&pickup%5Bformatted_address%5D=" +
      addr +
      "&pickup%5Bnickname%5D=" +
      enc(name);

    lyftToUrl =
      "https://ride.lyft.com/?" + "destination%5Baddress%5D=" + addr;

    lyftFromUrl =
      "https://ride.lyft.com/?" + "pickup%5Baddress%5D=" + addr;
  }

  uberToEl.href = uberToUrl;
  uberFromEl.href = uberFromUrl;
  lyftToEl.href = lyftToUrl;
  lyftFromEl.href = lyftFromUrl;
}
