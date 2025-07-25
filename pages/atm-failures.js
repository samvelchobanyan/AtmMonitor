import { DynamicElement } from "../core/dynamic-element.js";
import "../components/dynamic/chartComponent.js";
import "../components/static/infoCard.js";
import "../components/ui/customTab.js";
import "../components/dynamic/simpleTable.js";

class AtmFailures extends DynamicElement {
    constructor() {
        super();
    }

    template(){
        return `
            <div class="main-container">
                <div class="row">
                    <simple-table
                      data-source="/device-faults/summary?startDate=2025-06-01"
                      columns='["atm_and_address", "total_faults", "faults_summary"]'>
                    </simple-table>
              </div>
            </div>
        `;
    }
}

customElements.define("atm-failures", AtmFailures);