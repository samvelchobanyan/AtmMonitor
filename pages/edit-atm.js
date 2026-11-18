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

class EditAtm extends DynamicElement {
    constructor() {
        super();
        this.state = {
            isLoading: false,
            error: "",
            modelId: 0,
            name: "",
            ipAddress: "",
            lat: "",
            lon: "",
            address: "",
            segmentId: "",
            atmType: 0,
            atmArchived: false,
            atmCimType: 0,
            atmVersion: "",
            atmCdmType: 0,
            segmentIds: [],
            connectionStatusId: "",
            models: null,
            cimTypes: null,
            cdmTypes: null,
            types: null,
            encashmentLimit: 0,
            repairTime: 0,
        };
        this.atmInfo = null;
        this.segments = null;
        this.locationMode = "map"; // active location tab: "map" or "manual"
        // province → cities → districts list from /dashboard/cities-with-districts (loaded at app start)
        this.regions = [];
        // address-tab dropdown choices; kept outside state so picking one doesn't re-render the form
        this.location = { province: "", city: "", district: "" };
    }

    static get observedAttributes() {
        return ["id"];
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

    // Pre-select the ATM's saved names, but only ones that are in the list: otherwise the
    // dropdown would show its placeholder while the old (unlisted) text was still sent.
    setLocationFromSaved(province, city, district) {
        const inList = (options, value) => options.some((o) => o.value === value);
        this.location = { province: "", city: "", district: "" };
        if (!inList(this.getProvinceOptions(), province)) return;
        this.location.province = province;
        if (!inList(this.getCityOptions(), city)) return;
        this.location.city = city;
        if (inList(this.getDistrictOptions(), district)) this.location.district = district;
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

    async onConnected() {
        this.atmId = this.getAttribute("id");
        this.setState({ isLoading: true });

        try {
            // 1. Fetch data requirements in parallel first
            await Promise.all([
                this.fetchModels(),
                this.fetchCimTypes(),
                this.fetchCdmTypes(),
                this.fetchTypes(),
            ]);

            // 2. Fetch structural ATM details to cleanly render options
            await this.fetchAtmInfoData();
        } catch (e) {
            console.error("Initialization error:", e);
        } finally {
            this.setState({ isLoading: false });
        }
    }

    async fetchAtmInfoData() {
        try {
            const response = await this.fetchData(`/atm/getatm/${this.atmId}`);
            this.atmInfo = response.data;
            console.log("this.atmInfo loaded:", this.atmInfo);

            // an ATM saved without coordinates was added by address, so open that tab
            this.locationMode = this.atmInfo.latitude && this.atmInfo.longitude ? "map" : "manual";
            this.setLocationFromSaved(
                this.atmInfo.province || "",
                this.atmInfo.city || "",
                this.atmInfo.district || ""
            );

            this.setState({
                name: this.atmInfo.name || "",
                modelId: this.atmInfo.model_id || "",
                ipAddress: this.atmInfo.ip_address || "",
                lat: this.atmInfo.latitude || "",
                lon: this.atmInfo.longitude || "",
                address: this.atmInfo.address || "",
                atmType: this.atmInfo.atm_type || "",
                atmArchived: this.atmInfo.atm_archived || false,
                atmVersion: this.atmInfo.atm_version || "",
                atmCimType: this.atmInfo.atm_cim_type || "",
                atmCdmType: this.atmInfo.atm_cdm_type || 0,
                segmentIds: this.atmInfo.segments ? this.atmInfo.segments.map((s) => s.id) : [],
                encashmentLimit: this.atmInfo.encashment_limit || 0,
                repairTime: this.atmInfo.repair_time || 0,
            });
        } catch (e) {
            console.error("❌ Error fetching ATM details:", e);
            this.setState({ error: "Չհաջողվեց բեռնել բանկոմատի տվյալները" });
        }
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
            console.error("❌ Error fetching types:", err);
            this.setState({ types: null });
        }
    }

    addEventListeners() {
        const form = this.$("#edit-atm-form");
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
                    this.$("#edit-atm-form > .error")?.remove();
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
        // form from this.state, so without this every field would go back to the saved ATM's values.
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
        const encashmentLimit = Number(form.encashmentLimit.trim()) || 0;
        const repairTime = Number(form.repairTime.trim()) || 0;
        const segmentIds = form.segmentIds.map((v) => Number(v));

        if (
            !name ||
            !modelId ||
            !ipAddress ||
            segmentIds.length == 0 ||
            !atmType ||
            !atmCdmType
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
            await api.post(`/atm/edit-atm/${this.atmId}`, {
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
            const message = err?.data?.errors || err?.message || "Խմբագրումը ձախողվեց";
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

        return /* html */ `
            <div class="row align-center">
                <div class="column sm-12">
                    <div class="edit_form">
                        <form id="edit-atm-form" class="form">
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
                                    <select-box id="atmType" placeholder="Ընտրել տեսակը" options='${types}' value="${
            this.state.atmType
        }"></select-box>
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
                                    <select-box id="modelId" placeholder="Ընտրել մոդելը" options='${models}' value="${
            this.state.modelId
        }"></select-box>
                                </div>
                                <div class="form__item column sm-3">
                                    <p>CIM Տեսակ</p>
                                    <select-box id="atmCimType" placeholder="Ընտրել CIM տեսակ" options='${cimTypes}' value="${
            this.state.atmCimType
        }"></select-box>
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
                                    <select-box id="atmCdmType" placeholder="Ընտրել CDM տեսակ" options='${cdmTypes}' value="${
            this.state.atmCdmType
        }"></select-box>
                                </div>
                                
                                <div class="form__item column sm-3 checkbox">
                                    <custom-checkbox id="atmArchived" ${
                                        this.state.atmArchived ? "checked" : ""
                                    }>ԱՐԽԻՎԱՑՎԱԾ </custom-checkbox>
                                </div>

                                <div class="form__item column sm-3">
                                    <label for="repairTime">Վերանորոգման ժամկետ (ժամ)</label>
                                    <input id="repairTime" class="w-100" name="repairTime" type="text" value="${escapeAttr(
                                        this.state.repairTime || ""
                                    )}" />
                                </div>

                                <div class="form__item column sm-3">
                                    <label for="encashmentLimit">Լիցքավորման սահմանաչափ</label>
                                    <input id="encashmentLimit" class="w-100" name="encashmentLimit" type="text" value="${escapeAttr(
                                        this.state.encashmentLimit || ""
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
                                                    zoom="14">
                                                </yandex-address>
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
                                <a href='all-atms' class="cancel btn btn_md btn_white btn_full">Չեղարկել</a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define("edit-atm-page", EditAtm);
