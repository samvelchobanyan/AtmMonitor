import { ContainerTop } from "../components/ui/containerTop.js";
import { LineChart } from "../components/ui/lineChart.js";
import { DynamicElement } from "../core/dynamic-element.js";
import { pollingService } from "../core/polling-service.js";
import "../components/dynamic/chartComponent.js";
import "../components/dynamic/modal-popup.js";
import "../components/static/changeIndicator.js";
import "../components/dynamic/infoCard.js";
// import { ChartComponent } from "../components/dynamic/chartComponent.js";
import "../components/dynamic/doughnutChart.js";
// import '../components/static/badge.js';

// new components
import "../components/ui/customTab.js";
import "../components/dynamic/select-box-search.js";
import "../components/ui/customCheck.js";
import "../components/dynamic/list-view.js";
import "../components/ui/atmItem.js";
import "../components/ui/infoItem.js";

class AtmsDashboard extends DynamicElement {
    constructor() {
        super();
        this.state = {
            selectedRegion: null,
            selectedCity: null,
            summary: null,
        };
    }

    onConnected() {
        this.fetchSummary();
        this.setupPolling();
    }

    setupPolling() {
        // Register top-stats polling endpoint
        pollingService.register('topStats', '/dashboard/top-stats', 2000);
        
        // Subscribe to polling updates
        this.unsubscribeTopStats = pollingService.subscribe('topStats', (data, error) => {
            if (error) {
                console.error('Top stats polling error:', error);
                return;
            }
            
            if (data) {
                console.log('Received top stats data:', data);
                // You can handle the data here - update attributes, call methods, etc.
                // For now, just logging so you can see it's working
            }
        });
    }

    onDisconnected() {
        // Clean up polling subscription
        if (this.unsubscribeTopStats) {
            this.unsubscribeTopStats();
        }
    }

    onStoreChange(storeState) {
        const region = storeState.selectedRegion;
        const city = storeState.selectedCity;
        if (region !== this.state.selectedRegion || city !== this.state.selectedCity) {
            this.fetchSummary(region, city); // one API call → one render
        }
    }

    async fetchSummary(region, city) {
        const queryString = new URLSearchParams();
        if (region) {
            queryString.append("district", region);
        }
        if (city) {
            queryString.append("city", city);
        }

        try {
            const response = await this.fetchData(`/dashboard/summary?${queryString}`);
            this.setState({
                selectedRegion: region,
                selectedCity: city,
                summary: response.data,
            });
        } catch (err) {
            console.error("❌ Error fetching summary:", err);
            this.setState({ summary: null });
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

        const generalData = this.state.summary;
        const transactionsData = this.state.summary.transactionsInfo; 
        const encashmentData = this.state.summary.encashmentInfo;
        const atmWorkHours = this.state.summary.atmWorkHours;

        const transactionDaily = this.state.summary.hourly_transactions;
        const encashmentsDaily = this.state.summary.hourly_encashments;
        const atmPrductivityDaily = this.state.summary.atmWorkHoursDaily;

        return /* html */ `
        <div class="row">
            <div class="column sm-16">
                <div class="container">
                    <container-top icon="icon-bar-chart" title="Բանկոմատում առկա գումար"> </container-top>
                    <div class="row">
                        <div class="column sm-6">
                        <div class="infos infos_margin">
                            <info-card
                                title="Վերջին ինկասացիա (10/06/2025 11:41)"
                                value="250108500"
                                value-currency="֏" value-color="color-green"
                                trend="7"
                                show-border="true">
                            </info-card>
                        </div>
                            <chart-component
                                id="bar-chart-1"
                                api-url="/dashboard/atm-worktime-in-days"
                                chart-data='${JSON.stringify(atmPrductivityDaily || {})}'
                                chart-type="bar"
                                stacked></chart-component>
                        </div>
                        <div class="column sm-6">
                            <div class="infos infos_margin">
                                <info-card
                                    title="Մնացորդ"
                                    value="30108500"
                                    value-currency="֏" value-color="color-blue"
                                    show-border="true"
                                    button-text="Մանրամասն">
                                </info-card>
                            </div>
                            <chart-component
                                id="bar-chart-2"
                                api-url="/dashboard/atm-worktime-in-days"
                                chart-data='${JSON.stringify(atmPrductivityDaily || {})}'
                                chart-type="bar"
                                stacked></chart-component>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="column sm-6">
                <div class="container">
                    <container-top icon="icon-cpu" title="Սարքավորումներ"> </container-top>
                    <div class="info-items">
                        <info-item text="Dispenser" data-working="true"></info-item>
                        <info-item text="Cash-In" data-working="false"></info-item>
                        <info-item text="Receipt printer" data-working="false"></info-item>
                        <info-item text="Card reader" data-working="true"></info-item>
                    </div>
                </div>
            </div>
            <div class="column sm-6">
                <div class="container">
                    <container-top icon="icon-trello" title="Արտադրողականություն"> </container-top>
                    <div class="info-items-container">
                        <div class="info-items info-items_col">
                            <info-item text="Վերջին connect" value="15 Feb, 2025 | 15:15"></info-item>
                            <info-item text="Վերջին connect" value="15 Feb, 2025 | 15:15"></info-item>
                        </div>
                        <div class="info-items">
                            <info-item text="Վերջին ստատուսի տևողություն" value="1 Ժամ"></info-item>
                        </div>
                    </div>  
                </div>
            </div>
        </div>
        <div class="row">
            <div class="column sm-2">
                <info-card
                    title="Առկա գումար"
                    value="${generalData.total_atm_balance}"
                    value-currency="֏"
                    icon="icon icon-coins"
                    highlight>
                </info-card>
            </div>
            <div class="column sm-2">
                <info-card
                    title="Բանկոմատների թիվ"
                    value="${generalData.total_atms}"
                    icon="icon icon-box">
                </info-card>
            </div>
            <div class="column sm-2">
                <info-card
                    title="Չաշխատող"
                    value="${generalData.not_working_atm_count}"
                    value-color="color-red"
                    icon="icon icon-x-octagon"
                    button-text="Տեսնել">
                </info-card>
            </div>
            <div class="column sm-2">
                <info-card
                    title="Դատարկ"
                    value="${generalData.empty_cassettes_count}"
                    value-color="color-red"
                    icon="icon icon-minus-circle"
                    button-text="Տեսնել">
                </info-card>
            </div>
            <div class="column sm-2">
                <info-card
                    title="Վերջացող"
                    value="${generalData.almost_empty_cassettes_count}"
                    icon="icon icon-box"
                    value-color="color-orange"
                    button-text="Տեսնել">
                </info-card>
            </div>
            <div class="column sm-2">
                <info-card
                    title="Առգրավված քարտեր"
                    value="${generalData.taken_cards_count}"
                    value-color="color-red"
                    icon="icon icon-card"
                    button-text="Տեսնել">
                </info-card>
            </div>
        </div>
        <div class="row">
            <div class="column sm-6">
                <div class="container">
                    <container-top icon="icon-trending-up" title="Գործարքների գումար" link-text="Մանրամասն" link-href="/details"> </container-top>
                    <div class="infos infos_margin">
                        <info-card
                            title="Այսօր կանխիկացված գումար"
                            value="${transactionsData.total_dispense_amount}"
                            value-currency="֏" value-color="color-green"
                            trend="${transactionsData.dispense_amount_percent_change}"
                            show-border="true">
                        </info-card>
                        <info-card
                            title="Այսօր մուտքագրված գումար"
                            value="${transactionsData.total_deposit_amount}"
                            value-currency="֏"
                            value-color="color-blue"
                            trend="${transactionsData.deposit_amount_percent_change}"
                            show-border="true">
                        </info-card>
                    </div>
                    <chart-component
                        id="line-chart"
                        chart-type="line"
                        chart-data='${JSON.stringify(transactionDaily || {})}'
                        api-url="/dashboard/transactions-in-days"
                        ${this.attrIf("city", this.state.selectedCity)}
                        ${this.attrIf("region", this.state.selectedRegion)}></chart-component>
                </div>
            </div>
            <div class="column sm-6">
                <div class="container">
                    <container-top icon="icon-chart" title="Գործարքների քանակ" link-text="Մանրամասն" link-href="/details"> </container-top>
                    <chart-component
                        id="pie-chart"
                        chart-type="doughnut"
                        api-url="/dashboard/transactions-in-days"
                        chart-data='${JSON.stringify(transactionsData || {})}'
                        ${this.attrIf("city", this.state.selectedCity)}
                        ${this.attrIf("region", this.state.selectedRegion)}></chart-component>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="column sm-12">
                <div class="container">
                    <container-top icon="icon-coins" title="Ինկասացիա"> </container-top> 
                    <div class="infos infos_margin">
                        <info-card
                            title="Այսօրվա ինկասացիաներ"
                            value="${encashmentData.total_encashments}"
                            icon="icon icon-box"
                            show-border="true">
                        </info-card>
                        <info-card
                            title="Այսօր հետ բերված գումար"
                            value="${encashmentData.total_collected_amount}"
                            value-currency="֏"
                            value-color="color-green"
                            icon="icon icon-arrow-down-left"
                            show-border="true">
                        </info-card>
                        <info-card
                            title="Այսօրվա ինկասացիայի գումար"
                            value="${encashmentData.total_added_amount}"
                            value-currency="֏"
                            value-color="color-blue"
                            icon="icon icon-arrow-up-right"
                            show-border="true">
                        </info-card>
                        <info-card
                            title="Երեկ դատարկ բանկոմատներ"
                            value="${encashmentData.yesterday_marked_as_empty}"
                            value-color="color-red"
                            icon="icon icon-box"
                            message="2"
                            message-endpoint='dashboard/comments'
                            show-border="true">
                        </info-card>
                    </div>
                    <chart-component
                        id="line-chart-transit"
                        api-url="/dashboard/encashments-in-days"
                        chart-type="line"
                        chart-data='${JSON.stringify(encashmentsDaily || {})}'></chart-component>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="column sm-6">
                <div class="container">
                    <container-top icon="icon-trello" title="Բանկոմատի ցանցի արտադրողականություն"> </container-top>
                    <div class="infos infos_margin">
                        <info-card
                            title="Այսօր աշխատաժամանակ"
                            value="${atmWorkHours.working_percent}"
                            icon="icon icon-clock"
                            show-border="true"
                            duration="${atmWorkHours.total_working_time}">
                        </info-card>
                        <info-card
                            title="Այսօր պարապուրդ"
                            value="${atmWorkHours.non_working_percent}"
                            icon="icon icon-clock"
                            show-border="true"
                            duration="${atmWorkHours.total_non_working_time}">
                        </info-card>
                    </div>
                    <chart-component
                        id="bar-chart"
                        api-url="/dashboard/atm-worktime-in-days"
                        chart-data='${JSON.stringify(atmPrductivityDaily || {})}'
                        chart-type="bar"></chart-component>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="column sm-6">
                <div class="container">
                    <div class="tabs-container">
                        <div class="tabs">
                            <custom-tab name="geo" active>Աշխարհագրական</custom-tab>
                            <custom-tab name="atms">Բանկոմատներ</custom-tab>
                        </div>
                    </div>
                    <div class="tab-content" data-tab="geo">
                        <select-box-search placeholder="Choose your fruit" options='[ {"value":"s","label":"Apple"}, {"value":"banana","label":"Banana"}, {"value":"cherry","label":"Cherry"} ]'> </select-box-search>
                    </div>
                    <div class="tab-content" data-tab="atms" style="display: none;">
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
            `;
    }
}

customElements.define("atms-dashboard", AtmsDashboard);
