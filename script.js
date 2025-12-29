const MONITOR = {
    name: "Monitor 1",
    channelId: "3213564",
    readKey: "KTAK4J245ZYW9ON1",
    chartId: "chart1",
    chart: null,
    historyData: []
};

const BASE_URL = `https://api.thingspeak.com/channels/${MONITOR.channelId}/feeds.json?api_key=${MONITOR.readKey}`;

function createChart(ctx) {
    return new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [
                { label: "Temperature (°F)", data: [], tension: 0.3 },
                { label: "Humidity (%)", data: [], tension: 0.3 }
            ]
        },
        options: { responsive: true }
    });
}

async function loadHistory(hours) {
    const results = hours * 4; // ThingSpeak ≈ 1 entry / 15s
    const url = `${BASE_URL}&results=${results}`;

    const res = await fetch(url);
    const json = await res.json();

    MONITOR.historyData = json.feeds;

    if (!MONITOR.chart) {
        MONITOR.chart = createChart(document.getElementById(MONITOR.chartId));
    }

    const chart = MONITOR.chart;
    chart.data.labels = [];
    chart.data.datasets[0].data = [];
    chart.data.datasets[1].data = [];

    json.feeds.forEach(f => {
        if (!f.field1 || !f.field2) return;
        chart.data.labels.push(new Date(f.created_at).toLocaleTimeString());
        chart.data.datasets[0].data.push(parseFloat(f.field1));
        chart.data.datasets[1].data.push(parseFloat(f.field2));
    });

    chart.update();
    calculateFireRisk();
}

function calculateFireRisk() {
    if (MONITOR.historyData.length < 2) return;

    const last = MONITOR.historyData.at(-1);
    const prev = MONITOR.historyData.at(-2);

    const t1 = parseFloat(prev.field1);
    const t2 = parseFloat(last.field1);

    const time1 = new Date(prev.created_at);
    const time2 = new Date(last.created_at);

    const minutes = (time2 - time1) / 60000;
    const rate = (t2 - t1) / minutes; // °F per minute

    const riskEl = document.getElementById("fireRisk");

    if (rate > 2) {
        riskEl.innerText = "HIGH 🔥";
        riskEl.className = "high";
    } else if (rate > 0.5) {
        riskEl.innerText = "MEDIUM ⚠️";
        riskEl.className = "medium";
    } else {
        riskEl.innerText = "LOW ✅";
        riskEl.className = "low";
    }
}

function exportData(type) {
    if (!MONITOR.historyData.length) return;

    let dataStr;
    let mime;
    let ext;

    if (type === "json") {
        dataStr = JSON.stringify(MONITOR.historyData, null, 2);
        mime = "application/json";
        ext = "json";
    } else {
        const headers = Object.keys(MONITOR.historyData[0]).join(",");
        const rows = MONITOR.historyData.map(o => Object.values(o).join(","));
        dataStr = [headers, ...rows].join("\n");
        mime = "text/csv";
        ext = "csv";
    }

    const blob = new Blob([dataStr], { type: mime });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `monitor_data.${ext}`;
    a.click();

    URL.revokeObjectURL(url);
}

// Initial load
loadHistory(24);

// Auto-refresh every 5 minutes
setInterval(() => loadHistory(24), 300000);
