const monitors = [
    {
        name: "Monitor 1",
        url: "https://api.thingspeak.com/channels/3213564/feeds/last.json?api_key=KTAK4J245ZYW9ON1",
        chartId: "chart1",
        statusId: "status1",
        timeId: "time1",
        chart: null
    },
    {
        name: "Monitor 2",
        url: "https://api.thingspeak.com/channels/3213607/feeds/last.json?api_key=96JPYOD19L5RZBVO",
        chartId: "chart2",
        statusId: "status2",
        timeId: "time2",
        chart: null
    }
];

function createChart(ctx, label) {
    return new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [
                {
                    label: "Temperature (°F)",
                    data: [],
                    borderWidth: 2,
                    tension: 0.3
                },
                {
                    label: "Humidity (%)",
                    data: [],
                    borderWidth: 2,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: false }
            }
        }
    });
}

async function updateMonitor(monitor) {
    try {
        const res = await fetch(monitor.url);
        const data = await res.json();

        console.log(monitor.name, data);

        if (!data.field1 || !data.field2) return;

        const temp = parseFloat(data.field1);
        const humidity = parseFloat(data.field2);
        const warning = data.field3 === "1";
        const time = new Date(data.created_at).toLocaleTimeString();

        if (!monitor.chart) {
            const ctx = document.getElementById(monitor.chartId);
            monitor.chart = createChart(ctx, monitor.name);
        }

        const chart = monitor.chart;

        if (chart.data.labels.length > 20) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
            chart.data.datasets[1].data.shift();
        }

        chart.data.labels.push(time);
        chart.data.datasets[0].data.push(temp);
        chart.data.datasets[1].data.push(humidity);
        chart.update();

        const statusEl = document.getElementById(monitor.statusId);
        statusEl.innerText = warning ? "⚠️ HIGH TEMP" : "✅ Normal";
        statusEl.className = warning ? "warning" : "safe";

        document.getElementById(monitor.timeId).innerText =
            new Date(data.created_at).toLocaleString();

    } catch (err) {
        console.error("Error updating", monitor.name, err);
    }
}

function refreshAll() {
    monitors.forEach(updateMonitor);
}

// Initial load + every 15 seconds
refreshAll();
setInterval(refreshAll, 15000);
