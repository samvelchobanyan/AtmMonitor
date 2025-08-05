import { DynamicElement } from "../core/dynamic-element.js";
import { ContainerTop } from "../components/ui/containerTop.js";
import "../components/dynamic/doughnutTabs.js";

class inOut extends DynamicElement {
    constructor() {
        super();

        this.state = {
            summary: null,
            atmId: null,
        };

        this.currentRegion = null;
        this.currentCity = null;
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
            this.currentRegion = region;
            this.currentCity = city;
            this.setState({
                summary: response,
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
        if (region !== this.currentRegion || city !== this.currentCity) {
            this.fetchSummary(region, city);
        }
    }

    template() {
        const summary = this.state.summary;
        if (!summary) {
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
        console.log("!!!!!!!!!!!!!", summary.data);

        const dispenseData = JSON.stringify(summary.data.dispense_summary).replace(/"/g, "&quot;");
        const depositData = JSON.stringify(summary.data.deposit_summary).replace(/"/g, "&quot;");
        const transactionsData = JSON.stringify(
            summary.data.transaction_dynamics.exchange_dynamic.hourly
        ).replace(/"/g, "&quot;");

        const dispenseDynamicData = JSON.stringify(
            summary.data.transaction_dynamics.dispense_dynamic.hourly
        ).replace(/"/g, "&quot;");

        const depositDynamicData = JSON.stringify(
            summary.data.transaction_dynamics.deposit_dynamic.hourly
        ).replace(/"/g, "&quot;");

        const exchangeData = summary.data.exchange_summary.currency_details;

        return /*html*/ `
        <div class="row">
            <div class="column sm-6">
                <div class="container">
                <doughnut-tabs id="dispense" data="${dispenseData}"></doughnut-tabs>
                </div>
            </div>

            <div class="column sm-6">
                <div class="container">
                <doughnut-tabs id="deposit" data="${depositData}"></doughnut-tabs>
                </div>
            </div>

            <div class="column">
                <container-top icon="icon-coins" title="Արտարժույթի փոխանակում"></container-top>
                <div class="infos">
                    ${exchangeData
                        .map((exchange) => {
                            return `
                        <info-card
                        title="${exchange.currency_code}"
                        value="${exchange.total_amount}"
                        value-currency="$"
                        trend="${exchange.total_amount_percent_change}"
                        icon="icon icon-box"
                        show-border="true">
                        </info-card>`;
                        })
                        .join("")}
                </div>

                <div class="container">
                <container-top icon="icon-chart" title="Գործարքների դինամիկա"></container-top>
                <chart-component
                    id="line-chart-transactions"
                    chart-type="line"
                    chart-data='${transactionsData}'
                    api-url="/analytics/transactions-dynamic-in-days"
                    ${this.attrIf("city", this.state.currentCity)}
                    ${this.attrIf("region", this.state.currentRegion)}>
                </chart-component>
                </div>
            </div>

            <div class="column sm-6">
                <div class="container">
                <container-top icon="icon-trending-up" title="Կանխիկացումների դինամիկա"></container-top>
                <chart-component
                    id="line-chart-dispense-dynamics"
                    chart-type="line"
                    chart-data='${dispenseDynamicData}'
                    api-url="/analytics/dispense-dynamic-in-days"
                    ${this.attrIf("city", this.state.currentCity)}
                    ${this.attrIf("region", this.state.currentRegion)}>
                </chart-component>
                </div>
            </div>

            <div class="column sm-6">
                <div class="container">
                <container-top icon="icon-trending-up" title="Մուտքագրված գումարների դինամիկա"></container-top>
                <chart-component
                    id="line-chart-deposit-dynamics"
                    chart-type="line"
                    chart-data='${depositDynamicData}'
                    api-url="/analytics/deposit-dynamic-in-days"
                    ${this.attrIf("city", this.state.currentCity)}
                    ${this.attrIf("region", this.state.currentRegion)}>
                </chart-component>
                </div>
            </div>
            </div>
            
        `;
    }
}

customElements.define("in-out", inOut);
