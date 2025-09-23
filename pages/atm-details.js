import { DynamicElement } from "../core/dynamic-element.js";
import "../components/ui/infoItem.js";
import "../components/dynamic/chartComponent.js";
import "../components/dynamic/doughnutTabs.js";
import encode from "../assets/js/utils/encode.js";
import "../components/ui/atmItem.js";
import "../components/ui/infoItem.js";
import "../components/dynamic/simpleTable.js";
import formatDate from "../core/utils/date-transformer.js";

class AtmDetails extends DynamicElement {
    constructor() {
        super();

        this.state = {
            summary: null,
        };
        this.atmId = "";
    }

    onConnected() {
        // const pathParts = window.location.pathname.split("/").filter(Boolean);
        // this.atmId = pathParts[pathParts.length - 1];
        // this.fetchAtm();
    }

    onAfterRender() {
        const pathParts = window.location.pathname.split("/").filter(Boolean);
        this.atmId = pathParts[pathParts.length - 1];

        if (this.state.summary == null) {
            this.fetchAtm();
        }
    }

    addEventListeners() {
        const dateSelector = this.$("select-box-date");
        const table = this.$("simple-table");

        if (dateSelector && table) {
            this.addListener(dateSelector, "date-range-change", (e) => {
                const { startDate, endDate } = e.detail;
                const newSource = `/encashment/summary?startDate=${startDate}&endDate=${endDate}&atmId=${this.atmId}`;
                // update table src
                table.setAttribute("data-source", newSource);
            });
        }
    }

    async fetchAtm() {
        const id = parseInt(this.atmId, 10);

        console.log("this.atmId", this.atmId);
        console.log("id", id);

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

    // formatDate(dateString) {
    //   const date = new Date(dateString); // parse ISO

    //   const day = String(date.getDate()).padStart(2, '0');
    //   const month = String(date.getMonth() + 1).padStart(2, '0'); // months start at 0
    //   const year = date.getFullYear();

    //   const hours = String(date.getHours()).padStart(2, '0');
    //   const minutes = String(date.getMinutes()).padStart(2, '0');

    //   return `${day}/${month}/${year} ${hours}:${minutes}`;
    // }

    _transformToTransactionDynamics(data) {
        const { dispense_dynamic, deposit_dynamic, exchange_dynamic } = data;

        // Create the transactionDynamics array by mapping over exchange_dynamic.hourly_data
        const transactionDynamics = exchange_dynamic.hourly_data.map((exchangeItem) => {
            const hour = exchangeItem.hour;

            // Find corresponding to dispense data for this hour
            const dispenseItem = dispense_dynamic.hourly_data.find((item) => item.hour === hour);
            const dispenseAmount = dispenseItem
                ? dispenseItem.with_card_amount + dispenseItem.without_card_amount
                : 0;

            // Find the corresponding deposit data for this hour
            const depositItem = deposit_dynamic.hourly_data.find((item) => item.hour === hour);
            const depositAmount = depositItem
                ? depositItem.with_card_amount + depositItem.without_card_amount
                : 0;

            return {
                hour: hour,
                dispense_amount: dispenseAmount,
                deposit_amount: depositAmount,
                exchange_amount: exchangeItem.amount,
            };
        });

        return transactionDynamics;
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

        const data = this.state.summary;

        const dispenseData = encode(data.transactions_summary.dispense_summary);
        const depositData = encode(data.transactions_summary.deposit_summary);
        const exchangeData = data.transactions_summary.exchange_summary.currency_details;
        const nominalList = data.balance_info.cassettes.filter((c) => c.nominal === 0);
        const modelList = data.balance_info.cassettes.filter((c) => c.nominal !== 0);

        const transactionDynamics = encode(
            this._transformToTransactionDynamics(data.transactions_summary.transaction_dynamics)
        );

        const devicesData = data.devices;
        const atmWorkHours = data.atm_work_hours;

        return /*html*/ `
            <div class="row">
                <div class="column sm-12">
                   <div class="container">
                    <container-top icon="icon-bar-chart" title="Բանկոմատում առկա գումար"> </container-top>
                    <div class="row">
                        <div class="column sm-6">
                            <div class="infos infos_margin">
                                <info-card title="Մնացորդ" value="250108500" value-currency="֏" value-color="color-green" trend="7" show-border="true"> </info-card>
                            </div>
                            <chart-component id="bar-chart-1" chart-data="${encode(
                                nominalList
                            )}" chart-type="bar" show-date-selector="false" stacked></chart-component>
                        </div>
                        <div class="column sm-6">
                            <div class="infos infos_margin">
                                <info-card
                                    title="Վերջին ինկասացիա (${formatDate(
                                        data.balance_info.last_encashment_date
                                    )})"
                                    value="${data.balance_info.last_encashment_amount}"
                                    value-currency="֏"
                                    value-color="color-blue"
                                    show-border="true"
                                    button-text="Մանրամասն"
                                >
                                </info-card>
                            </div>
                            <chart-component id="bar-chart-2" chart-data="${encode(
                                modelList
                            )}" chart-type="bar" show-date-selector="false" stacked></chart-component>
                        </div>
                    </div>

                    </div>
                    </div>
                <div class="column sm-12">
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
                           <container-top icon="icon-dollar-sign" title="Արտարժույթի փոխանակում"></container-top>
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
                                       show-border="true"></info-card>`;
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
                            chart-data='${transactionDynamics}' 
                            api-url="/analytics/exchange-dynamic-in-days" 
                            ${this.attrIf("city", this.state.currentCity)} 
                            ${this.attrIf("region", this.state.currentRegion)}> </chart-component>
                    </div>
                </div>

                 
                 <div class="row">
            <div class="column sm-6">
                <div class="container">
                    <container-top icon="icon-cpu" title="Սարքավորումներ"> </container-top>
                    <div class="info-items">
                    ${devicesData
                        .map((device) => {
                            return `<info-item text="${device.device_type}" data-working="${
                                device.status == 1 ? true : false
                            }"></info-item>`;
                        })
                        .join("")}
                    </div>
                </div>
            </div>
            <div class="column sm-6">
                <div class="container">
                    <container-top icon="icon-trello" title="Արտադրողականություն"> </container-top>
                    <div class="infos infos_margin">
                       <info-card
                            title="Աշխատաժամանակ"
                            value="${atmWorkHours.work_hours_per_day[0].working_percent}%"
                            icon="icon icon-clock"
                            show-border="true"></info-card>
                        <info-card
                            title="Խափանում"
                            value="${atmWorkHours.work_hours_per_day[0].non_working_percent}%"
                            icon="icon icon-clock"
                            show-border="true"></info-card>
                    </div>
                    <div class="info-items-container">
                        <div class="info-items info-items_col">
                         <info-item text="Վերջին Disconnect" value="${formatDate(
                             atmWorkHours.last_disconnect
                         )}"></info-item>
                            <info-item text="Վերջին Connect"  value="${formatDate(
                                atmWorkHours.last_connect
                            )}"></info-item>
                        </div> 
                        <div class="info-items">
                            <info-item text="Վերջին ստատուսի տևողություն" value="${
                                atmWorkHours.last_status_duration
                            }"></info-item>
                        </div>


                        <chart-component
                            id="bar-chart"
                            api-url="/dashboard/atm-worktime-in-days"
                            atm-id="${this.atmId}"
                            chart-type="bar">
                        </chart-component>
                    </div>

                    </div>  
                </div>
            </div>

           <div class="column sm-12">
            <div class="container">
                <div class="select-container">
                <container-top icon="icon-coins" title="Ինկասացիաներ"></container-top>
                <select-box-date
                    start-date="${this.getAttr("start-date")}"
                    end-date="${this.getAttr("end-date")}"
                ></select-box-date>
                </div> 

                <div class="col sm-6">
                <div class="row infos infos_margin">
                    <info-card title="Չկատարված գործարքների գումար" value="250,108,500֏" show-border="true"></info-card>
                    <info-card title="Չկատարված գործարքների քանակ" value="410" show-border="true"></info-card>
                </div>
                </div>

                <simple-table
                data-source="/encashment/summary?startDate=2025-06-01&&atmId=${this.atmId}"
                columns='["date_time", "atm_address", "added_amount", "collected_amount", "marked_as_empty"]'
                clickable-columns='["added_amount"]'>
                </simple-table>
            </div> 
            </div>
        `;
    }
}

customElements.define("atm-details", AtmDetails);
