import { DynamicElement } from "../core/dynamic-element.js";
import { ContainerTop } from "../components/ui/containerTop.js";
import "../components/dynamic/doughnutTabs.js";
import dataTransformer from '../core/utils/data-transformer.js';

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

    _transformToTransactionDynamics(data) {
        const { dispense_dynamic, deposit_dynamic, exchange_dynamic } = data;

        // Create the transactionDynamics array by mapping over exchange_dynamic.hourly_data
        const transactionDynamics = exchange_dynamic.hourly_data.map(exchangeItem => {
            const hour = exchangeItem.hour;

            // Find corresponding to dispense data for this hour
            const dispenseItem = dispense_dynamic.hourly_data.find(item => item.hour === hour);
            const dispenseAmount = dispenseItem ?
                (dispenseItem.with_card_amount + dispenseItem.without_card_amount) : 0;

            // Find the corresponding deposit data for this hour
            const depositItem = deposit_dynamic.hourly_data.find(item => item.hour === hour);
            const depositAmount = depositItem ?
                (depositItem.with_card_amount + depositItem.without_card_amount) : 0;

            return {
                hour: hour,
                dispense_amount: dispenseAmount,
                deposit_amount: depositAmount,
                exchange_amount: exchangeItem.amount
            };
        });

        return transactionDynamics;
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
        // console.log("!!!!!!!!!!!!!", summary.data);

        const dispenseData = JSON.stringify(summary.data.dispense_summary).replace(/"/g, "&quot;");
        const depositData = JSON.stringify(summary.data.deposit_summary).replace(/"/g, "&quot;");
        const exchangeData = summary.data.exchange_summary.currency_details;

        const depositDynamicData = JSON.stringify(
            summary.data.transaction_dynamics.deposit_dynamic.hourly_data
        ).replace(/"/g, "&quot;");

        const dispenseDynamicData = JSON.stringify(summary.data.transaction_dynamics.dispense_dynamic.hourly_data);
        const transactionDynamicsData = JSON.stringify(this._transformToTransactionDynamics(summary.data.transaction_dynamics));


        return /*html*/ `
            <div class="row">
                <div class="column sm-6">
                    <div class="container">
                        <doughnut-tabs id="dispense" api-url="/analytics/dispense-summary-in-days" data="${dispenseData}"></doughnut-tabs>
                    </div>
                </div>
                <div class="column sm-6">
                    <div class="container">
                        <doughnut-tabs id="deposit" api-url="/analytics/deposit-summary-in-days" data="${depositData}"></doughnut-tabs>
                    </div>
                </div>
                <div class="column sm-12">
                    <div class="container">
                        <container-top icon="icon-coins" title="Արտարժույթի փոխանակում"></container-top>
                        <div class="infos">
                            ${exchangeData.map((exchange) => {
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
                    </div>
                </div>
                <div class="column sm-12">
                    <div class="container">
                        <container-top icon="icon-chart" title="Գործարքների դինամիկա"></container-top>
                        <chart-component 
                            id="line-chart-transactions" 
                            chart-type="line" 
                            chart-data='${transactionDynamicsData}' 
                            api-url="/analytics/exchange-dynamic-in-days" 
                            ${this.attrIf("city", this.state.currentCity)} 
                            ${this.attrIf("region", this.state.currentRegion)}> </chart-component>
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
                            ${this.attrIf("region", this.state.currentRegion)}> </chart-component>
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
                            ${this.attrIf("region", this.state.currentRegion)}> </chart-component>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define("in-out", inOut);
