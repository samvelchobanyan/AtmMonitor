import { DynamicElement } from "../../core/dynamic-element.js";
import { memoryStore } from "../../core/memory-store.js";
import "./doughnutChart.js";
import "../ui/customRadio.js";
import "./select-box-date.js";
import encode from "../../assets/js/utils/encode.js";

const observedAttrs = ["data", "api-url", "start-date", "end-date", "show-date"];
const nonRenderAttrs = new Set(["start-date", "end-date"]);

const TAB_LABELS = {
    card: "\u0554\u0561\u0580\u057f\u0578\u057e / \u0531\u0576\u0584\u0561\u0580\u057f",
    cardownership:
        "\u054d\u0565\u0583\u0561\u056f\u0561\u0576 / \u0531\u0575\u056c \u056f\u0561\u0580\u057f",
    payment_system:
        "\u054e\u0580\u0561\u0580\u0561\u0575\u056b\u0576 \u0570\u0561\u0574\u0561\u056f\u0561\u0580\u0563",
};

export default class DoughnutTabs extends DynamicElement {
    constructor() {
        super();
        this.state = {
            selectedTab: null,
        };

        this.rawData = null;
        this.transformedTabData = {};

        this.chartMemoryKey = `chart-${this.getAttribute("id")}`;
        this.tabsMemoryKey = `tabs-${this.getAttribute("id")}`;

        this.selectBox = null;
    }

    static get observedAttributes() {
        return observedAttrs;
    }

    static get nonRenderingAttributes() {
        return nonRenderAttrs;
    }

    onConnected() {
        const savedDates = memoryStore.get(this.chartMemoryKey);
        if (savedDates) {
            if (savedDates.startDate) this.setAttribute("start-date", savedDates.startDate);
            if (savedDates.endDate) this.setAttribute("end-date", savedDates.endDate);
        }

        const savedTab = memoryStore.get(this.tabsMemoryKey);
        if (savedTab) {
            this.state.selectedTab = savedTab;
        }

        const dataAttr = this.getAttr("data");
        if (dataAttr) {
            this._parseDataAttr(dataAttr);
        }

        this.transformData();
    }

    onAttributeChange(name, oldValue, newValue) {
        if (name === "data" && oldValue !== newValue) {
            this._parseDataAttr(newValue);
            this.transformData();
        }
    }

    onAfterRender() {
        this.selectBox = this.$("select-box-date");
    }

    addEventListeners() {
        if (this.selectBox) {
            this.addListener(this.selectBox, "date-range-change", this.onDateRangeChange);
        }
        this.$$("custom-radio").forEach((radio) => {
            this.addListener(radio, "change", this.onTabChange);
        });
    }

    onDateRangeChange(e) {
        const { startDate, endDate, period } = e.detail || {};
        if (!startDate || !endDate) return;
        memoryStore.set(this.chartMemoryKey, { startDate, endDate, period });
        this.setAttribute("start-date", startDate);
        this.setAttribute("end-date", endDate);
        this.fetchAndSetData();
    }

    onTabChange(e) {
        const val = e.target.getAttribute("value");
        if (!val || !this.transformedTabData[val]) return;
        memoryStore.set(this.tabsMemoryKey, val);
        this.setState({ selectedTab: val });
    }

    _parseDataAttr(raw) {
        try {
            this.rawData = JSON.parse(raw);
        } catch (err) {
            console.warn("[doughnut-tabs] Invalid data attribute", err);
            this.rawData = null;
        }
    }

    async fetchAndSetData() {
        const endpoint = this.getAttribute("api-url");
        if (!endpoint) return;

        const params = new URLSearchParams();
        const s = this.getAttr("start-date");
        const e = this.getAttr("end-date");
        if (s) params.append("startDate", s);
        if (e) params.append("endDate", e);
        const url = `${endpoint}?${params.toString()}`;

        try {
            const response = await this.fetchData(url);
            const data = response && response.data ? response.data : response;
            this.rawData = data;
            this.transformData();
        } catch (err) {
            console.warn("[doughnut-tabs] Fetch error", err);
            this.rawData = null;
            this.transformedTabData = {};
            this.setState({ selectedTab: this.state.selectedTab });
        }
    }

    transformData() {
        if (!this.rawData || !this.rawData.breakdowns) {
            this.transformedTabData = {};
            this.setState({ selectedTab: this.state.selectedTab });
            return;
        }

        const {
            dispense_amount,
            daily_median,
            transaction_median,
            dispense_count,
            median_count,
            dispense_count_percent_change,
            breakdowns,
        } = this.rawData;

        const result = {};
        Object.entries(breakdowns).forEach(([key, items]) => {
            const labels = items.map((i) => i.label);
            const amounts = items.map((i) => i.amount ?? 0);
            const counts = items.map((i) => i.count ?? 0);

            result[key] = {
                amount: {
                    total: dispense_amount,
                    dailyAvg: daily_median,
                    transactionAvg: transaction_median,
                    chartData: {
                        labels,
                        datasets: [{ data: amounts }],
                    },
                },
                count: {
                    total: dispense_count,
                    dailyAvg: median_count,
                    changeValue: dispense_count_percent_change,
                    chartData: {
                        labels,
                        datasets: [{ data: counts }],
                    },
                },
            };
        });

        this.transformedTabData = result;

        const keys = Object.keys(result);
        let nextTab = this.state.selectedTab;
        if (!keys.length) {
            nextTab = null;
        } else if (!nextTab || !result[nextTab]) {
            nextTab = keys[0];
        }

        this.setState({ selectedTab: nextTab });
    }

    _renderRadios() {
        const keys = Object.keys(this.transformedTabData);
        if (!keys.length) return "";

        const groupName = `tabs-${this.getAttr("id") ||
            Math.random()
                .toString(36)
                .substr(2, 9)}`;

        return keys
            .map((key) => {
                const label = TAB_LABELS[key] || key;
                const checked = this.state.selectedTab === key ? "checked" : "";
                return `<custom-radio name="${groupName}" value="${key}" ${checked}>${label}</custom-radio>`;
            })
            .join("");
    }

    template() {
        if (!this.rawData || !Object.keys(this.transformedTabData).length) {
            return `<div class="loading">No data available</div>`;
        }

        const charts = this.transformedTabData[this.state.selectedTab];
        const amountData = charts ? encode(charts.amount) : "";
        const countData = charts ? encode(charts.count) : "";
        const showDate = this.getAttribute("show-date") !== "false"; // default true
        return `
      <div class="select-container">
        <container-top icon="icon-arrow-down-left" title="\u053F\u0561\u0576\u056D\u056B\u056F\u0561\u0581\u0578\u0582\u0574"></container-top>
          ${
              showDate
                  ? `
          <select-box-date
            start-date="${this.getAttr("start-date")}"
            end-date="${this.getAttr("end-date")}"
          ></select-box-date>
        `
                  : ""
          }
      </div>
      <div class="radio-buttons">
        ${this._renderRadios()}
      </div>
      <div class="chart-container">
        <doughnut-chart id="${this.getAttr("id")}-amount" data='${amountData}'></doughnut-chart>
        <doughnut-chart id="${this.getAttr("id")}-count" data='${countData}'></doughnut-chart>
      </div>
    `;
    }
}

customElements.define("doughnut-tabs", DoughnutTabs);
