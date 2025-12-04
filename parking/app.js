// Helper to read URL params
function param(name) {
  return new URLSearchParams(window.location.search).get(name) || "";
}

const venueId = param("venueId");
const venueName = decodeURIComponent(param("venueName"));
const venueCity = decodeURIComponent(param("city"));
const lat = param("lat");
const lng = param("lng");

// Header text
document.getElementById("venueName").textContent = venueName || "";
document.getElementById("venueCity").textContent = venueCity || "";

// Elements
const mapFrame = document.getElementById("mapFrame");
const updatedBadgeEl = document.getElementById("parkingUpdatedBadge");
const rideshareTextEl = document.getElementById("rideshareText");
const parkingListEl = document.getElementById("parkingList");
const parkingStatusEl = document.getElementById("parkingStatus");
const openVenueInMapsBtn = document.getElementById("openVenueInMapsBtn");
const openParkingPageBtn = document.getElementById("openParkingPageBtn");

// --- Map setup (no API key needed) ---
(function setupMap() {
  if (lat && lng) {
    // Center on coordinates
    mapFrame.src = `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
  } else if (venueName || venueCity) {
    const query = encodeURIComponent(`${venueName} ${venueCity}`);
    mapFrame.src = `https://www.google.com/maps?q=${query}&z=15&output=embed`;
  } else {
    // Fallback: generic map of USA
    mapFrame.src = "https://www.google.com/maps?q=United%20States&z=3&output=embed";
  }
})();

// --- Button actions ---
openVenueInMapsBtn.onclick = () => {
  if (lat && lng) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, "_blank");
  } else if (venueName || venueCity) {
    const query = encodeURIComponent(`${venueName} ${venueCity}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  }
};

openParkingPageBtn.onclick = () => {
  // We'll wire the real URL after we load JSON
};

// --- Load parking data from /data/parking.json ---
async function loadParking() {
  try {
    const res = await fetch("/data/parking.json");
    const data = await res.json();

    const venueParking = data[venueId];

    if (!venueParking) {
      updatedBadgeEl.textContent = "Updating Soon";
      rideshareTextEl.textContent = "We’re still adding detailed parking information for this venue.";
      parkingStatusEl.textContent = "";
      openParkingPageBtn.disabled = true;
      return;
    }

    // Updated badge
    updatedBadgeEl.textContent = venueParking.updated || "Recently Updated";

    // Rideshare text
    rideshareTextEl.textContent =
      venueParking.rideshare ||
      "Check the venue’s official site or event page for the latest rideshare pickup and dropoff zones.";

    // Wire Official Parking Info button
    if (venueParking.officialParkingUrl) {
      openParkingPageBtn.onclick = () => {
        window.open(venueParking.officialParkingUrl, "_blank");
      };
    } else {
      openParkingPageBtn.disabled = true;
    }

    // Lots list
    parkingListEl.innerHTML = "";
    const lots = venueParking.lots || [];

    if (!lots.length) {
      const empty = document.createElement("div");
      empty.className = "status-text";
      empty.textContent = "Specific lot and garage details are coming soon.";
      parkingListEl.appendChild(empty);
    } else {
      lots.forEach((lot) => {
        const item = document.createElement("div");
        item.className = "list-item";

        const title = document.createElement("div");
        title.className = "list-item-title";
        title.textContent = lot.name || "Parking Lot";

        const meta = document.createElement("div");
        meta.className = "list-item-meta";

        const bits = [];
        if (lot.distance) bits.push(lot.distance);
        if (lot.price) bits.push(lot.price);
        if (lot.notes) bits.push(lot.notes);
        meta.textContent = bits.join(" • ");

        const actions = document.createElement("div");
        actions.className = "list-item-actions";

        // Open in Maps link
        const mapsLink = document.createElement("a");
        mapsLink.className = "link-pill";
        mapsLink.textContent = "Open in Maps";
        if (lot.lat && lot.lng) {
          mapsLink.href = `https://www.google.com/maps/search/?api=1&query=${lot.lat},${lot.lng}`;
        } else if (lot.mapsUrl) {
          mapsLink.href = lot.mapsUrl;
        } else if (venueName || venueCity) {
          const q = encodeURIComponent(`${venueName} parking`);
          mapsLink.href = `https://www.google.com/maps/search/?api=1&query=${q}`;
        } else {
          mapsLink.href = "#";
        }
        mapsLink.target = "_blank";
        actions.appendChild(mapsLink);

        // Prepay Parking link (optional)
        if (lot.prepayUrl) {
          const prepayLink = document.createElement("a");
          prepayLink.className = "link-pill";
          prepayLink.textContent = "Prepay Parking";
          prepayLink.href = lot.prepayUrl;
          prepayLink.target = "_blank";
          actions.appendChild(prepayLink);
        }

        item.appendChild(title);
        item.appendChild(meta);
        item.appendChild(actions);

        parkingListEl.appendChild(item);
      });
    }

    // Note at bottom
    parkingStatusEl.textContent =
      venueParking.note || "Parking availability and pricing can vary by event.";
  } catch (err) {
    console.error(err);
    rideshareTextEl.textContent = "We couldn’t load parking info right now.";
    parkingStatusEl.textContent = "Try again in a moment, or check the venue’s official parking page.";
  }
}

loadParking();

