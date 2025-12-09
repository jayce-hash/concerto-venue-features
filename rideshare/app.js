let rideshareData = {};
let venuesList = [];

const searchInput = document.getElementById("venueSearch");
const searchResultsEl = document.getElementById("searchResults");

const infoPanel = document.getElementById("infoPanel");
const infoContent = document.querySelector(".info-content");
const infoEmptyEl = document.querySelector(".info-empty");

const venueNameEl = document.getElementById("venueName");
const venueLocationEl = document.getElementById("venueLocation");
const rideshareInfoCardEl = document.getElementById("rideshare-info");
const rideshareTextEl = document.getElementById("rideshare-text");
const buttonsCardEl = document.getElementById("rideshare-buttons");

const uberToBtn = document.getElementById("uber-to");
const uberFromBtn = document.getElementById("uber-from");
const lyftToBtn = document.getElementById("lyft-to");
const lyftFromBtn = document.getElementById("lyft-from");

// Load rideshare data
fetch("rideshare.json")
  .then((res) => res.json())
  .then((data) => {
    rideshareData = data || {};
    venuesList = buildVenuesList(rideshareData);
    wireSearch();
    handleDeepLink(); // support ?venue=slug
  })
  .catch((err) => {
    console.error("Error loading rideshare.json", err);
  });

function buildVenuesList(dataObj) {
  const items = [];
  for (const slug in dataObj) {
    const v = dataObj[slug];
    const name = v.venueName || v.name || prettifySlug(slug);
    const city = v.city || "";
    const state = v.state || "";
    const label = state ? `${name} — ${city}, ${state}` : name;

    items.push({
      slug,
      displayName: name,
      label,
    });
  }
  items.sort((a, b) => a.displayName.localeCompare(b.displayName));
  return items;
}

function prettifySlug(slug) {
  if (!slug) return "";
  return slug
    .split("_")
    .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : ""))
    .join(" ");
}

function wireSearch() {
  if (!searchInput || !searchResultsEl) return;

  // Typeahead suggestions
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) {
      searchResultsEl.classList.remove("visible");
      searchResultsEl.innerHTML = "";
      return;
    }

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
        (v) => `
        <div class="search-result-item" data-slug="${v.slug}">
          ${v.label}
        </div>
      `
      )
      .join("");

    searchResultsEl.classList.add("visible");
  });

  // Click on a suggestion
  searchResultsEl.addEventListener("click", (evt) => {
    const item = evt.target.closest(".search-result-item");
    if (!item) return;
    const slug = item.getAttribute("data-slug");
    const meta = venuesList.find((v) => v.slug === slug);
    if (!meta) return;

    searchInput.value = meta.displayName;
    searchResultsEl.classList.remove("visible");
    showVenue(slug);
  });

  // Hide dropdown when clicking away
  document.addEventListener("click", (evt) => {
    if (!searchResultsEl.contains(evt.target) && evt.target !== searchInput) {
      searchResultsEl.classList.remove("visible");
    }
  });
}

function showVenue(slug) {
  const v = rideshareData[slug];
  if (!v) return;

  infoPanel.classList.remove("info-panel--empty");
  infoContent.hidden = false;
  if (infoEmptyEl) infoEmptyEl.style.display = "none";

  const displayName = v.venueName || prettifySlug(slug);
  venueNameEl.textContent = displayName;

  const locParts = [];
  if (v.city) locParts.push(v.city);
  if (v.state) locParts.push(v.state);
  venueLocationEl.textContent = locParts.join(", ");

  // Info text (hide generic “no specific notes” ones)
  let notes = (v.note || v.rideshare || v.rideshareNotes || "").trim();
  const lower = notes.toLowerCase();
  if (lower.startsWith("no specific rideshare notes available")) {
    notes = "";
  }

  if (notes) {
    rideshareTextEl.textContent = notes;
    rideshareInfoCardEl.hidden = false;
  } else {
    rideshareTextEl.textContent = "";
    rideshareInfoCardEl.hidden = true;
  }

  // Buttons depend on coords
  const lat = v.lat;
  const lng = v.lng;

  if (lat == null || lng == null) {
    buttonsCardEl.hidden = true;
    return;
  }

  buttonsCardEl.hidden = false;

  const venueName = displayName || "Venue";
  const latEnc = encodeURIComponent(lat);
  const lngEnc = encodeURIComponent(lng);
  const nameEnc = encodeURIComponent(venueName);

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
  if (!btn) return;

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

// Deep-link: /rideshare/?venue=sofi_stadium
function handleDeepLink() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("venue");
  if (!slug || !rideshareData[slug]) return;

  const meta = venuesList.find((v) => v.slug === slug);
  if (meta && searchInput) {
    searchInput.value = meta.displayName;
  }
  showVenue(slug);
}
