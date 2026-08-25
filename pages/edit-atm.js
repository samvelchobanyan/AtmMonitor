import { DynamicElement } from "../core/dynamic-element.js";
import { api } from "../core/api-client.js";
import "../components/dynamic/select-box-search.js";
import encode from "../assets/js/utils/encode.js";
import "../components/dynamic/yandex-address.js";
import "../components/ui/customCheck.js";
import "../components/ui/selectBox.js";

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
    }

    static get observedAttributes() {
        return ["id"];
    }

    onStoreChange(storeState) {
        this.segments = storeState.segments.map((item) => ({
            value: item.id,
            text: item.name,
        }));
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

            this.setState({
                name: this.atmInfo.name || "",
                modelId: this.atmInfo.model_id || "",
                ipAddress: this.atmInfo.ip_address || "",
                lat: this.atmInfo.latitude || "",
                lon: this.atmInfo.longitude || "",
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
    }

    async handleSubmit(event) {
        event.preventDefault();

        const nameInput = this.$("#name");
        const modelIdInput = this.$("#modelId");
        const ipAddressInput = this.$("#ipAddress");
        const segmentIdInput = this.$("#segmentId");
        const atmTypeInput = this.$("#atmType");
        const atmArchivedInput = this.$("#atmArchived");
        const atmVersionInput = this.$("#atmVersion");
        const atmCimTypeInput = this.$("#atmCimType");
        const atmCdmTypeInput = this.$("#atmCdmType");
        const lonInput = this.$("#lon");
        const latInput = this.$("#lat");
        const encashmentLimitInput = this.$("#encashmentLimit");
        const repairTimeInput = this.$("#repairTime");

        const name = nameInput?.value.trim();
        const modelId = Number(modelIdInput?.value);
        const ipAddress = ipAddressInput?.value.trim();
        const atmVersion = atmVersionInput?.value.trim();
        const atmType = Number(atmTypeInput?.value);
        const atmArchived = atmArchivedInput?.hasAttribute("checked") || false;
        const atmCimType = Number(atmCimTypeInput?.value);
        const atmCdmType = Number(atmCdmTypeInput?.value) || 0;
        const lon = lonInput?.value.trim();
        const lat = latInput?.value.trim();
        const encashmentLimit = Number(encashmentLimitInput?.value.trim()) || 0;
        const repairTime = Number(repairTimeInput?.value.trim()) || 0;
        const rawVal = segmentIdInput.getAttribute("value") || "[]";
        const segmentIds = JSON.parse(rawVal).map((v) => Number(v));

        if (
            !name ||
            !modelId ||
            !ipAddress ||
            segmentIds.length == 0 ||
            !atmType ||
            !atmCdmType ||
            !lon ||
            !lat
        ) {
            this.setState({ error: "Լրացրեք բոլոր դաշտերը" });
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
                lon,
                lat,
                encashmentLimit,
                repairTime,
            });

            window.location.href = "all-atms";
        } catch (err) {
            this.setState({ error: err?.message || "Խմբագրումը ձախողվեց" });
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

        return /* html */ `
            <div class="row align-center">
                <div class="column sm-12">
                    <div class="edit_form">
                        <form id="edit-atm-form" class="form">
                            <div class="row">
                                <div class="form__item column sm-6">
                                    <label for="name">Բանկոմատի ID</label>
                                    <input id="name" class="w-100" name="name" type="text" value="${
                                        this.state.name
                                    }" required />
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
                                    <input id="ipAddress" class="w-100" name="ipAddress" type="text" value="${
                                        this.state.ipAddress
                                    }" required />
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
                                    <input id="atmVersion" class="w-100" name="atmVersion" type="text" value="${
                                        this.state.atmVersion
                                    }" />
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
                                    <input id="repairTime" class="w-100" name="repairTime" type="text" value="${this
                                        .state.repairTime || ""}" />
                                </div>

                                <div class="form__item column sm-3">
                                    <label for="encashmentLimit">Լիցքավորման սահմանաչափ</label>
                                    <input id="encashmentLimit" class="w-100" name="encashmentLimit" type="text" value="${this
                                        .state.encashmentLimit || ""}" />
                                </div>

                            </div>

                            <div class="row">
                                <div class="column sm-6">
                                    <div class="atm-map">
                                        <yandex-address
                                            center-lat="${this.state.lat || "40.1772"}"
                                            center-lng="${this.state.lon || "44.50349"}"
                                            zoom="14">
                                        </yandex-address> 
                                    </div>
                                </div>
                                <div class="column sm-6">
                                    <div class="form__item">
                                        <label for="lat">Latitude</label>
                                        <input id="lat" class="w-100" name="lat" type="text" value="${
                                            this.state.lat
                                        }" readonly />
                                    </div>
                                    <div class="form__item">
                                        <label for="lon">Longitude</label>
                                        <input id="lon" class="w-100" name="lon" type="text" value="${
                                            this.state.lon
                                        }" readonly />
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
