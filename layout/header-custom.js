import { DynamicElement } from "../core/dynamic-element.js";
import { store } from "../core/store/store.js";
import "../components/ui/selectBox.js";
import locationTransformer from '../core/utils/location-transformer.js';

class HeaderCustom extends DynamicElement {
    constructor() {
        super();
        this.title = ''; // current known title
        this.province = [];
        this.cities = [];
    }

    onConnected() {
        console.log('header connected');
        const state = store.getState();

        this.province = state.regionsData.map(item => ({
            label: item.province,
            value: item.province
        }));

        this.cities = locationTransformer.getAllCityOptions(state.regionsData)
    }

    addGlobalEventListeners() {
        this.addListener(document,'route-title', (e) => {
            const newTitle = e.detail?.title || '';

            if (newTitle !== this.title) {
                this.title = newTitle;
                this._applyTitle();
            }
        })
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

    onAfterRender() {
        this._applyTitle();
    }

    _applyTitle(){
        const el = this.$('#title-text');
        if (!el) return;

        if (el.textContent !== this.title) {
            el.textContent = this.title;
        }
    }

    template() {
        console.log('header template');
        return /* html */ `
            <div class="main-container">
                <div class="row">
                    <div class="column sm-12">
                        <div class="header">
                            <div class="header__title">
                                <div id="title-text" class="h1-font"></div>
                            </div>
                            <div class="header__right">
                                <select-box id="city-selector" value="1" options='${JSON.stringify((this.cities))}'></select-box>
                                <select-box id="province-selector" value="all" options='[ {"value":"all","label":"Բոլոր համայնքները"}, {"value":"2","label":"Երևան"}]'></select-box>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define("header-custom", HeaderCustom);
