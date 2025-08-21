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
            firstSummary: null,
            secondSummary: null,
            currentRegion1: null,
            currentCity1: null,
            currentRegion2: null,
            currentCity2: null,
        };
        this.province = [];
        this.cities = [];
        // this.currentRegion1 = null;
        // this.currentCity1 = null;

        // this.currentRegion2 = null;
        // this.currentCity2 = null;
        this.atmsList = [];

        this.selectCityBox1 = null;
        this.selectCityBox2 = null;
        this.selectRegionBox1 = null;
        this.selectRegionBox2 = null;
        this.selectaAtmsBox1 = null;
        this.selectaAtmsBox2 = null;
    }

    onConnected() {
        const state = store.getState();

        this.province = state.regionsData.map((item) => ({
            label: item.province,
            value: item.province,
        }));

        this.cities = locationTransformer.getAllCityOptions(state.regionsData);

        this.fetchFirstSummary();
        this.fetchSecondSummary();
        if (this.atmsList.length == 0) {
            this.fetchAtms();
        }
    }

    onAfterRender() {
        this.selectCityBox1 = this.$("#city-selector1");
        this.selectCityBox2 = this.$("#city-selector2");
        this.selectRegionBox1 = this.$("#province-selector1");
        this.selectRegionBox2 = this.$("#province-selector2");
    }

    async fetchFirstSummary(region, city, atmId) {
        console.log(region, city, atmId);

        const queryString = new URLSearchParams();
        if (region != null) queryString.append("district", region);
        if (city != null) queryString.append("city", city);
        if (atmId != null) queryString.append("atmId", atmId);

        try {
            const response = await this.fetchData(`/analytics/summary?${queryString}`);

            const newState = { firstSummary: response.data };

            if (region != null) newState.currentRegion1 = region;
            if (city != null) newState.currentCity1 = city;

            this.setState(newState);
        } catch (err) {
            console.error("❌ Error fetching summary:", err);
            this.setState({ firstSummary: null });
        }
    }

    async fetchSecondSummary(region, city, atmId) {
        const queryString = new URLSearchParams();
        if (region != null) queryString.append("district", region);
        if (city != null) queryString.append("city", city);
        if (atmId != null) queryString.append("atmId", atmId);

        try {
            const response = await this.fetchData(`/analytics/summary?${queryString}`);

            const newState = { secondSummary: response.data };

            if (region != null) newState.currentRegion2 = region;
            if (city != null) newState.currentCity2 = city;

            this.setState(newState);
        } catch (err) {
            console.error("❌ Error fetching summary:", err);
            this.setState({ secondSummary: null });
        }
    }

    async fetchAtms(region, city, atmId) {
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
            const response = await this.fetchData(`/atm/getatms?${queryString}`);
            // console.log("!!!!", response);

            this.atmsList = response.data.atms.map((atm) => ({
                value: atm.id,
                label: atm.name,
            }));
        } catch (err) {
            console.error("❌ Error fetching summary:", err);
            this.atmsList = [];
        }
    }

    addEventListeners() {
        if (this.selectCityBox1) {
            this.addListener(this.selectCityBox1, "change", (e) => {
                this.setState({
                    currentCity1: e.target.value,
                });

                const args = [this.state.currentRegion1, this.state.currentCity1].filter(
                    (v) => v !== null && v !== undefined
                );

                this.fetchFirstSummary(...args);
            });
        }
        if (this.selectRegionBox1) {
            this.addListener(this.selectRegionBox1, "change", (e) => {
                this.setState({
                    currentRegion1: e.target.value,
                });

                const args = [this.state.currentRegion1, this.state.currentCity1].filter(
                    (v) => v !== null && v !== undefined
                );
                console.log("args", ...args);

                this.fetchFirstSummary(...args);
            });
        }

        if (this.selectCityBox2) {
            this.addListener(this.selectCityBox2, "change", (e) => {
                this.setState({
                    currentCity2: e.target.value,
                });

                const args = [this.state.currentRegion2, this.state.currentCity2].filter(
                    (v) => v !== null && v !== undefined
                );

                this.fetchSecondSummary(...args);
            });
        }
        if (this.selectRegionBox2) {
            this.addListener(this.selectRegionBox2, "change", (e) => {
                this.setState({
                    currentRegion2: e.target.value,
                });

                const args = [this.state.currentRegion2, this.state.currentCity2].filter(
                    (v) => v !== null && v !== undefined
                );

                this.fetchSecondSummary(...args);
            });
        }
    }

    template() {
        const firstSummary = this.state.firstSummary;
        const secondSummary = this.state.secondSummary;

        if (!firstSummary || !secondSummary || !this.atmsList) {
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

        const firstDispenseData = encode(firstSummary.dispense_summary);
        const secondDispenseData = encode(secondSummary.dispense_summary);

        const firstDepositData = encode(firstSummary.deposit_summary);
        const secondDepositData = encode(secondSummary.deposit_summary);

        const firstDispenseDynamicData = encode(
            firstSummary.transaction_dynamics.dispense_dynamic.hourly_data
        );
        const secondDispenseDynamicData = encode(
            secondSummary.transaction_dynamics.dispense_dynamic.hourly_data
        );

        const firstDepositDynamicData = encode(
            firstSummary.transaction_dynamics.deposit_dynamic.hourly_data
        );
        const secondDepositDynamicData = encode(
            secondSummary.transaction_dynamics.deposit_dynamic.hourly_data
        );

        const firstExchangeData = firstSummary.exchange_summary.currency_details;
        const secondExchangeData = secondSummary.exchange_summary.currency_details;

        const atmsList = encode(this.atmsList);

        return /*html*/ `       
        <div class="row">
           <div class="column sm-6">
                <div class="container">
                    <div class="tabs-container">
                        <div class="tabs">
                            <custom-tab name="geo1" active>Աշխարհագրական</custom-tab>
                            <custom-tab name="atms1">Բանկոմատներ</custom-tab>
                        </div>
                    </div>
                    <div class="tab-content" data-tab="geo1">
                       <div class="combo-box-items"> 
                            <select-box id="city-selector1" placeholder="Ընտրել քաղաքը" options='${JSON.stringify(
                                this.cities
                            )}' value="${this.state.currentCity1 || ""}"></select-box>
                            <select-box id="province-selector1"  placeholder="Ընտրել մարզը" options='${JSON.stringify(
                                this.province
                            )}' value="${this.state.currentRegion1 || ""}"></select-box>
                           
                        </div>
                        <segment-block></segment-block>
                    </div>
                    <div class="tab-content" data-tab="atms1" style="display: none;">
                        <select-box-search placeholder="Որոնել ըստ բանկոմատի ID-ի կամ հասցեի" options='${atmsList}' name='atms-search1'></select-box-search>
                    </div>
                </div>
            </div>

             <div class="column sm-6">
                <div class="container">
                    <div class="tabs-container">
                        <div class="tabs">
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
                        <segment-block></segment-block>
                    </div>
                    <div class="tab-content" data-tab="atms2" style="display: none;">
                        <select-box-search placeholder="Որոնել ըստ բանկոմատի ID-ի կամ հասցեի" options='${atmsList}'  name='atms-search2'></select-box-search>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="column sm-6">
                <div class="container">
                    <doughnut-tabs id="dispense1" data="${firstDispenseData}" show-date="false"></doughnut-tabs>
                </div>
            </div>

            <div class="column sm-6">
                <div class="container">
                    <doughnut-tabs id="dispense2" data="${secondDispenseData}" show-date="false"></doughnut-tabs>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="column sm-6">
                <div class="container">
                    <doughnut-tabs id="deposit1" data="${firstDepositData}" show-date="false"></doughnut-tabs>
                </div>
            </div>

            <div class="column sm-6">
                <div class="container">
                    <doughnut-tabs id="deposit2" data="${secondDepositData}" show-date="false"></doughnut-tabs>
                </div>
            </div>
          </div>

        <div class="row">
           <div class="column sm-6">
              <div class="container">
                  <container-top icon="icon-coins" title="Արտարժույթի փոխանակում"></container-top>
                  <div class="infos">
                      ${firstExchangeData
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
                </div>
              </div>

            <div class="column sm-6">
              <div class="container">
                  <container-top icon="icon-coins" title="Արտարժույթի փոխանակում"></container-top>
                  <div class="infos">
                      ${secondExchangeData
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
                  </div>
                </div>
            </div>

            <div class="row">
              <div class="column sm-6">
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
               </div>

                <div class="column sm-6">
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
              </div>
            </div>

            <div class="row">
              <div class="column sm-6">
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
              </div>


              <div class="column sm-6">
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
              </div>
            </div>
          </div>
            
        `;
    }
}

customElements.define("geo-analythics", GeoAnalythics);
