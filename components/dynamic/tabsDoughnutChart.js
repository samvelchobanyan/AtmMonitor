import "./doughnutChart.js";
import "../ui/customRadio.js";
import { DynamicElement } from "../../core/dynamic-element.js";

class TabsDoughnutChartComponent extends DynamicElement {
    constructor() {
        super();

        this.id = this.getAttribute("id") || null;
        this.tabsInfo = JSON.parse(this.getAttribute("tabsinfo")) || null;
        this.summary = JSON.parse(this.getAttribute("summary")) || null;
    }

    static get observedAttributes() {
        return ["summary", "tabsinfo", "id"];
    }

    onConnected() {
        this.render();
    }

    updateCharts(type) {
        // update both amount and count charts' active tab attribute, to use diff data
        const chartAmount = this.querySelector(`#${this.id}-amount`);
        const chartCount = this.querySelector(`#${this.id}-count`);

        if (chartAmount && chartCount) {
            chartAmount.setAttribute("activetab", type);
            chartCount.setAttribute("activetab", type);
        }
    }

    onAfterRender() {
        this.addEventListener("change", (e) => {
            if (e.target.tagName.toLowerCase() === "custom-radio") {
                const selected = e.target.getAttribute("value");
                this.updateCharts(selected);
            }
        });
    }
    template() {
        if (!this.summary) {
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


        const data = this.summary;
        const safeData = JSON.stringify(data).replace(/"/g, "&quot;");

        const radiosHtml = Object.entries(this.tabsInfo).map(([key, label], index) => {
                return /*html*/ `<custom-radio 
                                    name="cash-out" 
                                    value="${key}" 
                                    ${index === 0 ? "checked" : ""}
                                 >
                                    ${label}
                                 </custom-radio>
                                `;
                })
                .join("");
            
        return /*html*/ `
            <div>
                <div class="radio-buttons ">
                ${radiosHtml}
                   
                </div> 
                <div class="chart-container">
                  <doughnut-chart id="${this.id}-amount" title="${
            data[`${this.id}_amount`]
        }"  percentChange="${
            data[`${this.id}_amount_percent_change`]
        }"  initData="${safeData}" type='amount' activetab="with_without_card"></doughnut-chart>
                  <doughnut-chart 
                    id="${this.id}-count" title="${data[`${this.id}_count`]}"   
                    percentChange="${data[`${this.id}_count_percent_change`]}"  
                    initData="${safeData}" 
                    type='count' 
                    activetab="with_without_card">
                    </doughnut-chart>
                </div>
              </div>      
                  
         
        `;
    }
}

customElements.define("tabs-doughnut-chart", TabsDoughnutChartComponent);
