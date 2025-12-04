// Concessions folder + detail view

const folderViewC = document.getElementById("folderView");
const detailViewC = document.getElementById("detailView");

const searchInputC = document.getElementById("venueSearch");
const venueListElC = document.getElementById("venueList");

const detailVenueNameElC = document.getElementById("detailVenueName");
const updatedBadgeElC = document.getElementById("updatedBadge");
const concessionsNoteEl = document.getElementById("concessionsNote");
const concessionsStatusEl = document.getElementById("concessionsStatus");
const openConcessionsPageBtn = document.getElementById("openConcessionsPageBtn");
const backToListBtnC = document.getElementById("backToListBtn");

let concessionsData = {};
let concessionsVenueIds = [];

function displayNameFromSlug(slug) {
  return slug
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function renderFolderViewConcessions(filterText = "") {
  folderViewC.style.display = "block";
  detailViewC.style.display = "none";

  const term = filterText.trim().toLowerCase();
  venueListElC.innerHTML = "";

  const filteredIds = concessionsVenueIds.filter((id) => {
    const name = displayNameFromSlug(id).toLowerCase();
    return !term || name.includes(term);
  });

  if (!filteredIds.length) {
    const empty = document.createElement("div");
    empty.className = "status-text";
    empty.textContent = "No venues match that search yet.";
    venueListElC.appendChild(empty);
    return;
  }

  filteredIds.forEach((id) => {
    const venueData = concessionsData[id] || {};
    const card = document.createElement("div");
    card.className = "list-item";
    card.style.cursor = "pointer";

    const title = document.createElement("div");
    title.className = "list-item-title";
    title.textContent = displayNameFromSlug(id);

    const meta = document.createElement("div");
    meta.className = "list-item-meta";

    if (venueData.officialConcessionsUrl) {
      meta.textContent = "Official concessions page available";
    } else {
      meta.textContent = "Concessions link not added yet";
    }

    card.appendChild(title);
    card.appendChild(meta);

    card.onclick = () => showDetailViewConcessions(id);

    venueListElC.appendChild(card);
  });
}

function showDetailViewConcessions(venueId) {
  const venueData = concessionsData[venueId] || {};
  const displayName = displayNameFromSlug(venueId);

  folderViewC.style.display = "none";
  detailViewC.style.display = "block";

  detailVenueNameElC.textContent = displayName;

  concessionsNoteEl.textContent =
    venueData.note ||
    "We haven’t added specific concessions notes for this venue yet.";

  updatedBadgeElC.textContent = venueData.updated || "Updated";

  if (!venueData.officialConcessionsUrl) {
    concessionsStatusEl.textContent =
      "We don’t have a direct concessions page linked for this venue yet. Please check your ticket or the venue website for the latest info.";
  } else {
    concessionsStatusEl.textContent = "";
  }

  // Button behavior — NO GOOGLE FALLBACK
  if (venueData.officialConcessionsUrl) {
    openConcessionsPageBtn.disabled = false;
    openConcessionsPageBtn.textContent = "View Full Concessions";
    openConcessionsPageBtn.onclick = () => {
      window.open(venueData.officialConcessionsUrl, "_blank");
    };
  } else {
    openConcessionsPageBtn.disabled = true;
    openConcessionsPageBtn.textContent = "Concessions Link Coming Soon";
    openConcessionsPageBtn.onclick = null;
  }
}

async function initConcessions() {
  try {
    const res = await fetch("/data/concessions.json");
    concessionsData = await res.json();
    concessionsVenueIds = Object.keys(concessionsData).sort((a, b) =>
      displayNameFromSlug(a).localeCompare(displayNameFromSlug(b))
    );
    renderFolderViewConcessions();
  } catch (err) {
    console.error(err);
    venueListElC.innerHTML = "";
    const error = document.createElement("div");
    error.className = "status-text";
    error.textContent =
      "We couldn't load concessions data right now. Please try again later.";
    venueListElC.appendChild(error);
  }
}

// Search
if (searchInputC) {
  searchInputC.addEventListener("input", (e) => {
    renderFolderViewConcessions(e.target.value);
  });
}

// Back
if (backToListBtnC) {
  backToListBtnC.onclick = () => {
    renderFolderViewConcessions(searchInputC ? searchInputC.value : "");
  };
}

initConcessions();
