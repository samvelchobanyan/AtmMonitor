import { DynamicElement } from "../core/dynamic-element.js";
import "../components/dynamic/chartComponent.js";
import "../components/static/infoCard.js";
import "../components/ui/customTab.js";
import "../components/dynamic/doughnutChart.js";

class inOut extends DynamicElement {
    constructor() {
        super();
    }

    template(){
        return `
            <div class="main-container">
                <div class="row">
                    <div class="column sm-6">
                        <div class="container">
                             <container-top icon="icon-arrow-down-left" title="Կանխիկացում"> </container-top>
                            <div class="tabs">
                                <custom-tab name="language" active>English</custom-tab>
                                <custom-tab name="language">Հայերեն</custom-tab>
                            </div> 
                           <doughnut-chart id="finance-chart"></doughnut-chart>
                        </div>
                    </div>
                    <div class="column sm-6">
                        <div class="container">
                             <container-top icon="icon-arrow-down-left" title="Կանխիկացում"> </container-top>
                            <div class="tabs">
                                <custom-tab name="language" active>English</custom-tab>
                                <custom-tab name="language">Հայերեն</custom-tab>
                            </div> 
                           <doughnut-chart id="finance-chart1"></doughnut-chart>
                        </div>
                    </div>
              </div>
            </div>
        `;
    }
}

customElements.define("in-out", inOut);