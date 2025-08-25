import { DynamicElement } from "../core/dynamic-element.js";
import "../components/ui/infoItem.js";
import "../components/dynamic/chartComponent.js";
import "../components/dynamic/doughnutTabs.js";
import encode from "../assets/js/utils/encode.js";

class AtmDetails extends DynamicElement {
    constructor() {
        super();

        this.state = {
            summary: null,
        };
        this.atmId = "";
    }

    onConnected() {
        const pathParts = window.location.pathname.split("/").filter(Boolean);
        this.atmId = pathParts[pathParts.length - 1];

        this.fetchAtm();
    }

    onAfterRender() {}

    addEventListeners() {}

    async fetchAtm() {
        const id = parseInt(this.atmId, 10);
        try {
            const response = await this.fetchData(`/atm/my-profile?atmId=${id}`);
            this.setState({
                summary: response.data,
            });
        } catch (err) {
            console.error("❌ Error fetching summary:", err);
            this.setState({ summary: null });
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString); // parse ISO

        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0"); // months start at 0
        const year = date.getFullYear();

        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");

        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }

    template() {
        console.log(this.state.summary);

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

        const data = this.state.summary;

        const dispenseData = encode(data.transactions_summary.dispense_summary);
        const depositData = encode(data.transactions_summary.deposit_summary);
        const exchangeData = data.transactions_summary.exchange_summary.currency_details;
        const nominalList = data.balance_info.cassettes.filter((c) => c.nominal === 0);
        const modelList = data.balance_info.cassettes.filter((c) => c.nominal !== 0);

        return /*html*/ `
            <div class="row">
                <div class="column">
                   <div class="container">
                    <container-top icon="icon-bar-chart" title="Բանկոմատում առկա գումար"> </container-top>
                    <div class="row">
                        <div class="column sm-6">
                            <div class="infos infos_margin">
                                <info-card
                                    title="Մնացորդ"
                                    value="250108500"
                                    value-currency="֏" value-color="color-green"
                                    trend="7"
                                    show-border="true">
                                </info-card>
                            </div>
                                <chart-component
                                    id="bar-chart-1"
                                    chart-data='${encode(nominalList)}'
                                    chart-type="bar"
                                    show-date-selector='false'
                                    stacked></chart-component>
                        </div>
                        <div class="column sm-6">
                            <div class="infos infos_margin">
                                <info-card
                                    title="Վերջին ինկասացիա (${this.formatDate(
                                        data.balance_info.last_encashment_date
                                    )})"
                                    value="${data.balance_info.last_encashment_amount}"
                                    value-currency="֏" value-color="color-blue"
                                    show-border="true"
                                    button-text="Մանրամասն">
                                </info-card>
                            </div>
                            <chart-component
                                id="bar-chart-2"
                                chart-data='${encode(modelList)}' 
                                chart-type="bar"
                                show-date-selector='false'
                                stacked></chart-component>
                        </div>
                    </div>

                    </div>
                    <div class='row'>
                    <div class="column sm-6">
                       <div class="container">
                           <doughnut-tabs id="dispense" data="${dispenseData}" show-date="false" title="Կանխիկացում"></doughnut-tabs>
                       </div>
                   </div>
                   <div class="column sm-6">
                   <div class="container">
                   <doughnut-tabs id="deposit" data="${depositData}" show-date="false"  title="Մուտքագրում"></doughnut-tabs>
                   </div>
                   </div>
                   </div>
                   <div class="column sm-12">
                       <div class="container">
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
                                       show-border="true"/>`;
                                   })
                                   .join("")}
                           </div>
                         </div>
                    </div>

                 
                
            </div>
        `;
    }
}

customElements.define("atm-details", AtmDetails);
