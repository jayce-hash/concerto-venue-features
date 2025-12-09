// rideshare/app.js

// Path to your JSON (relative to the rideshare folder)
const DATA_URL = "../data/rideshare.json";

let rideshareData = {};
let venues = [];

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("venueSearch");
  const searchResultsEl = document.getElementById("searchResults");

  // Load JSON
  fetch(DATA_URL)
    .then((res) => res.json())
    .then((data) => {
      rideshareData = data || {};

      // Flatten into an array for searching / browsing
      venues = Object.keys(rideshareData)
        .map((slug) => {
          const v = rideshareData[slug] || {};
          return {
            slug,
            name: v.venueName || slugToTitle(slug),
            city: v.city || "",
            state: v.state || "",
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      renderBrowseList();
    })
    .catch((err) => {
      console.error("Error loading rideshare.json", err);
    });

  // Search wiring
  if (searchInput && searchResultsEl) {
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.trim().toLowerCase();
      const matches = q
        ? venues.filter((v) => v.name.toLowerCase().includes(q))
        : [];

      renderSearchResults(matches);
      renderBrowseList(q); // also filter the browse list
    });

    document.addEventListener("click", (e) => {
      if (!searchResultsEl.contains(e.target) && e.target !== searchInput) {
        searchResultsEl.classList.remove("visible");
      }
    });
  }
});

// ============ Rendering ============

function renderBrowseList(filterText = "") {
  const listEl = document.getElementById("browseList");
  if (!listEl) return;

  const q = filterText.trim().toLowerCase();

  const visible = q
    ? venues.filter((v) => v.name.toLowerCase().includes(q))
    : venues;

  listEl.innerHTML = "";

  visible.forEach((v) => {
    const row = document.createElement("div");
    row.className = "browse-item";
    row.dataset.slug = v.slug;

    const locationText =
      v.city && v.state ? `${v.city}, ${v.state}` : v.city || v.state || "";

    row.textContent = locationText
      ? `${v.name} • ${locationText}`
      : v.name;

    row.addEventListener("click", () => {
      selectVenue(v.slug);
    });

    listEl.appendChild(row);
  });
}

function renderSearchResults(matches) {
  const searchResultsEl = document.getElementById("searchResults");
  if (!searchResultsEl) return;

  searchResultsEl.innerHTML = "";

  if (!matches.length) {
    searchResultsEl.classList.remove("visible");
    return;
  }

  matches.forEach((v) => {
    const item = document.createElement("div");
    item.className = "search-result-item";

    const locationText =
      v.city && v.state ? `${v.city}, ${v.state}` : v.city || v.state || "";

    item.textContent = locationText
      ? `${v.name} • ${locationText}`
      : v.name;

    item.addEventListener("click", () => {
      const input = document.getElementById("venueSearch");
      if (input) {
        input.value = v.name;
      }
      searchResultsEl.classList.remove("visible");
      selectVenue(v.slug);
    });

    searchResultsEl.appendChild(item);
  });

  searchResultsEl.classList.add("visible");
}

// ============ Venue selection ============

function selectVenue(slug) {
  const venueData = rideshareData[slug];
  if (!venueData) {
    console.warn("No rideshare data for slug:", slug);
    return;
  }

  const infoPanel = document.getElementById("infoPanel");
  const infoContent = document.querySelector(".info-content");

  const venueNameEl = document.getElementById("venueName");
  const venueLocationEl = document.getElementById("venueLocation");

  const rideshareCard = document.getElementById("rideshareCard");
  const rideshareTextEl = document.getElementById("rideshareText");
  const rideshareButtonsCard = document.getElementById(
    "rideshareButtonsCard"
  );

  if (infoPanel && infoContent) {
    infoPanel.classList.remove("info-panel--empty");
    infoContent.hidden = false;
  }

  const venueName = venueData.venueName || slugToTitle(slug);
  const city = venueData.city || "";
  const state = venueData.state || "";

  if (venueNameEl) venueNameEl.textContent = venueName;
  if (venueLocationEl) {
    venueLocationEl.textContent =
      city && state ? `${city}, ${state}` : city || state || "";
  }

  // Rideshare info text
  const note = (venueData.note || "").trim();
  if (rideshareCard && rideshareTextEl) {
    if (note) {
      rideshareTextEl.textContent = note;
      rideshareCard.hidden = false;
    } else {
      // If you truly want *no* text when empty, keep this hidden:
      rideshareCard.hidden = true;
    }
  }

  // 🔑 Always show the button card for every venue
  if (rideshareButtonsCard) {
    rideshareButtonsCard.hidden = false;
  }

  const lat = venueData.lat;
  const lng = venueData.lng;

  wireRideshareButtons(venueName, lat, lng, city, state);
}

// ============ Button wiring ============

function wireRideshareButtons(venueName, lat, lng, city, state) {
  const uberToBtn = document.getElementById("uber-to");
  const uberFromBtn = document.getElementById("uber-from");
  const lyftToBtn = document.getElementById("lyft-to");
  const lyftFromBtn = document.getElementById("lyft-from");

  const encodedName = encodeURIComponent(venueName);
  const fullTextLocation = [venueName, city, state].filter(Boolean).join(", ");
  const encodedFullLocation = encodeURIComponent(fullTextLocation);

  const hasCoords = typeof lat === "number" && typeof lng === "number";

  let uberToUrl, uberFromUrl, lyftToUrl, lyftFromUrl;

  if (hasCoords) {
    // ✅ Best case: pre-filled coordinates
    uberToUrl =
      `https://m.uber.com/ul/?action=setPickup` +
      `&pickup=my_location` +
      `&dropoff[latitude]=${lat}` +
      `&dropoff[longitude]=${lng}` +
      `&dropoff[nickname]=${encodedName}`;

    uberFromUrl =
      `https://m.uber.com/ul/?action=setPickup` +
      `&pickup[latitude]=${lat}` +
      `&pickup[longitude]=${lng}` +
      `&pickup[nickname]=${encodedName}`;

    lyftToUrl =
      `https://ride.lyft.com/?destination[latitude]=${lat}` +
      `&destination[longitude]=${lng}`;

    lyftFromUrl =
      `https://ride.lyft.com/?pickup[latitude]=${lat}` +
      `&pickup[longitude]=${lng}`;
  } else {
    // 🟡 Fallback: still open the app, best-effort with text location
    // (You can tweak these if Uber/Lyft behavior changes)
    uberToUrl =
      `https://m.uber.com/ul/?action=setPickup` +
      (fullTextLocation
        ? `&dropoff[nickname]=${encodedFullLocation}`
        : "");

    uberFromUrl =
      `https://m.uber.com/ul/?action=setPickup` +
      (fullTextLocation
        ? `&pickup[nickname]=${encodedFullLocation}`
        : "");

    lyftToUrl = fullTextLocation
      ? `https://ride.lyft.com/?destination[address]=${encodedFullLocation}`
      : `https://ride.lyft.com/`;

    lyftFromUrl = fullTextLocation
      ? `https://ride.lyft.com/?pickup[address]=${encodedFullLocation}`
      : `https://ride.lyft.com/`;
  }

  // Update button labels to be venue-specific
  if (uberToBtn) {
    uberToBtn.textContent = `Uber to ${venueName}`;
    uberToBtn.onclick = () => {
      window.location.href = uberToUrl;
    };
  }

  if (uberFromBtn) {
    uberFromBtn.textContent = `Uber from ${venueName}`;
    uberFromBtn.onclick = () => {
      window.location.href = uberFromUrl;
    };
  }

  if (lyftToBtn) {
    lyftToBtn.textContent = `Lyft to ${venueName}`;
    lyftToBtn.onclick = () => {
      window.location.href = lyftToUrl;
    };
  }

  if (lyftFromBtn) {
    lyftFromBtn.textContent = `Lyft from ${venueName}`;
    lyftFromBtn.onclick = () => {
      window.location.href = lyftFromUrl;
    };
  }
}

// ============ Helper ============

function slugToTitle(slug) {
  return slug
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
