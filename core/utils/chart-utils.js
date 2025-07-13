const htmlLegendPlugin = {
  id: "htmlLegend",
  afterUpdate(chart, args, options) {
    // const dataset = chart.data.datasets[item.datasetIndex];
    const ul = getOrCreateLegendList(chart, options.containerID);

    while (ul.firstChild) {
      ul.firstChild.remove();
    }

    const items = chart.options.plugins.legend.labels.generateLabels(chart);
    items.forEach((item, index) => {
      const li = document.createElement("li");
      const circle = document.createElement("span");


      if ($(chart.canvas).parents(".chart-container").children(".custom-legend").hasClass("custom-legend_checkmark")) {
        circle.style.backgroundColor = item.strokeStyle;
        const label = document.createElement("label");
        label.className = "custom-check";
        label.setAttribute("for", `${chart.canvas.id}-${index}`);

        const input = document.createElement("input");
        input.type = "checkbox";
        input.id = `${chart.canvas.id}-${index}`;
        input.value = item.text;
        input.checked = !item.hidden;

        input.addEventListener("change", () => {
          const { type } = chart.config;
          if (type === "pie" || type === "doughnut") {
            chart.toggleDataVisibility(item.index);
          } else {
            chart.setDatasetVisibility(item.datasetIndex, !chart.isDatasetVisible(item.datasetIndex));
          }
          chart.update();
        });

        const checkmark = document.createElement("div");
        checkmark.className = "custom-check__checkmark";

        const labelText = document.createElement("div");
        labelText.className = "custom-check__label";
        labelText.textContent = item.text;

        label.appendChild(input);
        label.appendChild(checkmark);
        label.appendChild(labelText);
        label.appendChild(circle);

        li.appendChild(label);
      } else {
        const dataset = chart.data.datasets[0];
        const value = dataset.data[index];
        const total = dataset.data.reduce((acc, val) => acc + val, 0);
        const percent = ((value / total) * 100).toFixed(1);

        circle.style.backgroundColor = item.fillStyle;

        const textContainer = document.createElement("div");
        textContainer.className = "textcontainer";

        if ($(chart.canvas).parents(".chart-container").children(".custom-legend").hasClass("custom-legend_percent")) {
          textContainer.textContent = `${item.text} (${percent}%)`;
        } else {
          textContainer.textContent = `${item.text}`;
        }

        li.appendChild(circle);
        li.appendChild(textContainer);
      }

      ul.appendChild(li);
    });
  },
};
const loadingPlugin = {
  id: 'loadingPlugin',
  beforeDraw(chart) {
    if (!chart.options.showLoading) return;

    const {ctx, width, height} = chart;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#444';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '16px sans-serif';
    ctx.fillText('Loading…', width / 2, height / 2);

    ctx.restore();
  }
};

const getOrCreateLegendList = (chart, id) => {
  const legendContainer = document.getElementById(id);
  let listContainer = legendContainer.querySelector("ul");

  if (!listContainer) {
    listContainer = document.createElement("ul");
    legendContainer.appendChild(listContainer);
  }

  return listContainer;
};

const baseDatasetOptions = {
  backgroundColor: "transparent",
  borderWidth: 2,
  fill: true,
  tension: 0.4,
  pointBackgroundColor: "white",
  pointRadius: 4,
};

const chartColors = ["#9BECB0", "#9BB3EE", "#BE9BEE", "#FCE2A8", "#EC9B9C", "#77E6FF"];

export function prepareData(chartData){
  return chartData.datasets.map((dataset, index) => ({
    ...baseDatasetOptions,
    ...dataset,
    borderColor: chartColors[index % chartColors.length],
  }));
}

export function createLineChart(ctxId, chartData, containerID) {
  console.log('creating chart',ctxId);
  const ctx = document.getElementById(ctxId).getContext("2d");

  const datasetsWithColors = chartData ? prepareData(chartData) : null;

  return new Chart(ctx, {
    type: "line",
    data: chartData ? {
      labels: chartData.labels,
      datasets: datasetsWithColors,
    } : {},
    options: {
      showLoading: true,
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        tooltip: { enabled: false },
        legend: { display: false },
        htmlLegend: { containerID },
      },
      scales: {
        y: {
          ticks: { maxTicksLimit: 6, autoSkip: true },
          beginAtZero: true,
          grid: { display: true, drawBorder: true, color: "#D9D9DD" },
          border: { dash: [2, 4] },
        },
        x: {
          grid: { display: true, drawBorder: true, color: "#D9D9DD" },
          border: { dash: [2, 4] },
          ticks: { display: false },
        },
      },
    },
    plugins: [htmlLegendPlugin,loadingPlugin],
  });
}

export function createDoughnutChart(ctxId, chartData, containerID) {
  const ctx = document.getElementById(ctxId).getContext("2d");

  const doughnutDataset = chartData.datasets[0];
  const filledDataset = {
    ...doughnutDataset,
    backgroundColor: chartColors.slice(0, doughnutDataset.data.length),
    hoverBackgroundColor: chartColors.slice(0, doughnutDataset.data.length),
  };

  return new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: chartData.labels,
      datasets: [filledDataset],
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        tooltip: { enabled: false },
        legend: { display: false },
        htmlLegend: { containerID },
      },
    },
    plugins: [htmlLegendPlugin],
  });
}

export function updateChart(chart, data) {
  console.log('updateing chart');
  chart.options.showLoading = false;
  chart.data.labels = data.labels;
  chart.data.datasets = prepareData(data);
  chart.update();
}