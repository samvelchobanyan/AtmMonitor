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

      // if (
      //   $(chart.canvas)
      //     .parents('.chart-container')
      //     .children('.custom-legend')
      //     .hasClass('custom-legend_checkmark')
      // ) {
      const customLegendEl = $(chart.canvas).parents(".chart-container").children(".custom-legend");

      if (customLegendEl.hasClass("custom-legend_checkmark")) {
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
            chart.setDatasetVisibility(
              item.datasetIndex,
              !chart.isDatasetVisible(item.datasetIndex)
            );
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

        if (customLegendEl.hasClass("custom-legend_percent")) {
          textContainer.textContent = `${item.text} (${percent}%)`;
        } else if (customLegendEl.hasClass("custom-legend_data")) {
          textContainer.innerHTML = `${item.text} <div>${percent}% / ${value}</div>`;
        } else {
          // Default: label text only
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
  id: "loadingPlugin",
  beforeDraw(chart) {
    const overlay = document.getElementById(`loading-overlay-${chart.canvas.id}`);

    if (chart.options.showLoading) {
      if (!overlay) {
        this.createLoadingOverlay(chart);
      } else {
        overlay.style.display = "flex";
      }
    } else {
      if (overlay) {
        overlay.style.display = "none";
      }
    }
  },

  createLoadingOverlay(chart) {
    const canvas = chart.canvas;
    const container = canvas.parentElement;

    // Make sure container is positioned relative
    if (getComputedStyle(container).position === "static") {
      container.style.position = "relative";
    }

    // Create overlay element
    const overlay = document.createElement("div");
    overlay.id = `loading-overlay-${canvas.id}`;
    overlay.classList.add("loading-overlay");

    const spinner = document.createElement("div");
    spinner.classList.add("spinner");

    overlay.appendChild(spinner);
    container.appendChild(overlay);
  },
};

const doughnutLabelLinesPlugin = {
  id: "labelLines",
  afterDatasetsDraw(chart) {
    const datasetMeta = chart.getDatasetMeta(0);
    if (!datasetMeta || !datasetMeta.data || !datasetMeta.data.length) return;

    const ctx = chart.ctx;
    const dataset = chart.data.datasets[0];

    datasetMeta.data.forEach((arc, index) => {
      if (!arc || !arc.x || !arc.y) return;

      const angle = (arc.startAngle + arc.endAngle) / 2;
      const radius = arc.outerRadius;
      const centerX = arc.x;
      const centerY = arc.y;

      const lineStartX = centerX + Math.cos(angle) * radius;
      const lineStartY = centerY + Math.sin(angle) * radius;

      const lineMidX = centerX + Math.cos(angle) * (radius + 15);
      const lineMidY = centerY + Math.sin(angle) * (radius + 15);

      const isLeftSide = Math.cos(angle) < 0;
      const lineEndX = lineMidX + (isLeftSide ? -20 : 20);
      const lineEndY = lineMidY;

      ctx.save();
      ctx.strokeStyle = dataset.backgroundColor?.[index] || "blue";
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(lineStartX, lineStartY);
      ctx.lineTo(lineMidX, lineMidY);
      ctx.lineTo(lineEndX, lineEndY);
      ctx.stroke();

      ctx.fillStyle = "#848484";
      ctx.font = "12px sans-serif";
      ctx.textAlign = isLeftSide ? "right" : "left";
      ctx.textBaseline = "middle";

      const label = dataset.data[index];
      ctx.fillText(label, lineEndX + (isLeftSide ? -5 : 5), lineEndY);

      ctx.restore();
    });
  },
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

/* ====== LineChart ====== */

export function prepareLineChartData(chartData) {
  return chartData.datasets.map((dataset, index) => ({
    ...baseDatasetOptions,
    ...dataset,
    borderColor: chartColors[index % chartColors.length],
  }));
}

export function createLineChart(ctxId, chartData, containerID) {
  console.log('create line chart');
  const ctx = document.getElementById(ctxId).getContext("2d");

  const datasetsWithColors = chartData ? prepareLineChartData(chartData) : null;

  return new Chart(ctx, {
    type: "line",
    data: chartData
      ? {
          labels: chartData.labels,
          datasets: datasetsWithColors,
        }
      : {},
    options: {
      showLoading: !chartData,
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
    plugins: [htmlLegendPlugin, loadingPlugin],
  });
}

export function updateLineChart(chart, chartData) {
  console.log('update line chart');
  chart.options.showLoading = false;
  chart.data.labels = chartData.labels;
  chart.data.datasets = prepareLineChartData(chartData);
  chart.update();
}

/* ====== DoughnutChart ====== */

export function createDoughnutChart(ctxId, chartData, containerID) {
  const canvas = document.getElementById(ctxId);
  const ctx = canvas.getContext("2d");

  const filledDataset = chartData ? prepareDoughnutChart(chartData) : null;
  const hasCustomCutout = canvas.classList.contains("custom-cutout");

  return new Chart(ctx, {
    type: "doughnut",
    data: chartData
      ? {
          labels: chartData.labels,
          datasets: [filledDataset],
        }
      : null,
    options: {
      cutout: hasCustomCutout ? "60%" : "50%",
      showLoading: true,
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        tooltip: { enabled: false },
        legend: { display: false },
        htmlLegend: { containerID },
      },
    },
    plugins: [htmlLegendPlugin, loadingPlugin, doughnutLabelLinesPlugin],
  });
}

export function prepareDoughnutChart(chartData) {
  const doughnutDataset = chartData.datasets[0];
  return {
    ...doughnutDataset,
    backgroundColor: chartColors.slice(0, doughnutDataset.data.length),
    hoverBackgroundColor: chartColors.slice(0, doughnutDataset.data.length),
  };
}

export function updateDoughnutChart(chart, chartData) {
  chart.options.showLoading = false;
  chart.data.labels = chartData.labels;
  chart.data.datasets = [prepareDoughnutChart(chartData)];
  chart.update();
}

/* ====== BarChart ====== */

export function createBarChart(ctxId, chartData, containerID) {
  const ctx = document.getElementById(ctxId).getContext("2d");
  const datasetsWithColors = chartData ? prepareBarChart(chartData) : null;

  return new Chart(ctx, {
    type: "bar",
    data: chartData
      ? {
          labels: chartData.labels,
          datasets: datasetsWithColors,
        }
      : {},
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
          beginAtZero: true,
          ticks: { maxTicksLimit: 6, autoSkip: true },
          grid: { display: true, color: "#D9D9DD" },
          border: { dash: [2, 4] },
        },
        x: {
          grid: { display: true, color: "#D9D9DD" },
          border: { dash: [2, 4] },
          ticks: { display: false },
        },
      },
    },
    plugins: [htmlLegendPlugin, loadingPlugin],
  });
}

export function prepareBarChart(chartData) {
  return chartData.datasets.map((dataset, index) => ({
    ...dataset,
    backgroundColor: chartColors[index % chartColors.length],
    borderColor: chartColors[index % chartColors.length],
    borderWidth: 1,
  }));
}

export function updateBarChart(chart, chartData) {
  chart.options.showLoading = false;
  chart.data.labels = chartData.labels;
  chart.data.datasets = prepareBarChart(chartData);
  chart.update();
}
