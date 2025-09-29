import { ContainerTop } from "../components/ui/containerTop.js";
import { LineChart } from "../components/ui/lineChart.js";
import { DynamicElement } from "../core/dynamic-element.js";
import { pollingService } from "../core/polling-service.js";
import "../components/dynamic/chartComponent.js";
import "../components/dynamic/modal-popup.js";
import "../components/static/changeIndicator.js";
import "../components/dynamic/infoCard.js";
import "../components/dynamic/doughnutChart.js";

class AtmsDashboard extends DynamicElement {
    constructor() {
        super();
        this.state = {
            selectedRegion: null,
            selectedCity: null,
            summary: null,
            incashmentInfoCardsData: null,
            atmInfoCardsData: null,
        };

        this.incashmentChart = null;
        this.barChart = null;
    }

    onConnected() {
        this.fetchSummary();
        this.setupPolling();
    }

    setupPolling() {
        // Register top-stats polling endpoint
        pollingService.register("topStats", "/dashboard/top-stats", 2000);

        // Subscribe to polling updates
        this.unsubscribeTopStats = pollingService.subscribe("topStats", (data, error) => {
            if (error) {
                console.error("Top stats polling error:", error);
                return;
            }

            if (data) {
                console.log("Received top stats data:", data);
                this.updateTopStats(data.data);
                // You can handle the data here - update attributes, call methods, etc.
                // For now, just logging so you can see it's working
            }
        });
    }

    updateTopStats(data) {
        this.$("#total-balance").setAttribute("value", data.total_atm_balance);
        this.$("#total-atms").setAttribute("value", data.total_atms);
        this.$("#not-working-atms").setAttribute("value", data.not_working_atm_count);
        this.$("#empty-cassettes").setAttribute("value", data.empty_cassettes_count);
        this.$("#almost-empty-cassettes").setAttribute("value", data.almost_empty_cassettes_count);
        this.$("#taken-cards").setAttribute("value", data.taken_cards_count);
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
        let url = `/dashboard/summary?${queryString}`;
        url = url.endsWith("?") ? url.slice(0, -1) : url;

        try {
            const response = await this.fetchData(url);
            console.log("response.data.work_hours_per_day", response.data);
            console.log("response", response.data);
            this.setState({
                selectedRegion: region,
                selectedCity: city,
                summary: response.data,
                incashmentInfoCardsData: response.data.encashmentInfo,
                atmInfoCardsData: response.data.atmWorkHours,
            });
        } catch (err) {
            console.error("❌ Error fetching summary:", err);
            this.setState({ summary: null });
        }
    }

    onAfterRender() {
        this.incashmentChart = this.$("#line-chart-transit");
        this.barChart = this.$("#bar-chart");
    }

    addEventListeners() {
        if (this.incashmentChart) {
            this.addListener(this.incashmentChart, "chart-changed", (e) => {
                let data = e.detail.data;
                const newInfo = {
                    total_encashments: data.total_encashments,
                    total_collected_amount: data.total_collected_amount,
                    total_added_amount: data.total_added_amount,
                    yesterday_marked_as_empty: data.yesterday_marked_as_empty,
                };

                // Only update if different, because creates loop
                if (
                    JSON.stringify(newInfo) !== JSON.stringify(this.state.incashmentInfoCardsData)
                ) {
                    this.setState({ incashmentInfoCardsData: newInfo });
                    console.log("Chart changed data:", data);
                }
            });
        }
        // todo ask if this should also update. If so, then they should gice just 1 value, now its an array. Delete all data if this doesnt need
        // if (this.barChart) {
        //     this.addListener(this.barChart, "chart-changed", (e) => {
        //         let data = e.detail.data;

        //         // const newInfo = {
        //         //     total_encashments: data.total_encashments,
        //         //     total_collected_amount: data.total_collected_amount,
        //         //     total_added_amount: data.total_added_amount,
        //         //     yesterday_marked_as_empty: data.yesterday_marked_as_empty,
        //         // };
        //         console.log("!!!!!!!", this.state.atmInfoCardsData);
        //         console.log("data.work_hours_per_day", data);

        //         // Only update if different, because creates loop
        //         if (
        //             JSON.stringify(data.work_hours_per_day[0]) !==
        //             JSON.stringify(this.state.atmInfoCardsData)
        //         ) {
        //             this.setState({ atmInfoCardsData: data.work_hours_per_day[0] });
        //             console.log("Chart changed data:", data);

        //             console.log("atmInfoCardsData", this.state.atmInfoCardsData);
        //         }
        //     });
        // }
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
        const encashmentData = this.state.incashmentInfoCardsData;
        const atmWorkHours = this.state.atmInfoCardsData;

        const transactionDaily = this.state.summary.hourly_transactions;
        const encashmentsDaily = this.state.summary.hourly_encashments;
        const atmPrductivityDaily = this.state.summary.atmWorkHoursDaily;

        return /* html */ `
        <div class="row">
            <div class="column sm-2">
                <info-card
                    id="total-balance"
                    title="Առկա գումար"
                    value="${generalData.total_atm_balance}"
                    value-currency="֏"
                    icon="icon icon-coins"
                    highlight>
                </info-card>
            </div>
            <div class="column sm-2">
                <info-card
                    id="total-atms"
                    title="Բանկոմատների թիվ"
                    value="${generalData.total_atms}"
                    icon="icon icon-box">
                </info-card>
            </div>
            <div class="column sm-2">
                <info-card
                    id="not-working-atms"
                    title="Չաշխատող"
                    value="${generalData.not_working_atm_count}"
                    value-color="color-red"
                    icon="icon icon-x-octagon"
                    button-text="Տեսնել">
                </info-card>
            </div>
            <div class="column sm-2">
                <info-card
                    id="empty-cassettes"
                    title="Դատարկ"
                    value="${generalData.empty_cassettes_count}"
                    value-color="color-red"
                    icon="icon icon-minus-circle"
                    button-text="Տեսնել">
                </info-card>
            </div>
            <div class="column sm-2">
                <info-card
                    id="almost-empty-cassettes"
                    title="Վերջացող"
                    value="${generalData.almost_empty_cassettes_count}"
                    icon="icon icon-box"
                    value-color="color-orange"
                    button-text="Տեսնել">
                </info-card>
            </div>
            <div class="column sm-2">
                <info-card
                    id="taken-cards"
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
                    <container-top icon="icon-trending-up" title="Գործարքների գումար" link-text="Մանրամասն" link-href="inout"> </container-top>
                    <div class="infos infos_margin">
                        <info-card
                            title="Կանխիկացված գումար"
                            value="${transactionsData.total_dispense_amount}"
                            value-currency="֏" value-color="color-green"
                            trend="${transactionsData.dispense_amount_percent_change}"
                            show-border="true">
                        </info-card>
                        <info-card
                            title="Մուտքագրված գումար"
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
                    <container-top icon="icon-chart" title="Գործարքների քանակ" link-text="Մանրամասն" link-href="inout"> </container-top>
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
                            title="Ինկասացիաների քանակ"
                            value="${encashmentData.total_encashments}"
                            icon="icon icon-box"
                            show-border="true">
                        </info-card>
                        <info-card
                            title="Հետ բերված գումար"
                            value="${encashmentData.total_collected_amount}"
                            value-currency="֏"
                            value-color="color-green"
                            icon="icon icon-arrow-down-left"
                            show-border="true">
                        </info-card>
                        <info-card
                            title="Ինկասացիայի գումար"
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
            `;
    }
}

customElements.define("atms-dashboard", AtmsDashboard);
