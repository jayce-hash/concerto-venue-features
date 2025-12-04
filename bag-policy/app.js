// Helper to read URL query params (?venueId=...&venueName=...&city=...)
function param(name) {
  return new URLSearchParams(window.location.search).get(name) || "";
}

const venueId = param("venueId");
const venueName = decodeURIComponent(param("venueName"));
const venueCity = decodeURIComponent(param("city"));

document.getElementById("venueName").textContent = venueName || "";
document.getElementById("venueCity").textContent = venueCity || "";

const policyTextEl = document.getElementById("policyText");
const updatedBadgeEl = document.getElementById("updatedBadge");
const allowedEl = document.getElementById("allowedChips");
const notAllowedEl = document.getElementById("notAllowedChips");
const statusEl = document.getElementById("status");
const viewFullBtn = document.getElementById("viewFullPolicyBtn");
const essentialsBtn = document.getElementById("shopEssentialsBtn");

async function loadPolicy() {
  try {
    const res = await fetch("/data/bag-policies.json");
    const data = await res.json();

    const venue = data[venueId];

    if (!venue) {
      policyTextEl.textContent = "Bag policy coming soon.";
      updatedBadgeEl.textContent = "Updating";
      viewFullBtn.disabled = true;
      return;
    }

    // Summary
    policyTextEl.textContent = venue.summary || "Details coming soon.";

    // Updated badge
    updatedBadgeEl.textContent = venue.updated || "Updated";

    // Allowed items
    allowedEl.innerHTML = "";
    (venue.allowed || []).forEach(item => {
      const chip = document.createElement("div");
      chip.className = "chip";
      chip.textContent = item;
      allowedEl.appendChild(chip);
    });

    // Not allowed
    notAllowedEl.innerHTML = "";
    (venue.notAllowed || []).forEach(item => {
      const chip = document.createElement("div");
      chip.className = "chip";
      chip.textContent = item;
      notAllowedEl.appendChild(chip);
    });

    // Status note
    statusEl.textContent = venue.note || "";

    // Full Policy link
    viewFullBtn.onclick = () => {
      if (venue.fullLink) {
        window.open(venue.fullLink, "_blank");
      }
    };

    // Essentials Kit link (set yours later)
    essentialsBtn.onclick = () => {
      window.open(
        venue.essentialsLink || "https://yourstore.com/concerto-essentials",
        "_blank"
      );
    };

  } catch (err) {
    console.error(err);
    policyTextEl.textContent = "Error loading bag policy.";
  }
}

loadPolicy();

