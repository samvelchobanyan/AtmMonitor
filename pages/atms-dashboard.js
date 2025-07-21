import { ContainerTop } from "../components/ui/containerTop.js";
import { LineChart } from "../components/ui/lineChart.js";
import { DynamicElement } from "../core/dynamic-element.js";
import "../components/dynamic/chartComponent.js"
import "../components/static/changeIndicator.js"
import "../components/static/infoCard.js"
// import { ChartComponent } from "../components/dynamic/chartComponent.js";

class AtmsDashboard extends DynamicElement  {
    constructor() {
        super();
        this.state = {
            selectedRegion: null,
            selectedCity: null,
            summary: null
        };
    }

    onConnected() {
        console.log('atm-dashboard connected',this.state)
        this.fetchSummary()
    }

    onStoreChange(storeState) {
        const region = storeState.selectedRegion;
        const city = storeState.selectedCity
        if (region !== this.state.selectedRegion || city !== this.state.selectedCity) {
            this.fetchSummary(region, city); // one API call → one render
        }
    }

    async fetchSummary(region, city){
        const queryString = new URLSearchParams();
        if (region){
            queryString.append('region', region);
        }
        if(city){
            queryString.append('city',city);
        }

        try {
            const response = await this.fetchData(`/dashboard/summary?${queryString}`);
            console.log('fetch result',response)
            this.setState({
                selectedRegion: region,
                selectedCity: city,
                summary: response.data
            }); // ✅ single re-render
        } catch (err) {
            console.error('❌ Error fetching summary:', err);
            this.setState({ summary: null });
        }
    }

    template() {
        if (!this.state.summary) {
            return /*html*/ `
              <div class="loading-wrapper">
                <div class="spinner"></div>
                <div class="loading-text">Տվյալները բեռնվում են…</div>
              </div>
            `;
        }

        const generalData = this.state.summary;
        const transactionsData = this.state.summary.transactionsInfo;
        const encashmentData = this.state.summary.encashmentInfo;
        const atmWorkHours = this.state.summary.atmWorkHours;

        console.log('atm-dashboar',this.state)
        return /* html */ `
            <div class="main-container">
                <div class="row">
                    <div class="column sm-2">
                        <info-card title="Առկա գումար" value="${generalData.total_atm_balance}" value-currency="֏" icon="icon icon-coins" highlight></info-card>
                    </div>
                    <div class="column sm-2">
                        <info-card title="Բանկոմատների թիվ" value="${generalData.total_atms}" icon="icon icon-box"></info-card>
                    </div>
                    <div class="column sm-2">
                        <info-card title="Չաշխատող" value="${generalData.not_working_atm_count}" value-color="color-red" icon="icon icon-x-octagon" button-text="Տեսնել"></info-card>
                    </div>
                    <div class="column sm-2">
                        <info-card title="Դատարկ" value="${generalData.empty_cassettes_count}" value-color="color-red" icon="icon icon-minus-circle" button-text="Տեսնել"></info-card>
                    </div>
                    <div class="column sm-2">
                        <info-card title="Վերջացող" value="${generalData.almost_empty_cassettes_count}" icon="icon icon-box" value-color="color-orange" button-text="Տեսնել"></info-card>
                    </div>
                    <div class="column sm-2">
                        <info-card title="Առգրավված քարտեր" value="${generalData.taken_cards_count}" value-color="color-red" icon="icon icon-card" button-text="Տեսնել"></info-card>
                    </div>
                </div>
                <div class="row">
                    <div class="column sm-6">
                        <div class="container">
                            <container-top icon="icon-trending-up" title="Գործարքների գումար" link-text="Մանրամասն" link-href="/details"> </container-top>
                            <div class="infos">
                                <info-card title="Այսօր կանխիկացված գումար" value="${transactionsData.current_dispense_amount}" value-currency="֏" value-color="color-green" trend="${transactionsData.current_dispense_amount_percent_change}" border></info-card>
                                <info-card title="Այսօր մուտքագրված գումար" value="${transactionsData.current_deposit_amount}" value-currency="֏" value-color="color-blue" trend="${transactionsData.current_deposit_amount_percent_change}" border></info-card>
                            </div>
                            <chart-component
                                id="line-chart"
                                chart-type="line"                                
                                api-url="/dashboard/transactions-in-days"
                                start-date = "2025-06-01"
                                end-date = "2025-07-08"
                                ${this.attrIf('city',this.state.selectedCity)}
                                ${this.attrIf('region',this.state.selectedRegion)}
                            ></chart-component>
                        </div>
                    </div>
                    <div class="column sm-6">
                        <div class="container">
                            <container-top icon="icon-chart" title="Գործարքների քանակ" link-text="Մանրամասն" link-href="/details"> </container-top>
                            <chart-component
                                id="pie-chart"
                                chart-type="doughnut"                               
                                api-url="/dashboard/transactions-in-days"
                                start-date = "2025-06-01"
                                end-date = "2025-07-08"
                                ${this.attrIf('city',this.state.selectedCity)}
                                ${this.attrIf('region',this.state.selectedRegion)}
                            ></chart-component>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="column sm-12">
                        <div class="container">
                            <container-top icon="icon-coins" title="Ինկասացիա"> </container-top>
                            <div class="infos">
                                <info-card title="Այսօրվա ինկասացիաներ" value="${encashmentData.today_encashments}" icon="icon icon-box"></info-card>
                                <info-card title="Այսօր հետ բերված գումար" value="${encashmentData.today_collected_amount}" value-currency="֏" value-color="color-green" icon="icon icon-arrow-down-left"></info-card>
                                <info-card title="Բանկոմատների թիվ" value="${encashmentData.today_added_amount}" value-currency="֏" value-color="color-blue" icon="icon icon-arrow-up-right"></info-card>
                                <info-card title="Երեկ դատարկ բանկոմատներ" value="${encashmentData.yesterday_marked_as_empty}" value-color="color-red" icon="icon icon-box" message="2"></info-card>
                            </div>
                            <select-box-simple value="1" options='[ {"value":"1","label":"Այսօր"}, {"value":"2","label":"Այս շաբաթ"}, {"value":"3","label":"Այս ամիս"} ]'></select-box-simple>
                            <line-chart chart-id="line-chart-2" legend-id="legend-container-2"> </line-chart>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define("atms-dashboard", AtmsDashboard);
