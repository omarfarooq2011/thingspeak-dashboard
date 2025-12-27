const CHANNEL_ID = "3213564";
const READ_API_KEY = "KTAK4J245ZYW9ON1";

const API_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds/last.json?api_key=${READ_API_KEY}`;

async function fetchData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        console.log("ThingSpeak response:", data);

        // Safety check
        if (!data || !data.field1 || !data.field2) {
            throw new Error("No valid data received");
        }

        const temperature = parseFloat(data.field1).toFixed(1);
        const humidity = parseFloat(data.field2).toFixed(1);
        const warning = data.field3 === "1";

        document.getElementById("temp").innerText = temperature;
        document.getElementById("humidity").innerText = humidity;

        const statusEl = document.getElementById("status");

        if (warning) {
            statusEl.innerText = "⚠️ HIGH TEMPERATURE";
            statusEl.className = "warning";
        } else {
            statusEl.innerText = "✅ Normal";
            statusEl.className = "safe";
        }

        const timestamp = new Date(data.created_at);
        document.getElementById("time").innerText =
            isNaN(timestamp) ? "Unknown" : timestamp.toLocaleString();

    } catch (error) {
        console.error("Error fetching data:", error);

        document.getElementById("status").innerText = "⚠️ Data Error";
        document.getElementById("status").className = "warning";
    }
}

// Initial load + refresh every 15s
fetchData();
setInterval(fetchData, 15000);
