import { DynamicElement } from "../core/dynamic-element.js";
import "../components/dynamic/chartComponent.js";
import "../components/dynamic/infoCard.js";
import "../components/ui/customTab.js";
import "../components/dynamic/simpleGrid.js";
import "../components/dynamic/select-box.js";
import "../components/dynamic/select-box-date.js";

class AtmFailures extends DynamicElement {
    constructor() {
        super();
    }

    addEventListeners() {
        this.$("simple-grid")?.addEventListener("cell-click", (e) => {
            const { column, cellValue, rowData } = e.detail;
            // Open popup or do something with the data
            console.log("cellValue", column, cellValue, rowData);
        });
    }

    template() {
        return  /*html*/ `
            <div class="row">
                <div class="column sm-12">
                    <div class="container">
                        <div class="select-container">
                            <container-top icon="icon-x-octagon" title="Ամենահաճախ փչացող 10 բանկոմատները"> </container-top>
                            <select-box-date
                                start-date="${this.getAttr("start-date")}"
                                end-date="${this.getAttr("end-date")}"
                            ></select-box-date>
                        </div>  
                        <simple-grid
                            data-source="/device-faults/summary?startDate=2025-06-01"
                            columns='["atm_and_address", "total_faults", "faults_summary"]'
                            clickable-columns='["faults_summary"]'
                            mode="client"
                            per-page="10"
                            sort="true"
                            search="true">
                        </simple-grid>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define("atm-failures", AtmFailures);
