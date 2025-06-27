export class LineChart extends HTMLElement {
    static get observedAttributes() {
        return ["chart-id", "legend-id"];
    }

    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        const chartId = this.getAttribute("chart-id") || "line-chart";
        const legendId = this.getAttribute("legend-id") || "legend-container";

        this.className = "chart-container";

        this.innerHTML = `
            <div class="chart chart_252">
                <canvas id="${chartId}"></canvas>
            </div>
            <div class="custom-legend custom-legend_checkmark" id="${legendId}"></div>
        `;
    }
}

customElements.define("line-chart", LineChart);
