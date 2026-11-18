import { DynamicElement } from "../core/dynamic-element.js";
import { api } from "../core/api-client.js";
import "../components/dynamic/select-box-search.js";
import encode from "../assets/js/utils/encode.js";
import escapeAttr from "../assets/js/utils/escape-attr.js";
import "../components/dynamic/yandex-address.js";
import "../components/ui/customCheck.js";
import "../components/ui/selectBox.js";
import "../components/ui/customTab.js";
import locationTransformer from "../core/utils/location-transformer.js";

class CreateAtm extends DynamicElement {
    constructor() {
        super();
        this.state = {
            isLoading: false,
            error: "",
            modelId: "",
            name: "",
            ipAddress: "",
            lat: "",
            lon: "",
            address: "",
            segmentId: "",
            segmentIds: [],
            atmType: "",
            atmArchived: false,
            atmVersion: "",
            atmCimType: "",
            atmCdmType: "",
            encashmentLimit: "",
            repairTime: "",
            connectionStatusId: "",
            models: null,
            cimTypes: null,
            cdmTypes: null,
            types: null,
        };

        this.segments = null;
        this.locationMode = "map"; // active location tab: "map" or "manual"
        // province → cities → districts list from /dashboard/cities-with-districts (loaded at app start)
        this.regions = [];
        // address-tab dropdown choices; kept outside state so picking one doesn't re-render the form
        this.location = { province: "", city: "", district: "" };
    }

    static get observedAttributes() {
        // return ["next"]; // optional redirect target after login
    }

    onStoreChange(storeState) {
        this.segments = storeState.segments.map((item) => ({
            value: item.id,
            text: item.name,
        }));
        this.regions = storeState.regionsData || [];
    }

    // — Address tab dropdowns: province → city → district —

    getProvinceOptions() {
        return locationTransformer.getProvinceOptions(this.regions).filter((o) => o.value);
    }

    getCityOptions() {
        return locationTransformer.getFormCityOptions(this.regions, this.location.province);
    }

    getDistrictOptions() {
        const { province, city } = this.location;
        return locationTransformer.getFormDistrictOptions(this.regions, province, city);
    }

    locationSelect(id, placeholder, options, value) {
        // double-quoted attributes: encode() escapes " but not '
        return /* html */ `<select-box id="${id}" placeholder="${placeholder}" options="${encode(
            options
        )}" value="${escapeAttr(value)}"></select-box>`;
    }

    cityFieldHTML() {
        return this.locationSelect("city", "Ընտրել քաղաքը", this.getCityOptions(), this.location.city);
    }

    districtFieldHTML() {
        return this.locationSelect(
            "district",
            "Ընտրել համայնքը",
            this.getDistrictOptions(),
            this.location.district
        );
    }

    // <select-box> reads its options only once, so a new list means a new element.
    // Only these fields are replaced; the rest of the form keeps what the user entered.
    handleLocationChange(e) {
        const { id, value } = e.target;
        if (id === "province") {
            this.location = { province: value || "", city: "", district: "" };
            this.$("#city-field").innerHTML = this.cityFieldHTML();
            this.$("#district-field").innerHTML = this.districtFieldHTML();
        } else if (id === "city") {
            this.location = { ...this.location, city: value || "", district: "" };
            this.$("#district-field").innerHTML = this.districtFieldHTML();
        } else if (id === "district") {
            this.location.district = value || "";
        }
    }

    onConnected() {
        this.fetchModels();
        this.fetchCimTypes();
        this.fetchCdmTypes();
        this.fetchTypes();
    }

    async fetchModels() {
        try {
            const response = await this.fetchData(`/atm/models`);
            const options = response.data.map((m) => ({
                value: m.id,
                label: m.model_name,
            }));

            this.setState({ models: options });
        } catch (err) {
            console.error("❌ Error fetching models:", err);
            this.setState({ models: null });
        }
    }

    async fetchCimTypes() {
        try {
            const response = await this.fetchData(`/atm/cim-types`);

            const options = response.data.map((c) => ({
                value: c.id,
                label: c.name,
            }));

            this.setState({ cimTypes: options });
        } catch (err) {
            console.error("❌ Error fetching cimTypes:", err);
            this.setState({ cimTypes: null });
        }
    }

    async fetchCdmTypes() {
        try {
            const response = await this.fetchData(`/atm/cdm-types`);

            const options = response.data.map((c) => ({
                value: c.id,
                label: c.name,
            }));

            this.setState({ cdmTypes: options });
        } catch (err) {
            console.error("❌ Error fetching cdmTypes:", err);
            this.setState({ cdmTypes: null });
        }
    }

    async fetchTypes() {
        try {
            const response = await this.fetchData(`/atm/atm-types`);

            const options = response.map((c) => ({
                value: c.id,
                label: c.type_Name,
            }));

            this.setState({ types: options });
        } catch (err) {
            console.error("❌ Error fetching cimTypes:", err);
            this.setState({ types: null });
        }
    }

    addEventListeners() {
        const form = this.$("#create-atm-form");
        if (form) {
            this.addListener(form, "submit", this.handleSubmit);
        }

        const address = this.querySelector("yandex-address");
        if (address) {
            this.addListener(address, "newCoordinate", (e) => {
                const { lat, lng } = e.detail || {};
                const latInput = this.$("#lat");
                const lonInput = this.$("#lon");
                if (latInput) latInput.value = String(lat ?? "");
                if (lonInput) lonInput.value = String(lng ?? "");
            });
        }

        // custom-tab shows/hides the .tab-content; here we only remember which one is active
        this.$$(".location-tabs custom-tab").forEach((tabEl) => {
            this.addListener(tabEl, "click", () => {
                this.locationMode = tabEl.getAttribute("name");
                // hide the old error without setState: a re-render would wipe what the user typed
                if (this.state.error) {
                    this.state.error = "";
                    this.$("#create-atm-form > .error")?.remove();
                }
                // the map can't size itself while hidden, so resize it once its tab is shown
                if (this.locationMode === "map") this.$("yandex-address")?.map?.container.fitToViewport();
            });
        });

        // one listener for all three dropdowns, so it still works after a dropdown is replaced
        const manualTab = this.$('.tab-content[data-tab="manual"]');
        if (manualTab) this.addListener(manualTab, "change", this.handleLocationChange);
    }

    // Everything currently entered in the form, as shown (untrimmed), keyed like this.state
    readForm() {
        const value = (id) => this.$(`#${id}`)?.value ?? "";
        return {
            name: value("name"),
            ipAddress: value("ipAddress"),
            atmVersion: value("atmVersion"),
            encashmentLimit: value("encashmentLimit"),
            repairTime: value("repairTime"),
            lat: value("lat"),
            lon: value("lon"),
            address: value("address"),
            atmType: value("atmType"),
            modelId: value("modelId"),
            atmCimType: value("atmCimType"),
            atmCdmType: value("atmCdmType"),
            atmArchived: this.$("#atmArchived")?.hasAttribute("checked") || false,
            segmentIds: JSON.parse(this.$("#segmentId")?.getAttribute("value") || "[]"),
        };
    }

    async handleSubmit(event) {
        event.preventDefault();

        // Save what the user entered first: an error or the loading state below re-renders the
        // form from this.state, so without this every field would come back empty.
        const form = this.readForm();
        this.setState(form);

        const name = form.name.trim();
        const modelId = Number(form.modelId);
        const ipAddress = form.ipAddress.trim();

        const atmVersion = form.atmVersion.trim();
        const atmType = Number(form.atmType);
        const atmArchived = form.atmArchived;

        const atmCimType = Number(form.atmCimType);
        const atmCdmType = Number(form.atmCdmType) || 0;

        const lon = form.lon.trim();
        const lat = form.lat.trim();

        // province/city/district are names picked from the cities-with-districts list
        const { province, city, district } = this.location;
        const address = form.address.trim();

        // only the active tab's fields are sent
        const location =
            this.locationMode === "map" ? { lat, lon } : { province, city, district, address };
        // some cities have no districts in the list; then district can't be picked, so it isn't required
        const districtRequired = this.getDistrictOptions().length > 0;
        const locationMissing =
            this.locationMode === "map"
                ? !lat || !lon
                : !province || !city || !address || (districtRequired && !district);

        const encashmentLimit = Number(form.encashmentLimit.trim());
        const repairTime = Number(form.repairTime.trim());

        const segmentIds = form.segmentIds.map((v) => Number(v));

        console.log("aaaaaa", {
            name,
            modelId,
            ipAddress,
            segmentIds,
            atmType,
            atmArchived,
            ...(atmVersion != "" && { atmVersion }),
            atmCimType,
            atmCdmType,
            ...location,
            encashmentLimit,
            repairTime,
        });

        if (
            !name ||
            !modelId ||
            !ipAddress ||
            segmentIds.length == 0 ||
            !atmType ||
            !atmCdmType ||
            !encashmentLimit ||
            !repairTime ||
            atmArchived
        ) {
            this.setState({ error: "Լրացրեք բոլոր դաշտերը" });
            return;
        }

        if (locationMissing) {
            this.setState({
                error:
                    this.locationMode === "map"
                        ? "Ընտրեք բանկոմատի գտնվելու վայրը քարտեզի վրա"
                        : "Լրացրեք հասցեի բոլոր դաշտերը",
            });
            return;
        }

        this.setState({ isLoading: true, error: "" });

        try {
            await api.post("/atm/add-atm", {
                name,
                modelId,
                ipAddress,
                segmentIds,
                atmType,
                atmArchived,
                ...(atmVersion != "" && { atmVersion }),
                atmCimType,
                atmCdmType,
                ...location,
                encashmentLimit,
                repairTime,
            });

            window.location.href = "all-atms";
        } catch (err) {
            // api-client puts the backend's response body on err.data
            const message = err?.data?.errors || err?.message || "Ստեղծել ձախողվեց";
            this.setState({ error: message });
        } finally {
            this.setState({ isLoading: false });
        }
    }
    template() {
        const segments = encode(this.segments);
        const models = encode(this.state.models);
        const cimTypes = encode(this.state.cimTypes);
        const cdmTypes = encode(this.state.cdmTypes) ?? "";
        const types = encode(this.state.types);
        const selectedSegmentsStr = JSON.stringify(this.state.segmentIds || []);
        const isMapMode = this.locationMode === "map";
        // All fields render from this.state (filled by readForm on submit), so an error message
        // or the loading state doesn't clear them. The map is centered on the picked point
        // because <yandex-address> puts its pin at the center.

        return /* html */ `
            <div class="row align-center">
                <div class="column sm-12">
                    <div class="create_form">
                        <form id="create-atm-form" class="form">
                            <div class="row">
                                <div class="form__item column sm-6">
                                    <label for="name">Բանկոմատի ID</label>
                                    <input id="name" class="w-100" name="name" type="text" value="${escapeAttr(
                                        this.state.name
                                    )}" required />
                                </div>
                                  <div class="form__item column sm-6">
                                    <label for="segmentId"></label>
                                    <select-box-search id='segmentId' placeholder="Որոնել Սեգմենտ" options='${segments}' value='${selectedSegmentsStr}' id='segments-search'></select-box-search>
                                </div>

                            </div>


                            <div class="row">
                                <div class="form__item column sm-6">
                                    <p>Մոնիտորի տեսակ</p>
                                    <select-box id="atmType" placeholder="Ընտրել տեսակը" options='${types}' value="${escapeAttr(
                                        this.state.atmType
                                    )}"></select-box>
                                </div>

                                <div class="form__item column sm-6">
                                    <label for="ipAddress">IP հասցե</label>
                                    <input id="ipAddress" class="w-100" name="ipAddress" type="text" value="${escapeAttr(
                                        this.state.ipAddress
                                    )}" required />
                                </div>
                            </div>


                            <div class="row">
                               <div class="form__item column sm-3">
                                    <p>Բանկոմատի մոդել</p>
                                    <select-box id="modelId" placeholder="Ընտրել մոդելը" options='${models}' value="${escapeAttr(
                                        this.state.modelId
                                    )}"></select-box>
                                </div>
                                <div class="form__item column sm-3">
                                    <p>CIM Տեսակ</p>
                                    <select-box id="atmCimType" placeholder="Ընտրել CIM տեսակ" options='${cimTypes}' value="${escapeAttr(
                                        this.state.atmCimType
                                    )}"></select-box>
                                </div>
                                <div class="form__item column sm-6">
                                    <label for="atmVersion">Վերսիա</label>
                                    <input id="atmVersion" class="w-100" name="atmVersion" type="text" value="${escapeAttr(
                                        this.state.atmVersion
                                    )}" />
                                </div>
                            </div>

                            <div class='row'>
                                <div class="form__item column sm-3">
                                    <p>CDM Տեսակ</p>
                                    <select-box id="atmCdmType" placeholder="Ընտրել CDM տեսակ" options='${cdmTypes}' value="${escapeAttr(
                                        this.state.atmCdmType
                                    )}"></select-box>
                                </div>

                                <div class="form__item column sm-3 checkbox">
                                    <custom-checkbox id="atmArchived" value="true" ${
                                        this.state.atmArchived ? "checked" : ""
                                    }>ԱՐԽԻՎԱՑՎԱԾ </custom-checkbox>
                                </div>

                                <div class="form__item column sm-3">
                                    <label for="repairTime">Վերոնորգման ժամկետ (ժամ)</label>
                                    <input id="repairTime" class="w-50" name="repairTime" type="text" value="${escapeAttr(
                                        this.state.repairTime
                                    )}" />
                                </div>

                                <div class="form__item column sm-3">
                                    <label for="encashmentLimit">Լիցքաորման սահմանաչափ</label>
                                    <input id="encashmentLimit" class="w-50" name="encashmentLimit" type="text" value="${escapeAttr(
                                        this.state.encashmentLimit
                                    )}" />
                                </div>
                            </div>

                            <div class="tab-group">
                                <div class="tabs location-tabs">
                                    <custom-tab name="map" ${isMapMode ? "active" : ""}>Քարտեզ</custom-tab>
                                    <custom-tab name="manual" ${isMapMode ? "" : "active"}>Հասցե</custom-tab>
                                </div>

                                <div class="tab-content" data-tab="map" ${isMapMode ? "" : 'style="display:none"'}>
                                    <div class="row">
                                        <div class="column sm-6">
                                            <div class="atm-map">
                                            <yandex-address
                                                center-lat="${escapeAttr(this.state.lat || "40.1772")}"
                                                center-lng="${escapeAttr(this.state.lon || "44.50349")}"
                                                zoom="14"
                                                ></yandex-address>
                                            </div>
                                        </div>
                                        <div class="column sm-6">
                                            <div class="form__item">
                                                <label for="lat">Latitude</label>
                                                <input id="lat" class="w-100" name="lat" type="text" value="${escapeAttr(
                                                    this.state.lat
                                                )}" readonly />
                                            </div>
                                            <div class="form__item">
                                                <label for="lon">Longitude</label>
                                                <input id="lon" class="w-100" name="lon" type="text" value="${escapeAttr(
                                                    this.state.lon
                                                )}" readonly />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="tab-content" data-tab="manual" ${isMapMode ? 'style="display:none"' : ""}>
                                    <div class="row">
                                        <div class="form__item column sm-4">
                                            <p>Մարզ</p>
                                            ${this.locationSelect(
                                                "province",
                                                "Ընտրել մարզը",
                                                this.getProvinceOptions(),
                                                this.location.province
                                            )}
                                        </div>
                                        <div class="form__item column sm-4">
                                            <p>Քաղաք</p>
                                            <div id="city-field">${this.cityFieldHTML()}</div>
                                        </div>
                                        <div class="form__item column sm-4">
                                            <p>Համայնք</p>
                                            <div id="district-field">${this.districtFieldHTML()}</div>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="form__item column sm-12">
                                            <label for="address">Հասցե</label>
                                            <input id="address" class="w-100" name="address" type="text" value="${escapeAttr(
                                                this.state.address
                                            )}" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            ${
                                this.state.error
                                    ? `<div class="error color-red" style="margin-bottom:10px;">${this.state.error}</div>`
                                    : ""
                            }
                            <div class="form__btn">
                                <button id="login-btn" type="submit" class="btn btn_md btn_blue btn_full" ${
                                    this.state.isLoading ? "disabled" : ""
                                }>
                                    <span>${
                                        this.state.isLoading ? "Կատարվում է …" : "Ստեղծել"
                                    }</span>
                                </button>
                                
                               <a href='all-atms'class="cancel btn btn_md btn_white btn_full">Չեղարկել</a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define("create-atm-page", CreateAtm);
