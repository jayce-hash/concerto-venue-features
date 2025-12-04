// Bag Policies folder + detail view

const folderView = document.getElementById("folderView");
const detailView = document.getElementById("detailView");

const searchInput = document.getElementById("venueSearch");
const venueListEl = document.getElementById("venueList");

const detailVenueNameEl = document.getElementById("detailVenueName");
const updatedBadgeEl = document.getElementById("updatedBadge");
const policyTextEl = document.getElementById("policyText");
const allowedEl = document.getElementById("allowedChips");
const notAllowedEl = document.getElementById("notAllowedChips");
const statusEl = document.getElementById("status");
const viewFullBtn = document.getElementById("viewFullPolicyBtn");
const essentialsBtn = document.getElementById("shopEssentialsBtn");
const backToListBtn = document.getElementById("backToListBtn");

let bagPolicies = {};
let venueIds = [];

// Turn "dickies_arena" into "Dickies Arena"
function displayNameFromSlug(slug) {
  return slug
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function renderFolderView(filterText = "") {
  folderView.style.display = "block";
  detailView.style.display = "none";

  const term = filterText.trim().toLowerCase();
  venueListEl.innerHTML = "";

  const filteredIds = venueIds.filter((id) => {
    const name = displayNameFromSlug(id).toLowerCase();
    return !term || name.includes(term);
  });

  if (!filteredIds.length) {
    const empty = document.createElement("div");
    empty.className = "status-text";
    empty.textContent = "No venues match that search yet.";
    venueListEl.appendChild(empty);
    return;
  }

  filteredIds.forEach((id) => {
    const venueData = bagPolicies[id] || {};
    const card = document.createElement("div");
    card.className = "list-item";
    card.style.cursor = "pointer";

    const title = document.createElement("div");
    title.className = "list-item-title";
    title.textContent = displayNameFromSlug(id);

    const meta = document.createElement("div");
    meta.className = "list-item-meta";

    if (venueData.fullLink) {
      meta.textContent = "Official bag policy link available";
    } else {
      meta.textContent = "Full bag policy link not added yet";
    }

    card.appendChild(title);
    card.appendChild(meta);

    card.onclick = () => showDetailView(id);

    venueListEl.appendChild(card);
  });
}

function showDetailView(venueId) {
  const venueData = bagPolicies[venueId] || {};
  const displayName = displayNameFromSlug(venueId);

  folderView.style.display = "none";
  detailView.style.display = "block";

  detailVenueNameEl.textContent = displayName;

  policyTextEl.textContent =
    venueData.summary ||
    "We haven’t added a summary for this venue yet. Please review the full policy once it’s available.";

  updatedBadgeEl.textContent = venueData.updated || "Updated";

  allowedEl.innerHTML = "";
  (venueData.allowed || []).forEach((item) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.textContent = item;
    allowedEl.appendChild(chip);
  });

  notAllowedEl.innerHTML = "";
  (venueData.notAllowed || []).forEach((item) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.textContent = item;
    notAllowedEl.appendChild(chip);
  });

  // Status / note
  if (venueData.note) {
    statusEl.textContent = venueData.note;
  } else if (!venueData.fullLink) {
    statusEl.textContent =
      "We don’t have a direct bag policy link for this venue yet. Please check your ticket or the venue website for the latest info.";
  } else {
    statusEl.textContent = "";
  }

  // Button behaviors — NO GOOGLE FALLBACK
  if (venueData.fullLink) {
    viewFullBtn.disabled = false;
    viewFullBtn.textContent = "View Full Policy";
    viewFullBtn.onclick = () => {
      window.open(venueData.fullLink, "_blank");
    };
  } else {
    viewFullBtn.disabled = true;
    viewFullBtn.textContent = "Full Policy Link Coming Soon";
    viewFullBtn.onclick = null;
  }

  // Essentials Kit (your shop URL)
  essentialsBtn.onclick = () => {
    window.open(
      venueData.essentialsLink || "https://yourstore.com/concerto-essentials",
      "_blank"
    );
  };
}

async function init() {
  try {
    const res = await fetch("/data/bag-policies.json");
    bagPolicies = await res.json();
    venueIds = Object.keys(bagPolicies).sort((a, b) =>
      displayNameFromSlug(a).localeCompare(displayNameFromSlug(b))
    );
    renderFolderView();
  } catch (err) {
    console.error(err);
    venueListEl.innerHTML = "";
    const error = document.createElement("div");
    error.className = "status-text";
    error.textContent =
      "We couldn't load bag policy data right now. Please try again later.";
    venueListEl.appendChild(error);
  }
}

// Search
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    renderFolderView(e.target.value);
  });
}

// Back
if (backToListBtn) {
  backToListBtn.onclick = () => {
    renderFolderView(searchInput ? searchInput.value : "");
  };
}

init();
