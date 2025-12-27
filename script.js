const CHANNEL_ID = "3213564";
const API_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds/last.json`;

async function fetchData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        const temp = data.field1;
        const humidity = data.field2;
        const warning = data.field3;

        document.getElementById("temp").innerText = temp;
        document.getElementById("humidity").innerText = humidity;
        document.getElementById("time").innerText =
            new Date(data.created_at).toLocaleString();

        const statusEl = document.getElementById("status");

        if (warning === "1") {
            statusEl.innerText = "⚠️ HIGH TEMPERATURE";
            statusEl.className = "warning";
        } else {
            statusEl.innerText = "✅ Normal";
            statusEl.className = "safe";
        }

    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

// Refresh every 15 seconds
setInterval(fetchData, 15000);
fetchData();
