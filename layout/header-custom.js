import { StaticElement } from "../core/static-element.js";
import "../components/ui/selectBox.js";

class HeaderCustom extends StaticElement {
    render() {
        return /* html */ `
            <div class="main-container">
                <div class="row">
                    <div class="column sm-12">
                        <div class="header">
                            <div class="header__title">
                                <div class="h1-font">Ակնարկ</div>
                            </div>
                            <div class="header__right">
                                <select-box value="1" options='[ {"value":"1","label":"Երևան"}, {"value":"2","label":"Գորիս"}, {"value":"3","label":"Գյումրի"} ]'></select-box>
                                <select-box value="all" options='[ {"value":"all","label":"Բոլոր համայնքները"}, {"value":"2","label":"Երևան"}]'></select-box>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define("header-custom", HeaderCustom);
