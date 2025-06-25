import { StaticElement } from "../core/static-element.js";
import '../components/ui/selectBox.js'


class HeaderCustom extends StaticElement {
    render() {
        return /*html*/`
        <div class="main-container"> 
            <div class="row">
                <div class="column sm-12">
                    <div class="header">
                        <div class="header__title">
                            <div class="h1-font"> Ակնարկ </div>
                        </div>
                        <div class="header__right">
                            <select-box></select-box>
                            <div class="custom-select">
                                <div class="combo-box" data-combo-name="single" data-combo-value="all">
                                    <div class="combo-box-selected">
                                        <div class="combo-box-selected-wrap">
                                            <span class="combo-box-placeholder">Բոլոր համայնքները</span>
                                        </div>
                                    </div>
                                    <div class="combo-box-dropdown">
                                        <div class="combo-box-options">
                                            <div class="combo-option selected" data-option-value="all">
                                                <span>Բոլոր համայնքները</span>
                                            </div>
                                            <div class="combo-option" data-option-value="1" >
                                                <span>Երևան</span>
                                            </div>
                                            <div class="combo-option" data-option-value="2">
                                                <span>Սյունիք</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    }
}

customElements.define("header-custom", HeaderCustom);
