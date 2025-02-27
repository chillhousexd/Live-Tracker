let followCab = "all";

const x = document.getElementById("demo");
let userLocation = null;

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
  } else {
    x.innerHTML = "Geolocation is not supported by this browser.";
  }
}

function showPosition(position) {
  userLocation = {
    lat: position.coords.latitude,
    long: position.coords.longitude,
  };
  x.innerHTML =
    "Latitude: " +
    position.coords.latitude +
    "<br>Longitude: " +
    position.coords.longitude;
}
getLocation();

const followSelect = document.getElementById("followSelect");
followSelect.addEventListener("change", (e) => {
  followCab = e.target.value;
  if (followCab === "all") {
    map.setView([25.62324, 85.041775], 10);
  } else if (taxiData[followCab]) {
    const { lat, long } = taxiData[followCab].lastPosition;
    map.setView([lat, long], 15);
  }
});

const map = L.map("map").setView([25.62324, 85.041775], 7);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

let taxiData = {};

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function fetchTaxis() {
  try {
    const response = await fetch("/api/get_moving_cabs", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ category: "Operational" }),
    });

    const result = await response.json();
    console.log("Received Taxi Data:", result);

    if (!result.status || !result.data || result.data.length === 0) {
      console.warn("No valid taxi data found.");
      return;
    }

    updateDropdown(result.data);

    result.data.forEach((val) => {
      if (
        !val.cab_reg ||
        !Array.isArray(val.lat_long) ||
        val.lat_long.length < 2
      ) {
        console.warn(`Skipping invalid cab data:`, val);
        return;
      }

      const points = val.lat_long;
      const startPoint = points[points.length - 2] || points[0];
      const endPoint = points[points.length - 1];
      const iconUrl = val.icon || "https://rodbez.in/web_assets/icons/avl.png";

      let distanceText = "Distance: Unknown"; // Default value

      if (userLocation) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.long,
          endPoint.lat,
          endPoint.long
        );
        distanceText = `📍 ${distance.toFixed(2)} km away`;
      }

      if (!taxiData[val.cab_reg]) {
        const carIcon = L.icon({
          iconUrl,
          iconSize: [25, 30],
          iconAnchor: [12, 15],
        });

        const popupContent = `🚖 ${val.cab_reg}<br>${startPoint.info}<br>${distanceText}`;

        const marker = L.marker([startPoint.lat, startPoint.long], {
          icon: carIcon,
        })
          .addTo(map)
          .bindPopup(popupContent);

        taxiData[val.cab_reg] = {
          marker,
          polyline: L.polyline([[startPoint.lat, startPoint.long]], {
            color: "transparent",
            weight: 3,
            opacity: 0,
          }).addTo(map),
          lastPosition: { lat: startPoint.lat, long: startPoint.long },
        };
      } else {
        const popupContent = `🚖 ${val.cab_reg}<br>${startPoint.info}<br>${distanceText}`;
        taxiData[val.cab_reg].marker.setPopupContent(popupContent);
      }

      animateTaxi(taxiData[val.cab_reg], startPoint, endPoint, 120000, val.cab_reg);
    });
  } catch (error) {
    console.error("Error fetching taxi data:", error);
  } finally {
    setTimeout(fetchTaxis, 120000);
  }
}

function updateDropdown(data) {
  followSelect.innerHTML = '<option value="all">All</option>';

  data.forEach((val) => {
    if (val.cab_reg) {
      const option = document.createElement("option");
      option.value = val.cab_reg;
      option.textContent = val.cab_reg;
      followSelect.appendChild(option);
    }
  });
}

function animateTaxi(taxi, startPos, endPos, duration, cabReg) {
  if (!taxi) return;
  taxi.marker.setLatLng([startPos.lat, startPos.long]);
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    let progress = elapsed / duration;
    if (progress > 1) progress = 1;

    const currentLat = startPos.lat + (endPos.lat - startPos.lat) * progress;
    const currentLong =
      startPos.long + (endPos.long - startPos.long) * progress;
    taxi.marker.setLatLng([currentLat, currentLong]);

    if (taxi.marker.setRotationAngle) {
      const bearing = calculateBearing(
        currentLat,
        currentLong,
        endPos.lat,
        endPos.long
      );
      taxi.marker.setRotationAngle(bearing);
    }

    if (followCab === cabReg) {
      map.panTo([currentLat, currentLong]);
    }

    taxi.polyline.setLatLngs([
      [startPos.lat, startPos.long],
      [currentLat, currentLong],
    ]);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      taxi.lastPosition = { lat: endPos.lat, long: endPos.long };
    }
  }
  requestAnimationFrame(step);
}

function calculateBearing(lat1, long1, lat2, long2) {
  const toRad = Math.PI / 180;
  const toDeg = 180 / Math.PI;
  const dLong = (long2 - long1) * toRad;
  const y = Math.sin(dLong) * Math.cos(lat2 * toRad);
  const x =
    Math.cos(lat1 * toRad) * Math.sin(lat2 * toRad) -
    Math.sin(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.cos(dLong);
  const brng = Math.atan2(y, x) * toDeg;
  return (brng + 360) % 360;
}

fetchTaxis();
