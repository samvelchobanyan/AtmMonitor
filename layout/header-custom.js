import { DynamicElement } from "../core/dynamic-element.js";
import { store } from "../core/store/store.js";
import "../components/ui/selectBox.js";
import locationTransformer from "../core/utils/location-transformer.js";

class HeaderCustom extends DynamicElement {
    constructor() {
        super();
        this.state = {
            hideClass: "",
            province: [],
            cities: [],
        };
        this.title = ""; // current known title
        // this.province = [];
        // this.cities = [];
    }

    onConnected() {
        console.log("header connected");
        const state = store.getState();

        this.province = state.regionsData.map((item) => ({
            label: item.province,
            value: item.province,
        }));
        this.province.unshift({
            label: "Ընտրել մարզը",
            value: null,
        });

        this.cities = locationTransformer.getAllCityOptions(state.regionsData);
        this.cities.unshift({
            label: "Ընտրել քաղաքը",
            value: null,
        });

        this.setState({
            province: this.province,
            cities: this.cities,
        });
    }

    addGlobalEventListeners() {
        this.addListener(document, "route-changed", (e) => {
            const { title, icon, route } = e.detail;

            // Update title
            if (title !== this.title) {
                this.title = title;
                this.icon = icon;
                this._applyTitle();
            }

            // Update visibility based on route
            const pathsToHide = [
                "/geo",
                "/cumulative",
                "/incassate",
                "/atms/",
                "/create-atm",
                "/failures",
            ];

            // check this way to detect atms detail page as well
            const newHideClass = pathsToHide.some(
                (path) => path === route || (path.endsWith("/") && route.startsWith(path))
            )
                ? "hide"
                : "";

            if (newHideClass !== this.state.hideClass) {
                this.state.hideClass = newHideClass;
                this.render();
            }
        });
    }

    addEventListeners() {
        this.addListener(this.$("#province-selector"), "change", (e) => {
            if (e.target.value !== null && e.target.value !== "null") {
                this.cities = locationTransformer.getCitiesByProvince(
                    store.getState().regionsData,
                    e.target.value
                );
            } else {
                this.cities = locationTransformer.getAllCityOptions(store.getState().regionsData);
            }
            this.cities.unshift({
                label: "Ընտրել քաղաքը",
                value: null,
            });

            store.setState({
                selectedRegion: e.target.value === "null" ? null : e.target.value,
            });
            this.setState({
                cities: this.cities,
            });
        });

        this.addListener(this.$("#city-selector"), "change", (e) => {
            store.setState({ selectedCity: e.target.value === "null" ? null : e.target.value });
        });
    }

    onAfterRender() {
        this._applyTitle();
    }

    _applyTitle() {
        const el = this.$("#title-text");
        if (!el) return;

        const iconHTML = this.icon ? `<a href='atms'> <i class="icon ${this.icon}"></i></a>` : "";
        const infoHTML = this.icon ? `<img src='assets/img/info.svg'/>` : "";

        const newHTML = `${iconHTML} ${this.title} ${infoHTML}`;

        if (el.innerHTML !== newHTML) {
            el.innerHTML = newHTML;
        }
    }

    template() {
        const state = store.getState();
        const hasIcon = this.icon != null;

        return /* html */ `
            <div class="main-container">
                <div class="row">
                    <div class="column sm-12">
                        <div class="header">
                            <div class="header__title">
                                <div id="title-text" class="h1-font"></div>
                            </div>
                            <div class="header__right ${this.state.hideClass}">
                                <select-box    
                                    id="province-selector" 
                                    placeholder="Ընտրել մարզը" 
                                    value="${state.selectedRegion}"
                                    options='${JSON.stringify(this.state.province)}'>
                                </select-box>
                                <select-box   
                                    id="city-selector" 
                                    placeholder="Ընտրել քաղաքը" 
                                    value="${state.selectedCity}"
                                    options='${JSON.stringify(this.state.cities)}'>
                                </select-box>
                            </div>

                                ${
                                    hasIcon
                                        ? `<div class="header__right">
                                            <div class="atm-item__status">
                                                <span></span>
                                            </div>
                                        </div>`
                                        : ""
                                } 
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define("header-custom", HeaderCustom);
