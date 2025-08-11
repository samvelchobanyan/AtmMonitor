import { DynamicElement } from "../core/dynamic-element.js";
import locationTransformer from "../core/utils/location-transformer.js";
import { store } from "../core/store/store.js";
import "../components/dynamic/doughnutTabs.js";
import "../components/ui/customTab.js";
import "../components/dynamic/select-box-search.js";
import "../components/ui/customCheck.js";
import "../components/dynamic/segment.js";

class Cumulative extends DynamicElement {
    constructor() {
        super();

        this.state = {
            firstSummary: null,
            secondSummary: null,
        };
        this.province = [];
        this.cities = [];
        this.currentRegion1 = null;
        this.currentCity1 = null;

        this.currentRegion2 = null;
        this.currentCity2 = null;
        this.atmsList = [];

        this.selectCityBox1 = null;
        this.selectCityBox2 = null;
        this.selectRegionBox1 = null;
        this.selectRegionBox2 = null;
    }

    // todo after on change fetch select resets
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
        console.log("currentRegion1", this.currentRegion1);
        console.log("currentCity1", this.currentCity1);

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
            this.currentRegion1 = region;
            this.currentCity1 = city;

            this.setState({
                firstSummary: response.data,
            });
        } catch (err) {
            console.error("❌ Error fetching summary:", err);
            this.setState({
                firstSummary: null,
            });
        }
    }

    async fetchSecondSummary(region, city, atmId) {
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
            this.currentRegion2 = region;
            this.currentCity2 = city;

            this.setState({
                secondSummary: response.data,
            });
        } catch (err) {
            console.error("❌ Error fetching summary:", err);
            this.setState({
                secondSummary: null,
            });
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

    // onStoreChange(storeState) {
    //     const region = storeState.selectedRegion;
    //     const city = storeState.selectedCity;
    //     if (region !== this.currentRegion || city !== this.currentCity) {
    //         this.fetchFirstSummary(region, city);
    //         this.fetchSecondSummary(region, city);
    //     }
    // }

    addEventListeners() {
        if (this.selectCityBox1) {
            this.addListener(this.selectCityBox1, "change", (e) => {
                this.currentCity1 = e.target.value;
                this.fetchFirstSummary(this.currentRegion1, this.currentCity1);
            });
        }

        if (this.selectCityBox2) {
            this.addListener(this.selectCityBox2, "change", (e) => {
                this.currentCity2 = e.target.value;
                this.fetchSecondSummary(this.currentRegion2, this.currentCity2);
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

        const firstDispenseData = JSON.stringify(firstSummary.dispense_summary).replace(
            /"/g,
            "&quot;"
        );
        const secondDispenseData = JSON.stringify(secondSummary.dispense_summary).replace(
            /"/g,
            "&quot;"
        );

        const firstDepositData = JSON.stringify(firstSummary.deposit_summary).replace(
            /"/g,
            "&quot;"
        );
        const secondDepositData = JSON.stringify(secondSummary.deposit_summary).replace(
            /"/g,
            "&quot;"
        );

        // const transactionsData = JSON.stringify(
        //     summary.transaction_dynamics.exchange_dynamic.hourly_data
        // ).replace(/"/g, "&quot;");

        const firstDispenseDynamicData = JSON.stringify(
            firstSummary.transaction_dynamics.dispense_dynamic.hourly_data
        ).replace(/"/g, "&quot;");

        const secondDispenseDynamicData = JSON.stringify(
            secondSummary.transaction_dynamics.dispense_dynamic.hourly_data
        ).replace(/"/g, "&quot;");

        const firstDepositDynamicData = JSON.stringify(
            firstSummary.transaction_dynamics.deposit_dynamic.hourly_data
        ).replace(/"/g, "&quot;");

        const secondDepositDynamicData = JSON.stringify(
            secondSummary.transaction_dynamics.deposit_dynamic.hourly_data
        ).replace(/"/g, "&quot;");

        const firstExchangeData = firstSummary.exchange_summary.currency_details;
        const secondExchangeData = secondSummary.exchange_summary.currency_details;

        const atmsList = JSON.stringify(this.atmsList).replace(/"/g, "&quot;");
        return /*html*/ `

            
        <div class="row">
           <div class="column">
                <div class="container">
                    <div class="tabs-container">
                        <div class="tabs">
                            <custom-tab name="region" active>Մարզ</custom-tab>
                            <custom-tab name="city">Քաղաք</custom-tab>
                            <custom-tab name="province">Համայնք</custom-tab>
                            <custom-tab name="segment">Սեգմենտ</custom-tab>
                            <custom-tab name="atm">Բանկոմատ</custom-tab>
                        </div>
                    </div>
                    <div class="tab-content column sm-6" data-tab="region">
                      <div class="checkboxes">
                            <custom-checkbox id="yerevan" value="yerevan" checked>Երևան</custom-checkbox> 
                            <custom-checkbox id="armavir" value="armavir">Արմավիր</custom-checkbox> 
                            <custom-checkbox id="lori" value="lori">Լոռի</custom-checkbox> 
                            <custom-checkbox id="tavush" value="tavush">Տավուշ</custom-checkbox> 
                            <custom-checkbox id="aragatsotn" value="aragatsotn">Արագածոտն</custom-checkbox> 
                            <custom-checkbox id="gegharkunik" value="gegharkunik">Գեղարքունիք</custom-checkbox> 
                            <custom-checkbox id="shirak" value="shirak">Շիրակ</custom-checkbox> 
                            <custom-checkbox id="vayots-dzor" value="vayots-dzor">Վայոց ձոր</custom-checkbox> 
                            <custom-checkbox id="ararat" value="ararat">Արարատ</custom-checkbox> 
                            <custom-checkbox id="kotayk" value="kotayk">Կոտայք</custom-checkbox> 
                            <custom-checkbox id="syunik" value="syunik">Սյունիք</custom-checkbox> 
                        </div>  
                    </div>
                    <div class="tab-content" data-tab="city" style="display:none">
                        <select-box-search placeholder="Որոնել Քաղաք" options='${atmsList}'></select-box-search>
                        <div class="tab-content" data-tab="city">
                            <div class="checkboxes">
                                <custom-checkbox id="yerevan" value="yerevan" checked>Երևան</custom-checkbox> 
                                <custom-checkbox id="armavir" value="armavir">Արմավիր</custom-checkbox> 
                                <custom-checkbox id="lori" value="lori">Լոռի</custom-checkbox> 
                                <custom-checkbox id="tavush" value="tavush">Տավուշ</custom-checkbox> 
                                <custom-checkbox id="aragatsotn" value="aragatsotn">Արագածոտն</custom-checkbox> 
                                <custom-checkbox id="gegharkunik" value="gegharkunik">Գեղարքունիք</custom-checkbox> 
                                <custom-checkbox id="shirak" value="shirak">Շիրակ</custom-checkbox> 
                                <custom-checkbox id="vayots-dzor" value="vayots-dzor">Վայոց ձոր</custom-checkbox> 
                                <custom-checkbox id="ararat" value="ararat">Արարատ</custom-checkbox> 
                                <custom-checkbox id="kotayk" value="kotayk">Կոտայք</custom-checkbox> 
                                <custom-checkbox id="syunik" value="syunik">Սյունիք</custom-checkbox> 
                            </div>  
                        </div>
                    </div>
                    <div class="tab-content" data-tab="province" style="display:none">
                        <select-box-search placeholder="Որոնել Համայնք" options='${atmsList}'></select-box-search>
                        <div class="tab-content" data-tab="province">
                            <div class="checkboxes">
                                <custom-checkbox id="yerevan" value="yerevan" checked>Երևան</custom-checkbox> 
                                <custom-checkbox id="armavir" value="armavir">Արմավիր</custom-checkbox> 
                                <custom-checkbox id="lori" value="lori">Լոռի</custom-checkbox> 
                                <custom-checkbox id="tavush" value="tavush">Տավուշ</custom-checkbox> 
                                <custom-checkbox id="aragatsotn" value="aragatsotn">Արագածոտն</custom-checkbox> 
                                <custom-checkbox id="gegharkunik" value="gegharkunik">Գեղարքունիք</custom-checkbox> 
                                <custom-checkbox id="shirak" value="shirak">Շիրակ</custom-checkbox> 
                                <custom-checkbox id="vayots-dzor" value="vayots-dzor">Վայոց ձոր</custom-checkbox> 
                                <custom-checkbox id="ararat" value="ararat">Արարատ</custom-checkbox> 
                                <custom-checkbox id="kotayk" value="kotayk">Կոտայք</custom-checkbox> 
                                <custom-checkbox id="syunik" value="syunik">Սյունիք</custom-checkbox> 
                            </div>  
                        </div>
                    </div>
                    <div class="tab-content" data-tab="segment" style="display:none">
                        <select-box-search placeholder="Որոնել Սեգմենտ" options='${atmsList}'></select-box-search>
                        <div class="tab-content" data-tab="segment" style="display: none;">
                            <div class="checkboxes">
                                <custom-checkbox id="yerevan" value="yerevan" checked>Երևան</custom-checkbox> 
                                <custom-checkbox id="armavir" value="armavir">Արմավիր</custom-checkbox> 
                                <custom-checkbox id="lori" value="lori">Լոռի</custom-checkbox> 
                                <custom-checkbox id="tavush" value="tavush">Տավուշ</custom-checkbox> 
                                <custom-checkbox id="aragatsotn" value="aragatsotn">Արագածոտն</custom-checkbox> 
                                <custom-checkbox id="gegharkunik" value="gegharkunik">Գեղարքունիք</custom-checkbox> 
                                <custom-checkbox id="shirak" value="shirak">Շիրակ</custom-checkbox> 
                                <custom-checkbox id="vayots-dzor" value="vayots-dzor">Վայոց ձոր</custom-checkbox> 
                                <custom-checkbox id="ararat" value="ararat">Արարատ</custom-checkbox> 
                                <custom-checkbox id="kotayk" value="kotayk">Կոտայք</custom-checkbox> 
                                <custom-checkbox id="syunik" value="syunik">Սյունիք</custom-checkbox> 
                            </div>  
                        </div>
                    </div>

                       <div class="tab-content" data-tab="atm" style="display:none">
                        <select-box-search placeholder="Որոնել ըստ բանկոմատի ID-ի կամ հասցեի" options='${atmsList}'></select-box-search>
                        <div class="tab-content" data-tab="atm" style="display: none;">
                            <div class="checkboxes">
                                <custom-checkbox id="yerevan" value="yerevan" checked>Երևան</custom-checkbox> 
                                <custom-checkbox id="armavir" value="armavir">Արմավիր</custom-checkbox> 
                                <custom-checkbox id="lori" value="lori">Լոռի</custom-checkbox> 
                                <custom-checkbox id="tavush" value="tavush">Տավուշ</custom-checkbox> 
                                <custom-checkbox id="aragatsotn" value="aragatsotn">Արագածոտն</custom-checkbox> 
                                <custom-checkbox id="gegharkunik" value="gegharkunik">Գեղարքունիք</custom-checkbox> 
                                <custom-checkbox id="shirak" value="shirak">Շիրակ</custom-checkbox> 
                                <custom-checkbox id="vayots-dzor" value="vayots-dzor">Վայոց ձոր</custom-checkbox> 
                                <custom-checkbox id="ararat" value="ararat">Արարատ</custom-checkbox> 
                                <custom-checkbox id="kotayk" value="kotayk">Կոտայք</custom-checkbox> 
                                <custom-checkbox id="syunik" value="syunik">Սյունիք</custom-checkbox> 
                            </div>  
                        </div>
                    </div>
                </div>
            </div>

           
        </div>

 
          </div>
            
        `;
    }
}

customElements.define("cumulative-analythics", Cumulative);
