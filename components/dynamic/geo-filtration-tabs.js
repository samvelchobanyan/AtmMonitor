import { DynamicElement } from "../../core/dynamic-element.js";
import locationTransformer from "../../core/utils/location-transformer.js";
import { store } from "../../core/store/store.js";
import "./doughnutTabs.js";
import "../ui/customTab.js";
import "./select-box-search.js";
import "../ui/customCheck.js";
import "./segment.js";
import "./select-box-date.js";
import encode from "../../assets/js/utils/encode.js";

class GeoFiltrationTabs extends DynamicElement {
    constructor() {
        super();
        this.state = {
            atmsList: [],
            province: [],
            cities: [],
        };

        this.currentCity = null;
        this.currentRegion = null;
        this.startDate = null;
        this.endDate = null;

        this.province = [];
        this.cities = [];

        this.selectCityBox = null;
        this.selectRegionBox = null;
        this.selectAtmsBox = null;
        this.submitButtons = null;
        this.dateSelector = null;
        this.segmentsBlock = null;

        this.activeTab = "geo";
    }

    onConnected() {
        const state = store.getState();

        const province = [
            { label: "Ընտրել մարզը", value: null },
            ...state.regionsData.map((item) => ({
                label: item.province,
                value: item.province,
            })),
        ];

        const cities = [
            { label: "Ընտրել քաղաքը", value: null },
            ...locationTransformer.getAllCityOptions(state.regionsData),
        ];

        this.setState({ province, cities });

        if (!this.state.atmsList.length) {
            this.fetchAtms();
        }
    }

    onAfterRender() {
        this.selectCityBox = this.$("#city-selector");
        this.selectRegionBox = this.$("#province-selector");
        this.submitButtons = this.$$(".submit-button");
        this.selectAtmsBox = this.$("#atms-search");
        this.dateSelector = this.$("#date-selector");
        this.segmentsBlock = this.$("#segments");
    }

    async fetchAtms() {
        try {
            const response = await this.fetchData(`/atm/getatms`);
            this.setState({
                atmsList: response.data.atms.map((atm) => ({
                    value: atm.id,
                    label: atm.name,
                })),
            });
        } catch (err) {
            console.error("❌ Error fetching ATMs:", err);

            this.setState({
                atmsList: [],
            });
        }
    }

    addEventListeners() {
        this.handleCityChange();
        this.handleRegionChange();
        this.handleDateChange();
        this.handleTabChange();
        this.handleSubmit();
    }

    handleCityChange() {
        if (!this.selectCityBox) return;
        this.addListener(this.selectCityBox, "change", (e) => {
            this.currentCity = e.target.value || null;
        });
    }

    handleRegionChange() {
        if (!this.selectRegionBox) return;
        this.addListener(this.selectRegionBox, "change", (e) => {
            const regionValue = e.target.value === "null" ? null : e.target.value;
            this.currentRegion = regionValue;

            const regionsData = store.getState().regionsData;
            const cities =
                regionValue !== null
                    ? locationTransformer.getCitiesByProvince(regionsData, regionValue)
                    : locationTransformer.getAllCityOptions(regionsData);

            this.setState({
                cities: [{ label: "Ընտրել քաղաքը", value: null }, ...cities],
            });

            store.setState({ selectedRegion: regionValue });
        });
    }

    handleDateChange() {
        if (!this.dateSelector) return;
        this.addListener(this.dateSelector, "date-range-change", (e) => {
            const { startDate, endDate } = e.detail || {};
            if (!startDate || !endDate) return;
            this.startDate = startDate;
            this.endDate = endDate;
        });
    }

    handleTabChange() {
        const tabs = this.$$("custom-tab");
        tabs.forEach((tab) => {
            this.addListener(tab, "click", () => {
                this.activeTab = tab.getAttribute("name");
            });
        });
    }

    handleSubmit() {
        this.submitButtons.forEach((btn) => {
            this.addListener(btn, "click", () => {
                const atmsSearch = JSON.parse(this.selectAtmsBox.getAttribute("value"));
                const selectedSegments = this.segmentsBlock?.values || [];

                const payload =
                    this.activeTab === "geo"
                        ? {
                              city: this.currentCity,
                              province: this.currentRegion,
                              startDate: this.startDate,
                              endDate: this.endDate,
                              segmentId: selectedSegments.length ? selectedSegments : null,
                          }
                        : {
                              atmId: atmsSearch,
                              startDate: this.startDate,
                              endDate: this.endDate,
                          };

                this.dispatchEvent(
                    new CustomEvent("geo-submit", {
                        detail: payload,
                        bubbles: true,
                        composed: true,
                    })
                );
            });
        });
    }

    template() {
        if (this.state.atmsList.length == 0) {
            return /*html*/ `
                <div class="row">
                <div class="column sm-12">
                <div class="loading">
                <div class="loading__spinner spinner"></div>
                <div class="loading__text">Տվյալները բեռնվում են…</div>
                </div>
                </div>
                </div>
                `;
        }
        const atmsList = encode(this.state.atmsList);
        return /*html*/ `
       
                <div class="container">
                    <div class="tabs-container">
                        <div class="tabs">
                            <custom-tab name="geo" active>Աշխարհագրական</custom-tab>
                            <custom-tab name="atms">Բանկոմատներ</custom-tab>
                        </div>
                        <select-box-date id='date-selector' start-date='${
                            this.startDate ? this.startDate : ""
                        }' end-date='${this.endDate ? this.endDate : ""}'></select-box-date>

                    </div>
                    <div class="tab-content" data-tab="geo">
                       <div class="combo-box-items">
                            <select-box id="province-selector" value="${
                                this.currentRegion
                            }" placeholder="Ընտրել մարզը" options='${JSON.stringify(
            this.state.province
        )}'></select-box>
                            <select-box id="city-selector" value="${
                                this.currentCity
                            }" placeholder="Ընտրել քաղաքը" options='${JSON.stringify(
            this.state.cities
        )}'></select-box>
                        </div>
                        <segment-block id='segments'></segment-block>
                         <div class="btn-container btn-container_decor">
                            <button type="submit" class="btn btn_fit btn_blue btn_md submit-button">Հաստատել</button>
                        </div>
                    </div>
                    <div class="tab-content" data-tab="atms" style="display: none;">
                        <select-box-search placeholder="Որոնել ըստ բանկոմատի ID-ի կամ հասցեի" options='${atmsList}'  id='atms-search'></select-box-search>
                        <div class="btn-container btn-container_decor">
                            <button type="submit" class="btn btn_fit btn_blue btn_md submit-button" >Հաստատել</button>
                        </div>
                    </div>
                </div>
        


        `;
    }
}

customElements.define("geo-filtration-tabs", GeoFiltrationTabs);
