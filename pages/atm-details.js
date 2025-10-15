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
        this.exchangeDateBox = null;
        this.encashmentDateBox = null;
        this.depositChart = null;
        this.worktimeChart = null;
    }

    onConnected() {
        this.atmId = this.getAttribute("id");
        this.fetchAtm();
        this.fetchFailedEncashments();
    }

    onAfterRender() {
        this.exchangeDateBox = this.$("#exchange-date");
        this.encashmentDateBox = this.$("#encashment-date");
        this.depositChart = this.$("#bar-chart-2");
        this.worktimeChart = this.$("#worktime-bar-chart");
    }

    addEventListeners() {
        this.encashmentChanges();
        this.workTimeChanges();

        this.showDepositPopups();

        if (this.exchangeDateBox) {
            this.addListener(this.exchangeDateBox, "date-range-change", (e) => {
                const { startDate, endDate } = e.detail;
                this.fetchExchangeData(startDate, endDate);
            });
        }
    }

    showDepositPopups() {
        if (this.depositChart) {
            this.addListener(this.depositChart, "chart-bar-clicked", (e) => {
                let label = e.detail.columnLabel.substring(0, e.detail.columnLabel.indexOf("-"));

                let link = "";
                if (label == "DC") {
                    link = "/atm/deposit-cassette-contents";
                } else if (label == "RJ1") {
                    link = "/atm/reject-cassette-contents";
                } else if (label == "RJ2") {
                    link = "/atm/retract-cassette-contents";
                }

                const labelName = e.detail.columnLabel.replace(/[^A-Za-z]/g, "");
                console.log("labelName", labelName);

                if (link) this.fetchPopUpData(link, labelName);
            });
        }
    }

    workTimeChanges() {
        if (this.worktimeChart) {
            this.addListener(this.worktimeChart, "chart-changed", (e) => {
                // console.log('!!!', e.detail);
                let data = e.detail.data;
                let atmWorkingPercent = this.$("#atm_working_percent");
                let atmNonWorkingPercent = this.$("#atm_non_working_percent");
                let atmLastDisconnect = this.$("#atm_last_disconnect");
                let atmLastConnect = this.$("#atm_last_connect");
                let atmLastStatusDuration = this.$("#atm_last_status_duration");

                if (atmWorkingPercent)
                    atmWorkingPercent.setAttribute("value", `${data.total_working_percent}%`);

                if (atmNonWorkingPercent)
                    atmNonWorkingPercent.setAttribute(
                        "value",
                        `${data.total_non_working_percent}%`
                    );

                if (atmLastDisconnect)
                    atmLastDisconnect.setAttribute("value", formatDate(data.last_disconnect));

                if (atmLastConnect)
                    atmLastConnect.setAttribute("value", formatDate(data.last_connect));

                if (atmLastStatusDuration)
                    atmLastStatusDuration.setAttribute("value", data.last_status_duration);
            });
        }
    }

    encashmentChanges() {
        if (this.encashmentDateBox) {
            this.addListener(this.encashmentDateBox, "date-range-change", (e) => {
                const { startDate, endDate } = e.detail;
                let link = `/encashment/summary?atmId=${this.atmId}&startDate=${startDate}&endDate=${endDate}`;
                this.$("simple-table").setAttribute("data-source", link);
                this.fetchFailedEncashments();
            });
        }
    }

    async fetchExchangeData(startDate, endDate) {
        const response = await this.fetchData(
            `/analytics/exchange-summary-in-days?startDate=${startDate}&endDate=${endDate}&atmId=${this.atmId}`
        );
        const currencies = response.data.currency_details;

        currencies.forEach((currency) => {
            const el = this.$(`#${currency.currency_code}`);
            if (el) {
                el.setAttribute("value", currency.total_amount);
                el.setAttribute("trend", currency.total_amount_percent_change);
            }
        });
    }

    async fetchPopUpData(link, popUpName) {
        const response = await this.fetchData(`${link}?atmId=${this.atmId}`);
        const data = response.data?.totals;
        if (data) {
            this.openPopUp(data, popUpName);
        } else {
            console.log("noo info!");
        }
    }

    // todo ask Aram which one RJ is which title
    openPopUp(data, name) {
        const modal = document.createElement("modal-popup");
        document.body.appendChild(modal);

        const cards = data
            .map(
                (item) => `
            <info-card
                title="${item.currency}"
                value="${item.amount}"
                show-border="true"
            ></info-card>
        `
            )
            .join("");
        modal.setContent(`
            <div class="modal__header">
                <div class="modal__title">${name}</div>
                <img class="modal__close" src="assets/img/icons/x-circle.svg" alt="" />
            </div>
            <div class="modal__chart">
                     ${cards}
            </div>
        
       
        `);

        // Add close button listener
        const closeBtn = modal.querySelector(".modal__close");
        closeBtn?.addEventListener("click", () => modal.remove());
    }

    async fetchAtm() {
        const today = new Date().toISOString().split("T")[0];

        try {
            const response = await this.fetchData(
                `/atm/my-profile?atmId=${this.atmId}&StartDate=${today}`
            );

            this.setState({
                summary: response.data,
            });

            let statusEl = document.querySelector(".atm-item__status");

            const isWorking = response.data.connection_status_id == "1";
            const status = isWorking ? "Աշխատող" : "Չաշխատող";
            const statusClass = isWorking
                ? "atm-item__status_working"
                : "atm-item__status_not-working";
            if (statusEl) {
                // update the class
                statusEl.className = `atm-item__status ${statusClass || ""}`;

                // update the text inside the span
                const span = statusEl.querySelector("span");
                if (span) {
                    span.textContent = status || "";
                }
            }
        } catch (err) {
            console.error("❌ Error fetching summary:", err);
            this.setState({ summary: null });
        }
    }

    async fetchFailedEncashments() {
        try {
            const response = await this.fetchData(`/encashment/failed-transactions`);

            const data = response.data;

            const failedCount = this.$("#failed-count");
            const failedAmount = this.$("#failed-amount");
            if (failedCount) {
                failedCount.setAttribute("value", data.failed_transactions_count);
            }
            if (failedAmount) {
                failedAmount.setAttribute("value", data.failed_transactions_amount);
            }
        } catch (err) {
            console.error("❌ Error fetching failed incashments:", err);
            // this.setState({ summary: null });
        }
    }

    getCassetteDifferences(before, after) {
        const result = [];

        after.forEach((afterCassette) => {
            const beforeCassette = before.find(
                (b) => b.cassette_name === afterCassette.cassette_name
            );

            // Determine count difference
            const countDiff = afterCassette.count - (beforeCassette?.count || 0);

            // Extract the numeric part from the cassette name (e.g. "RECYCLE 10000" → 10000)
            const match = afterCassette.cassette_name.match(/\d+/);
            if (!match) return;
            const banknoteName = match ? Number(match[0]) : afterCassette.cassette_name;
            result.push({
                banknot_name: banknoteName,
                count: countDiff,
                result: banknoteName * countDiff,
            });
        });

        return result;
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

        const balanceInfo = data.balance_info;
        const nominalList = balanceInfo.cassettes.filter((c) => c.nominal === 0);
        const modelList = balanceInfo.cassettes.filter((c) => c.nominal !== 0);

        const transactionDynamics = encode(
            data.transactions_summary.transaction_dynamics.overall_dynamic.hourly_data
        );

        const incData =
            data.encashments_summary.encashments.length === 0
                ? 0
                : encode(
                      this.getCassetteDifferences(
                          data.encashments_summary.encashments[0].cassettes_before,
                          data.encashments_summary.encashments[0].cassettes_after
                      )
                  );

        const devicesData = data.devices;
        const atmWorkHours = data.atm_work_hours;

        return /*html*/ `
          <div class="row align-middle" style="margin-bottom: 16px;">
            <div class="column shrink" style="margin-right: 16px;">
              <span class="atm-item__label">Քաղաք՝</span>
              <span class="atm-item__value">${balanceInfo.city}</span>
            </div>

            <div class="column shrink" style="margin-right: 16px;">
              <span class="atm-item__label">Համայնք՝</span>
              <span class="atm-item__value">${balanceInfo.district}</span>
            </div>

            <div class="column shrink">
              <span class="atm-item__label">Հասցե՝</span>
              <span class="atm-item__value">${balanceInfo.address}</span>
            </div>
          </div>

            <div class="row">
                <div class="column sm-12">
                   <div class="container">
                    <container-top icon="icon-bar-chart" title="Բանկոմատում առկա գումար"> </container-top>
                    <div class="row">
                        <div class="column sm-6">
                            <div class="infos infos_margin">
                                <info-card title="Մնացորդ" value="${
                                    data.balance_info.total_balance
                                }" value-currency="֏" value-color="color-green" trend="7" show-border="true"> </info-card>
                            </div>
                            <chart-component id="bar-chart-1" chart-data="${encode(
                                modelList
                            )}" chart-type="bar" show-date-selector="false" stacked = false></chart-component>
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
                                    incashment-data='${incData}'
                                >
                                </info-card>
                            </div>
                            <chart-component id="bar-chart-2" chart-data="${encode(
                                nominalList
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
                        <div class="select-container">
                           <container-top icon="icon-dollar-sign" title="Արտարժույթի փոխանակում"></container-top>
                            <select-box-date id='exchange-date'></select-box-date>
                        </div>
                           <div class="infos">
                               ${exchangeData
                                   .map((exchange) => {
                                       return `
                                   <info-card
                                       id="${exchange.currency_code}"  
                                       title="${exchange.currency_code}"
                                       value="${exchange.total_amount}"
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
                            api-url="/analytics/transactions-dynamic-in-days?atmIds=${this.atmId}" 
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
                            id= 'atm_working_percent'
                            value="${atmWorkHours.work_hours_per_day[0].working_percent}%"
                            icon="icon icon-clock"
                            show-border="true"></info-card>
                        <info-card
                            title="Խափանում"
                            id= 'atm_non_working_percent'
                            value="${atmWorkHours.work_hours_per_day[0].non_working_percent}%"
                            icon="icon icon-clock"
                            show-border="true"></info-card>
                    </div>
                    <div class="info-items-container">
                        <div class="info-items info-items_col">
                         <info-item text="Վերջին Disconnect" id='atm_last_disconnect' value="${formatDate(
                             atmWorkHours.last_disconnect
                         )}"></info-item>
                            <info-item text="Վերջին Connect" id='atm_last_connect' value="${formatDate(
                                atmWorkHours.last_connect
                            )}"></info-item>
                        </div> 
                        <div class="info-items">
                            <info-item text="Վերջին ստատուսի տևողություն" id='atm_last_status_duration' value="${
                                atmWorkHours.last_status_duration
                            }"></info-item>
                        </div>


                        <chart-component
                            id="worktime-bar-chart"
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
                    id="encashment-date"
                    start-date="${this.getAttr("start-date")}"
                    end-date="${this.getAttr("end-date")}"
                ></select-box-date>
                </div> 

                <div class="col sm-6">
                <div class="row infos infos_margin">
                    <info-card id='failed-amount' title="Չկատարված գործարքների գումար" show-border="true"></info-card>
                    <info-card id='failed-count' title="Չկատարված գործարքների քանակ" show-border="true"></info-card>
                </div>
                </div>

                <simple-table
                searchable="false"
                data-source="/encashment/summary?atmId=${this.atmId}"
                columns='["date_time", "atm_address", "added_amount", "collected_amount", "marked_as_empty"]'
                column-labels='{"date_time":"Ամսաթիվ և ժամ","atm_address":"Բանկոմատի հասցե",
                "added_amount":"Ավելացած գումար","collected_amount":"Հավաքված գումար","marked_as_empty":"Դատարկ"}'
                clickable-columns='["added_amount"]'>
                </simple-table>
            </div> 
            </div>
        `;
    }
}

customElements.define("atm-details", AtmDetails);
