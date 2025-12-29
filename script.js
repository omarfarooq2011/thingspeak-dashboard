const MONITORS = [
  {
    name: "Monitor 1",
    channelId: "3213564",
    readKey: "KTAK4J245ZYW9ON1",
    chartId: "chart1",
    statusId: "status1",
    timeId: "time1",
    chart: null,
    history: []
  },
  {
    name: "Monitor 2",
    channelId: "3213607",
    readKey: "96JPYOD19L5RZBVO",
   i,
    chartId: "chart2",
    statusId: "status2",
    timeId: "time2",
    chart: null,
    history: []
  }
];

function createChart(id) {
  return new Chart(document.getElementById(id), {
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
  let highestRate = 0;

  for (const m of MONITORS) {
    const results = Math.min(hours * 4, 8000);
    const url = `https://api.thingspeak.com/channels/${m.channelId}/feeds.json?api_key=${m.readKey}&results=${results}`;

    const res = await fetch(url);
    const json = await res.json();
    if (!json.feeds || json.feeds.length === 0) continue;

    m.history = json.feeds;

    if (!m.chart) m.chart = createChart(m.chartId);

    const labels = [];
    const temps = [];
    const hums = [];

    json.feeds.forEach(f => {
      if (!f.field1 || !f.field2) return;
      labels.push(new Date(f.created_at).toLocaleTimeString());
      temps.push(+f.field1);
      hums.push(+f.field2);
    });

    m.chart.data.labels = labels;
    m.chart.data.datasets[0].data = temps;
    m.chart.data.datasets[1].data = hums;
    m.chart.update();

    const last = json.feeds.at(-1);
    document.getElementById(m.statusId).innerText =
      last.field1 >= 90 ? "⚠️ WARNING" : "✅ Normal";

    document.getElementById(m.timeId).innerText =
      new Date(last.created_at).toLocaleString();

    if (json.feeds.length >= 2) {
      const a = json.feeds.at(-2);
      const b = json.feeds.at(-1);
      const rate =
        (b.field1 - a.field1) /
        ((new Date(b.created_at) - new Date(a.created_at)) / 60000);
      highestRate = Math.max(highestRate, rate);
    }
  }

  const risk = document.getElementById("fireRisk");
  if (highestRate > 2) risk.innerText = "HIGH 🔥";
  else if (highestRate > 0.5) risk.innerText = "MEDIUM ⚠️";
  else risk.innerText = "LOW ✅";
}

function exportData(type) {
  let all = [];
  MONITORS.forEach(m =>
    m.history.forEach(f => all.push({ monitor: m.name, ...f }))
  );

  if (!all.length) return;

  let blob;
  if (type === "json") {
    blob = new Blob([JSON.stringify(all, null, 2)], { type: "application/json" });
  } else {
    const header = Object.keys(all[0]).join(",");
    const rows = all.map(o => Object.values(o).join(","));
    blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
  }

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `thingspeak_data.${type}`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* Initial load */
loadHistory(24);

/* Auto refresh */
setInterval(() => loadHistory(24), 300000);
