import { DynamicElement } from '../core/dynamic-element.js';

class AtmAnaliticGeo extends DynamicElement {
    template() {
        return /* html */ `
            <div class="main-container">
                <div class="row">
                    <div class="column sm-12">
                        <h2 class="h2-font">Աշխարհագրական վերլուծություն</h2>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('atm-analitic-geo', AtmAnaliticGeo);

