import { DynamicElement } from "../core/dynamic-element.js";
import "../components/dynamic/chartComponent.js";
import "../components/dynamic/infoCard.js";
import "../components/ui/customTab.js";
import "../components/ui/customRadio.js";
import "../components/dynamic/doughnutChart.js";
import "../components/dynamic/tabsDoughnutChart.js";

class inOut extends DynamicElement {
    constructor() {
        super();

        this.state = {
            selectedRegion: null,
            selectedCity: null,
            summary: null,
            atmId: null,
        };
    }

    onConnected() {
        this.fetchSummary();
    }

    async fetchSummary(region, city, atmId) {
        const queryString = new URLSearchParams();
        if (region) {
            queryString.append("district", region);
        }
        if (city) {
            queryString.append("city", city);
        }
        if (atmId) {
            queryString.append("atmId", atmId);
        }

        try {
            const response = await this.fetchData(`/analytics/summary?${queryString}`);
            this.setState({
                selectedRegion: region,
                selectedCity: city,
                summary: response.data,
                atmId: atmId,
            });
        } catch (err) {
            console.error("❌ Error fetching summary:", err);
            this.setState({ summary: null });
        }
    }
    onStoreChange(storeState) {
        const region = storeState.selectedRegion;
        const city = storeState.selectedCity;
        if (region !== this.state.selectedRegion || city !== this.state.selectedCity) {
            this.fetchSummary(region, city); // one API call → one render
        }
    }

    onConnected() {
        this.fetchSummary();

        this.addEventListener("change", (e) => {
            if (e.target.matches('custom-radio[name="cash-in"]')) {
                const selected = e.target.getAttribute("value");
                this.updateDepositCharts(selected);
            } else if (e.target.matches('custom-radio[name="cash-out"]')) {
                console.log("click");

                const selected = e.target.getAttribute("value");
                this.updateDispenseCharts(selected);
            }
        });
    }

    updateDepositCharts(type) {
        const chartAmount = this.querySelector("#deposit-amount");
        const chartCount = this.querySelector("#deposit-count");

        if (chartAmount && chartCount) {
            chartAmount.setAttribute("activetab", type);
            chartCount.setAttribute("activetab", type);
        }
    }

    updateDispenseCharts(type) {
        const chartAmount = this.querySelector("#dispence-amount");
        const chartCount = this.querySelector("#dispence-count");

        if (chartAmount && chartCount) {
            console.log("new type", type);

            chartAmount.setAttribute("activetab", type);
            chartCount.setAttribute("activetab", type);
        }
    }

    template() {
        if (!this.state.summary) {
            return /*html*/ `
            <div class="row">
                <div class="column sm-12">
                    <div class="loading">
                        <div class="loading__spinner spinner"></div>
                        <div class="loading__text">Տվյալները բեռնվում են…</div>
                    </div>
                </div>
            </div>
            `;
        }

        // Կանխիկացում
        const dispenseSummary = this.state.summary.dispense_summary;
        const safeDispenseData = JSON.stringify(dispenseSummary).replace(/"/g, "&quot;");

        const dispenseTabs = {
            with_without_card: "Քարտով / Անքարտ",
            by_method: "Ըստ վճարային համակարգի",
            own_other_card: "Սեփական քարտ / Այլ քարտ",
        };
        const safeDispenseTabsData = JSON.stringify(dispenseTabs).replace(/"/g, "&quot;");

        // Մուտքագրում
        const depositSummary = this.state.summary.deposit_summary;
        const safeDepositData = JSON.stringify(depositSummary).replace(/"/g, "&quot;");

        const depositTabs = {
            deposit_with_without_card: "Քարտով / Անքարտ",
            deposit_by_method: "Ըստ տեսակի",
        };
        const safeDepositTabsData = JSON.stringify(depositTabs).replace(/"/g, "&quot;");

        return /*html*/ `
            <div class="row">
                <div class="column sm-6">
                    <div class="container">
                        <container-top icon="icon-arrow-down-left" title="Կանխիկացում"> </container-top>
                        <tabs-doughnut-chart id="dispense" summary="${safeDispenseData}" tabsinfo="${safeDispenseTabsData}"></tabs-doughnut-chart>
                        </div>      
                </div>
                <div class="column sm-6">
                    <div class="container">
                        <container-top icon="icon-arrow-up-right" title="Մուտքագրում"> </container-top>
                        <tabs-doughnut-chart id="deposit" summary="${safeDepositData}" tabsinfo="${safeDepositTabsData}"></tabs-doughnut-chart>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define("in-out", inOut);




