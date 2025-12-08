let bagData = {};
let venuesList = [];

const searchInput = document.getElementById("venueSearch");
const searchResultsEl = document.getElementById("searchResults");

const infoPanel = document.getElementById("infoPanel");
const infoContent = document.querySelector(".info-content");
const venueNameEl = document.getElementById("venueName");
const venueLocationEl = document.getElementById("venueLocation");

const bagSummaryEl = document.getElementById("bagSummary");
const allowedCardEl = document.getElementById("allowedCard");
const allowedListEl = document.getElementById("allowedList");
const notAllowedCardEl = document.getElementById("notAllowedCard");
const notAllowedListEl = document.getElementById("notAllowedList");
const extraCardEl = document.getElementById("extraCard");
const extraTextEl = document.getElementById("extraText");
const officialCardEl = document.getElementById("officialCard");
const bagLinkEl = document.getElementById("bagLink");

// Fetch JSON
fetch("/data/bag_policies.json")
  .then((res) => res.json())
  .then((data) => {
    bagData = data || {};
    venuesList = buildVenuesList(bagData);
  })
  .catch((err) => {
    console.error("Error loading bag_policies.json", err);
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

// Search
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
      (v) =>
        `<div class="search-result-item" data-slug="${v.slug}">
          ${v.label}
        </div>`
    )
    .join("");

  searchResultsEl.classList.add("visible");
});

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

document.addEventListener("click", (evt) => {
  if (!searchResultsEl.contains(evt.target) && evt.target !== searchInput) {
    searchResultsEl.classList.remove("visible");
  }
});

function showVenue(slug) {
  const v = bagData[slug];
  if (!v) return;

  infoPanel.classList.remove("info-panel--empty");
  infoContent.hidden = false;
  document.querySelector(".info-empty").style.display = "none";

  const prettyName = prettifySlug(slug);
  venueNameEl.textContent = prettyName;

  const locParts = [];
  if (v.city) locParts.push(v.city);
  if (v.state) locParts.push(v.state);
  venueLocationEl.textContent = locParts.join(", ");

  bagSummaryEl.textContent =
    v.summary ||
    "This venue follows a clear bag-style security policy. Check the official bag policy link for full details.";

  // Allowed
  if (Array.isArray(v.allowed) && v.allowed.length) {
    allowedListEl.innerHTML = v.allowed
      .map((item) => `<li>${item}</li>`)
      .join("");
    allowedCardEl.hidden = false;
  } else {
    allowedListEl.innerHTML = "";
    allowedCardEl.hidden = true;
  }

  // Not allowed
  if (Array.isArray(v.notAllowed) && v.notAllowed.length) {
    notAllowedListEl.innerHTML = v.notAllowed
      .map((item) => `<li>${item}</li>`)
      .join("");
    notAllowedCardEl.hidden = false;
  } else {
    notAllowedListEl.innerHTML = "";
    notAllowedCardEl.hidden = true;
  }

  // Extra
  if (v.note && v.note.trim().length) {
    extraTextEl.textContent = v.note;
    extraCardEl.hidden = false;
  } else {
    extraTextEl.textContent = "";
    extraCardEl.hidden = true;
  }

  // Official link
  if (v.fullLink) {
    bagLinkEl.href = v.fullLink;
    officialCardEl.hidden = false;
  } else {
    bagLinkEl.href = "#";
    officialCardEl.hidden = true;
  }
}
