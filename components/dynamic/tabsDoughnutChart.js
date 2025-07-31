import "./doughnutChart.js";
import "../ui/customRadio.js";
import { DynamicElement } from "../../core/dynamic-element.js";

const observedAttrs = ["summary", "tabsinfo", "id"];

class TabsDoughnutChartComponent extends DynamicElement {
    constructor() {
        super();

        this.id = this.getAttribute("id") || null;
        this.tabsInfo = this.getAttribute("tabsinfo") || null;
        this.summary = JSON.parse(this.getAttribute("summary")) || null;
    }

    static get observedAttributes() {
        return observedAttrs;
    }

    onConnected() {
        this.render();
        console.log("CONNECTED");
    }

    updateDepositCharts(type) {
        const chartAmount = this.querySelector("#deposit-amount");
        const chartCount = this.querySelector("#deposit-count");

        if (chartAmount && chartCount) {
            chartAmount.setAttribute("activetab", type);
            chartCount.setAttribute("activetab", type);
        }
    }

    // updateDispenseCharts(type) {
    //     const chartAmount = this.querySelector("#dispence-amount");
    //     const chartCount = this.querySelector("#dispence-count");

    //     if (chartAmount && chartCount) {
    //         console.log("new type", type);

    //         chartAmount.setAttribute("activetab", type);
    //         chartCount.setAttribute("activetab", type);
    //     }
    // }

    onAfterRender() {
        this.addEventListener("change", (e) => {
            if (e.target.matches('custom-radio[name="cash-in"]')) {
                const selected = e.target.getAttribute("value");
                this.updateDepositCharts(selected);
            }
            // else if (e.target.matches('custom-radio[name="cash-out"]')) {
            //     console.log("click");

            //     const selected = e.target.getAttribute("value");
            //     this.updateDispenseCharts(selected);
            // }
        });
    }
    template() {
        if (!this.summary) {
            return /*html*/ `
            <div class="main-container">
                <div class="row">
                    <div class="column sm-12">
                        <div class="loading">
                            <div class="loading__spinner spinner"></div>
                            <div class="loading__text">Տվյալները բեռնվում են…</div>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }

        let propName = `${this.id}_summary`;

        console.log("propName", propName);
        console.log(this.summary);

        const data = this.summary;
        console.log("!!data", data);
        const safeData = JSON.stringify(data).replace(/"/g, "&quot;");

        return /*html*/ `
            <div class="main-container">
    <div class="radio-buttons ">
                    <custom-radio name="cash-out" value="with_without_card" checked>Քարտով / Անքարտ</custom-radio>
                    <custom-radio name="cash-out" value="by_method">Ըստ վճարային համակարգի</custom-radio>
                    <custom-radio name="cash-out" value="own_other_card">Սեփական քարտ / Այլ քարտ</custom-radio>
                </div> 
                <div class="chart-container">
                  <doughnut-chart id="dispence-amount" title='${data.dispense_amount}' percentChange="${data.dispense_amount_percent_change}" initData="${safeData}" type='amount' activetab="with_without_card"></doughnut-chart>
                  <doughnut-chart id="dispence-count" title='${data.dispense_count}'  percentChange="${data.dispense_count_percent_change}" initData="${safeData}" type='count' activetab="with_without_card"></doughnut-chart>
                </div>
              </div>      
                  
         
        `;
    }
}

customElements.define("tabs-doughnut-chart", TabsDoughnutChartComponent);
