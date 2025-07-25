import { DynamicElement } from "../core/dynamic-element.js";
import "../components/dynamic/chartComponent.js";
import "../components/static/infoCard.js";
import "../components/ui/customTab.js";
import "../components/dynamic/simpleTable.js";
import "../components/dynamic/select-box.js";

class AtmFailures extends DynamicElement {
    constructor() {
        super();
    }

    template(){
        return `
            <div class="main-container">
                <div class="row">
                    <div class="column sm-12">
                        <div class="container">
                            <div class="header-row">
                            <container-top icon="icon-x-octagon" title="Ամենահաճախ փչացող 10 բանկոմատները"> </container-top>
                            <select-box 
                                value="${this.selectedPeriod}" 
                                options='[ 
                                  {"value":"today","label":"Այսօր"}, 
                                  {"value":"week","label":"Այս շաբաթ"}, 
                                  {"value":"custom","label":"Ամսաթվի միջակայք"} 
                                  ]'
                            >
                            </select-box>
                            </div>
                            <simple-table
                              data-source="/device-faults/summary?startDate=2025-06-01"
                              columns='["atm_and_address", "total_faults", "faults_summary"]'>
                            </simple-table>
                        </div>
                    </div>
              </div>
            </div>
        `;
    }
}

customElements.define("atm-failures", AtmFailures);