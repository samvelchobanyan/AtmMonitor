import { DynamicElement } from "../core/dynamic-element.js";
import locationTransformer from "../core/utils/location-transformer.js";
import { store } from "../core/store/store.js";
import "../components/dynamic/doughnutTabs.js";
import "../components/ui/customTab.js";
import "../components/dynamic/select-box-search.js";
import "../components/ui/customCheck.js";
import "../components/dynamic/segment.js";
import encode from "../assets/js/utils/encode.js";

class GeoAnalythics extends DynamicElement {
    constructor() {
        super();
        this.state = {
            atmsList: [],
        };
        this.currentCity1 = null;
        this.currentRegion1 = null;
        this.currentCity2 = null;
        this.currentRegion2 = null;

        this.province = [];
        this.cities = [];

        this.selectCityBox1 = null;
        this.selectCityBox2 = null;
        this.selectRegionBox1 = null;
        this.selectRegionBox2 = null;
        this.selectAtmsBox1 = null;
        this.selectAtmsBox2 = null;
        this.submitButtons1 = null;
        this.submitButtons2 = null;

        this.activeTab1 = "geo1";
        this.activeTab2 = "geo2";
    }

    onConnected() {
        const state = store.getState();

        this.province = state.regionsData.map((item) => ({
            label: item.province,
            value: item.province,
        }));

        this.cities = locationTransformer.getAllCityOptions(state.regionsData);

        if (this.state.atmsList.length == 0) {
            this.fetchAtms();
        }
    }

    onAfterRender() {
        this.selectCityBox1 = this.$("#city-selector1");
        this.selectCityBox2 = this.$("#city-selector2");
        this.selectRegionBox1 = this.$("#province-selector1");
        this.selectRegionBox2 = this.$("#province-selector2");
        this.submitButtons1 = this.$$(".submit-button-1");
        this.submitButtons2 = this.$$(".submit-button-2");
        this.selectAtmsBox1 = this.$("#atms-search1");
        this.selectAtmsBox2 = this.$("#atms-search2");
        this.fetchFirstSummary();
        this.fetchSecondSummary();
    }

    async fetchFirstSummary() {
        const queryString = new URLSearchParams();
        if (this.activeTab1 == "geo1") {
            if (this.currentRegion1 != null) queryString.append("province", this.currentRegion1);
            if (this.currentCity1 != null) queryString.append("city", this.currentCity1);

            const segments = this.querySelector("#segments1");
            if (segments?.values?.length) {
                segments.values.forEach((v) => queryString.append("segmentId", v));
            }
        } else if (this.activeTab1 == "atms1") {
            let valuesAttr = this.selectAtmsBox1.getAttribute("value");
            let values = JSON.parse(valuesAttr);
            values.forEach((v) => queryString.append("atmId", v));
        }

        try {
            const response = await this.fetchData(`/analytics/summary?${queryString}`);
            const leftColumn = this.$("#left-column");

            if (leftColumn) leftColumn.innerHTML = this.renderLeftColumn(response.data);
        } catch (err) {
            console.error("❌ Error fetching summary:", err);
        }
    }

    async fetchSecondSummary() {
        const queryString = new URLSearchParams();

        if (this.activeTab2 == "geo2") {
            if (this.currentRegion2 != null) queryString.append("province", this.currentRegion2);
            if (this.currentCity2 != null) queryString.append("city", this.currentCity2);

            const segments = this.querySelector("#segments2");
            if (segments?.values?.length) {
                segments.values.forEach((v) => queryString.append("segmentId", v));
            }
        } else if (this.activeTab2 == "atms2") {
            let valuesAttr = this.selectAtmsBox2.getAttribute("value");
            let values = JSON.parse(valuesAttr);
            values.forEach((v) => queryString.append("atmId", v));
        }
        try {
            const response = await this.fetchData(`/analytics/summary?${queryString}`);
            const rightColumn = this.$("#right-column");
            if (rightColumn) rightColumn.innerHTML = this.renderRightColumn(response.data);
        } catch (err) {
            console.error("❌ Error fetching summary:", err);
        }
    }

    async fetchAtms() {
        try {
            const response = await this.fetchData(`/atm/getatms`);
            this.setState({
                atmsList: response.data.atms.map((atm) => ({
                    value: atm.id,
                    label: atm.name,
                })),
            });
        } catch (err) {
            console.error("❌ Error fetching summary:", err);

            this.setState({
                atmsList: [],
            });
        }
    }

    addEventListeners() {
        if (this.selectCityBox1) {
            this.addListener(this.selectCityBox1, "change", (e) => {
                this.currentCity1 = e.target.value;
            });
        }

        if (this.selectRegionBox1) {
            this.addListener(this.selectRegionBox1, "change", (e) => {
                this.currentRegion1 = e.target.value;
            });
        }

        if (this.selectCityBox2) {
            this.addListener(this.selectCityBox2, "change", (e) => {
                this.currentCity2 = e.target.value;
            });
        }

        if (this.selectRegionBox2) {
            this.addListener(this.selectRegionBox2, "change", (e) => {
                this.currentRegion2 = e.target.value;
            });
        }

        this.submitButtons1.forEach((btn) => {
            this.addListener(btn, "click", () => this.fetchFirstSummary());
        });

        this.submitButtons2.forEach((btn) => {
            this.addListener(btn, "click", () => this.fetchSecondSummary());
        });

        this.leftTabsListener();
        this.rightTabsListener();
    }

    renderLeftColumn(data) {
        if (!data) return `<div class="loading">Loading left column...</div>`;
        console.log("data", data);

        const firstDispenseData = encode(data.dispense_summary);
        const firstDepositData = encode(data.deposit_summary);
        const firstDispenseDynamicData = encode(
            data.transaction_dynamics.dispense_dynamic.hourly_data
        );
        const firstDepositDynamicData = encode(
            data.transaction_dynamics.deposit_dynamic.hourly_data
        );
        const firstExchangeData = data.exchange_summary.currency_details;
        const firstTransactionDynamics = encode(
            data.transaction_dynamics.overall_dynamic.hourly_data
        );
        return /*html*/ `
        <div class="container">
            <doughnut-tabs id="dispense1" data="${firstDispenseData}" show-date="false" title="Կանխիկացում"></doughnut-tabs>
        </div>

        <div class="container">
            <doughnut-tabs id="deposit1" data="${firstDepositData}" show-date="false" title="Մուտքագրում"></doughnut-tabs>
        </div>

        <div class="container">
            <container-top icon="icon-dollar-sign" title="Արտարժույթի փոխանակում"></container-top>
            <div class="infos">
                ${firstExchangeData
                    .map(
                        (exchange) => `
                    <info-card
                        title="${exchange.currency_code}"
                        value="${exchange.total_amount}"
                        value-currency="$" 
                        trend="${exchange.total_amount_percent_change}"
                        icon="icon icon-box"
                        show-border="true">
                    </info-card>
                `
                    )
                    .join("")}
            </div>
        </div>

        <div class="container">
            <container-top icon="icon-trending-up" title="Գործարքների դինամիկա"></container-top>
            <chart-component
                id="line-chart-transaction-dynamics1"
                chart-type="line"
                chart-data='${firstTransactionDynamics}'
                api-url="/analytics/transactions-dynamic-in-days"
                ${this.attrIf("city", this.currentCity)}
                ${this.attrIf("region", this.currentRegion)}>
            </chart-component>
        </div>

        <div class="container">
            <container-top icon="icon-trending-up" title="Կանխիկացումների դինամիկա"></container-top>
            <chart-component
                id="line-chart-dispense-dynamics1"
                chart-type="line"
                chart-data='${firstDispenseDynamicData}'
                api-url="/analytics/dispense-dynamic-in-days"
                ${this.attrIf("city", this.currentCity)}
                ${this.attrIf("region", this.currentRegion)}>
            </chart-component>
        </div>

        <div class="container">
            <container-top icon="icon-trending-up" title="Մուտքագրված գումարների դինամիկա"></container-top>
            <chart-component
                id="line-chart-deposit-dynamics1"
                chart-type="line"
                chart-data='${firstDepositDynamicData}'
                api-url="/analytics/deposit-dynamic-in-days"
                ${this.attrIf("city", this.currentCity)}
                ${this.attrIf("region", this.currentRegion)}>
            </chart-component>
        </div>
    `;
    }

    renderRightColumn(data) {
        if (!data) return `<div class="loading">Loading right column...</div>`;

        const secondDispenseData = encode(data.dispense_summary);
        const secondDepositData = encode(data.deposit_summary);
        const secondDispenseDynamicData = encode(
            data.transaction_dynamics.dispense_dynamic.hourly_data
        );
        const secondDepositDynamicData = encode(
            data.transaction_dynamics.deposit_dynamic.hourly_data
        );
        const secondExchangeData = data.exchange_summary.currency_details;
        const secondTransactionDynamics = encode(
            data.transaction_dynamics.overall_dynamic.hourly_data
        );
        return /*html*/ `
        <div class="container">
            <doughnut-tabs id="dispense2" data="${secondDispenseData}" show-date="false" title="Կանխիկացում"></doughnut-tabs>
        </div>

        <div class="container">
            <doughnut-tabs id="deposit2" data="${secondDepositData}" show-date="false" title="Մուտքագրում"></doughnut-tabs>
        </div>

        <div class="container">
            <container-top icon="icon-dollar-sign" title="Արտարժույթի փոխանակում"></container-top>
            <div class="infos">
                ${secondExchangeData
                    .map(
                        (exchange) => `
                    <info-card
                        title="${exchange.currency_code}"
                        value="${exchange.total_amount}"
                        value-currency="$"
                        trend="${exchange.total_amount_percent_change}"
                        icon="icon icon-box"
                        show-border="true">
                    </info-card>
                `
                    )
                    .join("")}
            </div>
        </div>

          <div class="container">
            <container-top icon="icon-trending-up" title="Գործարքների դինամիկա"></container-top>
            <chart-component
                id="line-chart-transaction-dynamics2"
                chart-type="line"
                chart-data='${secondTransactionDynamics}'
                api-url="/analytics/transactions-dynamic-in-days"
                ${this.attrIf("city", this.currentCity)}
                ${this.attrIf("region", this.currentRegion)}>
            </chart-component>
        </div>


        <div class="container">
            <container-top icon="icon-trending-up" title="Կանխիկացումների դինամիկա"></container-top>
            <chart-component
                id="line-chart-dispense-dynamics2"
                chart-type="line"
                chart-data='${secondDispenseDynamicData}'
                api-url="/analytics/dispense-dynamic-in-days"
                ${this.attrIf("city", this.currentCity)}
                ${this.attrIf("region", this.currentRegion)}>
            </chart-component>
        </div>

        <div class="container">
            <container-top icon="icon-trending-up" title="Մուտքագրված գումարների դինամիկա"></container-top>
            <chart-component
                id="line-chart-deposit-dynamics2"
                chart-type="line"
                chart-data='${secondDepositDynamicData}'
                api-url="/analytics/deposit-dynamic-in-days"
                ${this.attrIf("city", this.currentCity)}
                ${this.attrIf("region", this.currentRegion)}>
            </chart-component>
        </div>
    `;
    }

    leftTabsListener() {
        const tabs = this.$$(".left-tabs custom-tab");
        tabs.forEach((tab) => {
            this.addListener(tab, "click", () => {
                const selectedTabName = tab.getAttribute("name");
                // Store active tab so submitButtonListener knows which one is active
                this.activeTab1 = selectedTabName;
            });
        });
    }

    rightTabsListener() {
        const tabs = this.$$(".right-tabs custom-tab");
        tabs.forEach((tab) => {
            this.addListener(tab, "click", () => {
                const selectedTabName = tab.getAttribute("name");
                // Store active tab so submitButtonListener knows which one is active
                this.activeTab2 = selectedTabName;
            });
        });
    }

    template() {
        const atmsList = encode(this.state.atmsList);
        // const atmsList = encode(this.atmsList);
        if (this.state.atmsList.length == 0) {
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
        return /*html*/ `
        <div class="row">
           <div class="column sm-6">
                <div class="container">
                    <div class="tabs-container">
                        <div class="tabs left-tabs">
                            <custom-tab name="geo1" active>Աշխարհագրական</custom-tab>
                            <custom-tab name="atms1">Բանկոմատներ</custom-tab>
                        </div>
                    </div>
                    <div class="tab-content" data-tab="geo1">
                       <div class="combo-box-items">
                            <select-box id="city-selector1" placeholder="Ընտրել քաղաքը" options='${JSON.stringify(
                                this.cities
                            )}'></select-box>
                            <select-box id="province-selector1"  placeholder="Ընտրել մարզը" options='${JSON.stringify(
                                this.province
                            )}'></select-box>

                        </div>
                        <segment-block id='segments1'></segment-block>
                         <div class="btn-container btn-container_decor">
                            <button type="submit" class="btn btn_fit btn_blue btn_md submit-button-1" >Հաստատել</button>
                        </div>
                    </div>
                    <div class="tab-content" data-tab="atms1" style="display: none;">
                        <select-box-search placeholder="Որոնել ըստ բանկոմատի ID-ի կամ հասցեի" options='${atmsList}' id='atms-search1'></select-box-search>
                        <div class="btn-container btn-container_decor">
                            <button type="submit" class="btn btn_fit btn_blue btn_md submit-button-1">Հաստատել</button>
                        </div>
                    </div>
                </div>
            </div>

             <div class="column sm-6">
                <div class="container">
                    <div class="tabs-container">
                        <div class="tabs right-tabs">
                            <custom-tab name="geo2" active>Աշխարհագրական</custom-tab>
                            <custom-tab name="atms2">Բանկոմատներ</custom-tab>
                        </div>
                    </div>
                    <div class="tab-content" data-tab="geo2">
                       <div class="combo-box-items">
                            <select-box id="city-selector2" placeholder="Ընտրել քաղաքը" options='${JSON.stringify(
                                this.cities
                            )}'></select-box>
                            <select-box id="province-selector2"  placeholder="Ընտրել մարզը" options='${JSON.stringify(
                                this.province
                            )}'></select-box>
                        </div>
                        <segment-block id='segments2'></segment-block>
                         <div class="btn-container btn-container_decor">
                            <button type="submit" class="btn btn_fit btn_blue btn_md submit-button-2">Հաստատել</button>
                        </div>
                    </div>
                    <div class="tab-content" data-tab="atms2" style="display: none;">
                        <select-box-search placeholder="Որոնել ըստ բանկոմատի ID-ի կամ հասցեի" options='${atmsList}'  id='atms-search2'></select-box-search>
                        <div class="btn-container btn-container_decor">
                            <button type="submit" class="btn btn_fit btn_blue btn_md submit-button-2" >Հաստատել</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row" style="display: flex; align-items: flex-start;">
            <div class="column sm-6" id="left-column"></div>
            <div class="column sm-6"  id="right-column"></div>
        </div>  


        `;
    }
}

customElements.define("geo-analythics", GeoAnalythics);
