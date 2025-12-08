let concessionsData = {};
let venuesList = [];

const searchInput = document.getElementById("venueSearch");
const searchResultsEl = document.getElementById("searchResults");

const infoPanel = document.getElementById("infoPanel");
const infoContent = document.querySelector(".info-content");
const venueNameEl = document.getElementById("venueName");
const venueLocationEl = document.getElementById("venueLocation");
const concessionsNoteEl = document.getElementById("concessionsNote");
const standsCardEl = document.getElementById("standsCard");
const standsListEl = document.getElementById("standsList");
const officialCardEl = document.getElementById("officialCard");
const concessionsLinkEl = document.getElementById("concessionsLink");

// Fetch JSON on load
fetch("/data/concessions.json")
  .then((res) => res.json())
  .then((data) => {
    concessionsData = data || {};
    venuesList = buildVenuesList(concessionsData);
  })
  .catch((err) => {
    console.error("Error loading concessions.json", err);
  });

function buildVenuesList(data) {
  const items = [];
  for (const slug in data) {
    const v = data[slug];
    // We don't have the original name stored, so use slug prettified
    const nameGuess = prettifySlug(slug);
    const city = v.city || "";
    const state = v.state || "";
    const label = state ? `${nameGuess} — ${city}, ${state}` : nameGuess;

    items.push({ slug, label, city, state, displayName: nameGuess });
  }
  // Sort alphabetically
  return items.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

function prettifySlug(slug) {
  if (!slug) return "";
  const parts = slug.split("_").map((p) => {
    if (!p) return "";
    return p.charAt(0).toUpperCase() + p.slice(1);
  });
  return parts.join(" ");
}

// Search handling
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

// Click on a search result
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
  const v = concessionsData[slug];
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

  concessionsNoteEl.textContent =
    v.note ||
    "Concessions details for this venue are not available yet. Use the official concessions page for the latest information.";

  // Stands
  if (Array.isArray(v.stands) && v.stands.length) {
    standsListEl.innerHTML = v.stands
      .map((s) => `<li>${s}</li>`)
      .join("");
    standsCardEl.hidden = false;
  } else {
    standsListEl.innerHTML = "";
    standsCardEl.hidden = true;
  }

  // Official link
  if (v.officialConcessionsUrl) {
    concessionsLinkEl.href = v.officialConcessionsUrl;
    officialCardEl.hidden = false;
  } else {
    concessionsLinkEl.href = "#";
    officialCardEl.hidden = true;
  }
}
