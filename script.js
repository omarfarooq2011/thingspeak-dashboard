const MONITORS = [
  {
    name: "Monitor 1",
    channelId: "3213564",
    readKey: "KTAK4J245ZYW9ON1",
    chartId: "chart1",
    statusId: "status1",
    updateId: "update1",
    chart: null,
    history: []
  },
  {
    name: "Monitor 2",
    channelId: "3213607",
    readKey: "96JPYOD19L5RZBVO",
    chartId: "chart2",
    statusId: "status2",
    updateId: "update2",
    chart: null,
    history: []
  }
];

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
  for (const m of MONITORS) {
    const results = Math.min(hours * 4, 8000);
    const url = `https://api.thingspeak.com/channels/${m.channelId}/feeds.json?api_key=${m.readKey}&results=${results}`;

    const res = await fetch(url);
    const json = await res.json();

    m.history = json.feeds;

    if (!m.chart) {
      m.chart = new Chart(
        document.getElementById(m.chartId),
        {
          type: "line",
          data: {
            labels: [],
            datasets: [
              { label: "Temperature (°F)", data: [], tension: 0.3 },
              { label: "Humidity (%)", data: [], tension: 0.3 }
            ]
          },
          options: { responsive: true }
        }
      );
    }

    const chart = m.chart;
    chart.data.labels = [];
    chart.data.datasets[0].data = [];
    chart.data.datasets[1].data = [];

    json.feeds.forEach(f => {
      if (!f.field1 || !f.field2) return;
      chart.data.labels.push(
        new Date(f.created_at).toLocaleTimeString()
      );
      chart.data.datasets[0].data.push(+f.field1);
      chart.data.datasets[1].data.push(+f.field2);
    });

    chart.update();

    // Status
    const last = json.feeds.at(-1);
    if (last) {
      document.getElementById(m.statusId).innerText =
        last.field1 > 90 ? "⚠️ WARNING" : "✅ Normal";
      document.getElementById(m.updateId).innerText =
        new Date(last.created_at).toLocaleString();
    }
  }

  calculateFireRiskGlobal();
}

}

function calculateFireRiskGlobal() {
  let highestRate = 0;

  MONITORS.forEach(m => {
    if (m.history.length < 2) return;

    const a = m.history.at(-2);
    const b = m.history.at(-1);

    const dt = (new Date(b.created_at) - new Date(a.created_at)) / 60000;
    const rate = (b.field1 - a.field1) / dt;

    highestRate = Math.max(highestRate, rate);
  });

  const el = document.getElementById("fireRisk");

  if (highestRate > 2) {
    el.innerText = "HIGH 🔥";
    el.className = "high";
  } else if (highestRate > 0.5) {
    el.innerText = "MEDIUM ⚠️";
    el.className = "medium";
  } else {
    el.innerText = "LOW ✅";
    el.className = "low";
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
