import { DynamicElement } from "../core/dynamic-element.js";
import { store } from "../core/store/store.js";
import "../components/ui/selectBox.js";
import locationTransformer from "../core/utils/location-transformer.js";

class HeaderCustom extends DynamicElement {
    constructor() {
        super();
        this.state = {
            hideClass: "",
        };
        this.title = ""; // current known title
        this.province = [];
        this.cities = [];
    }

    onConnected() {
        console.log("header connected");
        const state = store.getState();

        this.province = state.regionsData.map((item) => ({
            label: item.province,
            value: item.province,
        }));

        this.cities = locationTransformer.getAllCityOptions(state.regionsData);
    }

    addGlobalEventListeners() {
        this.addListener(document, "route-title", (e) => {
            const newTitle = e.detail?.title || "";

            if (newTitle !== this.title) {
                this.title = newTitle;
                this._applyTitle();
            }
        });

        this.addListener(document, "route-title", (e) => {
            const newTitle = e.detail?.title || "";
            const currentPath = window.location.pathname;

            const pathsToHide = ["/ATM_monitor/geo", "/ATM_monitor/cumulative"];
            const newHideClass = pathsToHide.includes(currentPath) ? "hide" : "";

            let shouldRerender = false;

            if (newTitle !== this.title) {
                this.title = newTitle;
                shouldRerender = true;
            }

            if (newHideClass !== this.state.hideClass) {
                this.state.hideClass = newHideClass;
                shouldRerender = true;
            }

            if (shouldRerender) {
                this.render(); // re-run template with updated state
            }
        });
    }

    addEventListeners() {
        this.addListener(this.$("#province-selector"), "change", (e) => {
            store.setState({
                selectedRegion: e.target.value,
            });
        });

        this.addListener(this.$("#city-selector"), "change", (e) => {
            store.setState({ selectedCity: e.target.value });
        });
    }

    onAfterRender() {
        this._applyTitle();
    }

    _applyTitle() {
        const el = this.$("#title-text");
        if (!el) return;

        if (el.textContent !== this.title) {
            el.textContent = this.title;
        }
    }

    template() {
        // const path = window.location.pathname;
        // console.log(path);

        // const pathsToHide = ["/ATM_monitor/geo", "/ATM_monitor/cumulative"];
        // const hideClass = pathsToHide.includes(path) ? "hide" : "";
        return /* html */ `
            <div class="main-container">
                <div class="row">
                    <div class="column sm-12">
                        <div class="header">
                            <div class="header__title">
                                <div id="title-text" class="h1-font"></div>
                            </div>
                            <div class="header__right ${this.state.hideClass}">
                                <select-box   id="city-selector" placeholder="Ընտրել քաղաքը"
                
                                options='${JSON.stringify(this.cities)}'></select-box>
                                <select-box    id="province-selector"  placeholder="Ընտրել մարզը" options='${JSON.stringify(
                                    this.province
                                )}'></select-box>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define("header-custom", HeaderCustom);
