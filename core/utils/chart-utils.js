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

            const customLegendEl = $(chart.canvas)
                .parents(".chart-container")
                .children(".custom-legend");

            if (customLegendEl.hasClass("custom-legend_checkmark")) {
                const checkbox = document.createElement("custom-checkbox");

                checkbox.setAttribute("id", `${chart.canvas.id}-${index}`);
                checkbox.setAttribute("value", item.text);
                checkbox.setAttribute("color", item.strokeStyle);

                checkbox.textContent = item.text;

                if (!item.hidden) {
                    checkbox.setAttribute("checked", "");
                }

                checkbox.addEventListener("change", () => {
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

                li.appendChild(checkbox);
            } else {
                const dataset = chart.data.datasets[0];
                const value = dataset.data[index];
                const total = dataset.data.reduce((acc, val) => acc + val, 0);
                const percent = ((value / total) * 100).toFixed(1);

                circle.style.backgroundColor = item.fillStyle;

                const textContainer = document.createElement("div");

                if (customLegendEl.hasClass("custom-legend_percent")) {
                    textContainer.textContent = `${item.text} (${percent}%)`;
                }
                // else if (customLegendEl.hasClass("custom-legend_data")) {
                //     textContainer.innerHTML = `${
                //         item.text
                //     } <div>${percent}% / ${value.toLocaleString()}</div>`;
                // }
                if (customLegendEl.hasClass("custom-legend_data")) {
                    if (isNaN(percent)) {
                        textContainer.innerHTML = ` ${item.text} <div>0</div>`;
                    } else {
                        textContainer.innerHTML = ` ${
                            item.text
                        }  <div>${percent}% / ${value.toLocaleString()}</div>`;
                    }
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
const barChartColors = ["#9BECB0", "#9BB3EE", "#EAEAEA"];

/* ====== LineChart ====== */

export function prepareLineChartData(chartData) {
    return chartData.datasets.map((dataset, index) => ({
        ...baseDatasetOptions,
        ...dataset,
        borderColor: chartColors[index % chartColors.length],
    }));
}

export function createLineChart(ctxId, chartData, containerID) {
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
                    ticks: { display: true },
                },
            },
        },
        plugins: [htmlLegendPlugin, loadingPlugin],
    });
}

export function updateLineChart(chart, chartData) {
    chart.options.showLoading = false;
    chart.data.labels = chartData.labels;
    chart.data.datasets = prepareLineChartData(chartData);
    chart.update();
}

/* ====== DoughnutChart ====== */

export function createDoughnutChart(ctxId, chartData, containerID, useLabelLines = true) {
    const canvas = document.getElementById(ctxId);
    const ctx = canvas.getContext("2d");

    const filledDataset = chartData ? prepareDoughnutChart(chartData) : null;
    const hasCustomCutout = canvas.classList.contains("custom-cutout");

    const plugins = [htmlLegendPlugin, loadingPlugin];

    // filledDataset.data = filledDataset.data.map((v) => (isNaN(v) || v == null ? 0 : v));

    if (useLabelLines) {
        plugins.push(doughnutLabelLinesPlugin);
    }

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
            showLoading: !chartData,
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
                tooltip: { enabled: !useLabelLines },
                legend: { display: false },
                htmlLegend: { containerID },
            },
        },
        plugins: plugins,
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

export function createBarChart(
    ctxId,
    chartData,
    containerID,
    grouped = false,
    chartId = null,
    onBarClick
) {
    const ctx = document.getElementById(ctxId).getContext("2d");
    const datasetsWithColors = chartData ? prepareBarChart(chartData, grouped, chartId) : null;

    return new Chart(ctx, {
        type: "bar",
        data: chartData
            ? {
                  labels: chartData.labels,
                  datasets: datasetsWithColors,
                  extraMeta: chartData.extraMeta, //stores cassette_type_id
              }
            : {},
        options: {
            showLoading: !chartData,
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
                legend: { display: false },
                htmlLegend: { containerID },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { maxTicksLimit: 6, autoSkip: true },
                    grid: { display: true, color: "#D9D9DD" },
                    border: { dash: [2, 4] },
                    stacked: false,
                },
                x: {
                    grid: { display: true, color: "#D9D9DD" },
                    border: { dash: [2, 4] },
                    ticks: { display: true },
                    stacked: false,
                },
            },
            onClick(event, elements, chart) {
                if (!elements.length) return;
                const element = elements[0];
                const dataIndex = element.index;
                const columnLabel = chart.data.labels[dataIndex];
                const extraMeta = chart.data.extraMeta ? chart.data.extraMeta[dataIndex] : null;
                if (typeof onBarClick === "function") {
                    onBarClick({
                        columnLabel,
                        cassette_id: extraMeta.cassette_type_id,
                    });
                }
            },
        },
        plugins: [htmlLegendPlugin, loadingPlugin],
    });
}

export function prepareBarChart(chartData, isGrouped = false, chartId = null) {
    let colorByLabel = null;
    if (chartId !== null) {
        switch (chartId) {
            case "bar-chart-2":
                colorByLabel = {
                    "Առկա գումար": "#9BECB0", // red
                    capacity: "#EAEAEA", // blue
                    "Վերջին ինկասացիա": "#9BB3EE", // green
                };
                break;
            case "bar-chart-1":
                colorByLabel = {
                    "Առկա գումար": "#9BECB0", // red
                    capacity: "#EAEAEA", // blue
                    "Վերջին ինկասացիա": "#9BB3EE", // green
                };
                break;
            case "worktime-bar-chart":
                colorByLabel = {
                    Աշխատաժամանակ: "#9BECB0",
                    Պարապուրդ: "#EC9B9C",
                };
                break;
                break;
        }
    }

    return chartData.datasets.map((dataset, index) => {
        const color =
            chartId !== null
                ? colorByLabel[dataset.label]
                : barChartColors[index % barChartColors.length];
        return {
            ...dataset,
            backgroundColor: color,
            borderColor: color,
            borderWidth: 1,
            grouped: isGrouped,
            order: index + 1,
        };
    });
}

export function updateBarChart(chart, chartData, grouped = false) {
    chart.options.showLoading = false;
    chart.data.labels = chartData.labels;
    chart.data.datasets = prepareBarChart(chartData, grouped);
    chart.update();
}
