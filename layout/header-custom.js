import { DynamicElement } from "../core/dynamic-element.js";
import { store } from "../core/store/store.js";
import "../components/ui/selectBox.js";
import locationTransformer from '../core/utils/location-transformer.js';

class HeaderCustom extends DynamicElement {
    onConnected() {
        const state = store.getState();
        const regionsData = store.getState().regionsData;
        // console.log('✅ store from sidebar after appReady', state);
        this.province = regionsData.map(item => ({
            label: item.province,
            value: item.province
        }));
        this.cities = locationTransformer.getAllCityOptions(regionsData)

        // console.log('province from header',this.province, this.cities)
    }

    addEventListeners() {
        this.addListener(this.$('#province-selector'), 'change', e => {
            store.setState({
                selectedRegion: e.target.value
            })
        })

        this.addListener(this.$('#city-selector'), 'change', e => {
            store.setState({selectedCity: e.target.value})
        })
    }

    template() {
        return /* html */ `
            <div class="main-container">
                <div class="row">
                    <div class="column sm-12">
                        <div class="header">
                            <div class="header__title">
                                <div class="h1-font">Ակնարկ</div>
                            </div>
                            <div class="header__right">
                                <select-box id="province-selector" value="1" options='${JSON.stringify((this.cities))}'></select-box>
                                <select-box id="city-selector" value="all" options='[ {"value":"all","label":"Բոլոր համայնքները"}, {"value":"2","label":"Երևան"}]'></select-box>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define("header-custom", HeaderCustom);
