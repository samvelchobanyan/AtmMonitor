import { DynamicElement } from "../core/dynamic-element.js";
import { api } from "../core/api-client.js";
import "../components/dynamic/select-box-search.js";
import encode from "../assets/js/utils/encode.js";
import "../components/dynamic/yandex-address.js";
import "../components/ui/customCheck.js";
import "../components/ui/selectBox.js";

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
            segmentId: "",
            atmType: "",
            atmArchived: "",
            atmCimType: "",
            atmCdmType: "",
            connectionStatusId: "",
            models: null,
            cimTypes: null,
            cdmTypes: null,
            types: null,
        };

        this.segments = null;
    }

    static get observedAttributes() {
        // return ["next"]; // optional redirect target after login
    }

    onStoreChange(storeState) {
        this.segments = storeState.segments.map((item) => ({
            value: item.id,
            text: item.name,
        }));
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

        const encashmentLimit = Number(encashmentLimitInput?.value.trim());
        const repairTime = Number(repairTimeInput?.value.trim());

        const rawVal = segmentIdInput.getAttribute("value") || "[]";
        const segmentIds = JSON.parse(rawVal).map((v) => Number(v));

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
            lon,
            lat,
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
            !lon ||
            !lat ||
            !encashmentLimit ||
            !repairTime ||
            atmArchived
        ) {
            this.setState({ error: "Լրացրեք բոլոր դաշտերը" });
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
                lon,
                lat,
                encashmentLimit,
                repairTime,
            });

            window.location.href = "all-atms";
        } catch (err) {
            const message = err?.message || "Ստեղծել ձախողվեց";
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

        return /* html */ `
            <div class="row align-center">
                <div class="column sm-12">
                    <div class="create_form">
                        <form id="create-atm-form" class="form">
                            <div class="row">
                                <div class="form__item column sm-6">
                                    <label for="name">Բանկոմատի ID</label>
                                    <input id="name" class="w-100" name="name" type="text" required />
                                </div>
                                  <div class="form__item column sm-6">
                                    <label for="segmentId"></label>
                                    <select-box-search id='segmentId' placeholder="Որոնել Սեգմենտ" options='${segments}' id='segments-search'></select-box-search>
                                </div>
                              
                            </div>


                            <div class="row">
                                <div class="form__item column sm-6">
                                    <p>Մոնիտորի տեսակ</p>
                                    <select-box id="atmType" placeholder="Ընտրել տեսակը" options='${types}'></select-box>
                                </div>
                             
                                <div class="form__item column sm-6">
                                    <label for="ipAddress">IP հասցե</label>
                                    <input id="ipAddress" class="w-100" name="ipAddress" type="text" required />
                                </div>
                            </div>


                            <div class="row">
                               <div class="form__item column sm-3">
                                    <p>Բանկոմատի մոդել</p>
                                    <select-box id="modelId" placeholder="Ընտրել մոդելը" options='${models}'></select-box>
                                </div>
                                <div class="form__item column sm-3">
                                    <p>CIM Տեսակ</p>
                                    <select-box id="atmCimType" placeholder="Ընտրել CIM տեսակ" options='${cimTypes}'></select-box>
                                </div>
                                <div class="form__item column sm-6">
                                    <label for="atmVersion">Վերսիա</label>
                                    <input id="atmVersion" class="w-100" name="atmVersion" type="text" />
                                </div>
                            </div>

                            <div class='row'>
                                <div class="form__item column sm-3">
                                    <p>CDM Տեսակ</p>
                                    <select-box id="atmCdmType" placeholder="Ընտրել CDM տեսակ" options='${cdmTypes}'></select-box>
                                </div>
                                
                                <div class="form__item column sm-3 checkbox">
                                    <custom-checkbox id="atmArchived" value="true">ԱՐԽԻՎԱՑՎԱԾ </custom-checkbox>
                                </div>

                                <div class="form__item column sm-3">
                                    <label for="repairTime">Վերոնորգման ժամկետ (ժամ)</label>
                                    <input id="repairTime" class="w-50" name="repairTime" type="text" />
                                </div>

                                <div class="form__item column sm-3">
                                    <label for="encashmentLimit">Լիցքաորման սահմանաչափ</label>
                                    <input id="encashmentLimit" class="w-50" name="encashmentLimit" type="text" />
                                </div>L
                            </div>

                            <div class="row">
                                <div class="column sm-6">
                                    <div class="atm-map">
                                    <yandex-address
                                        center-lat="40.1772"
                                        center-lng="44.50349"
                                        zoom="14"
                                        ></yandex-address> 
                                    </div>
                                </div>
                                <div class="column sm-6">
                                    <div class="form__item">
                                        <label for="lat">Latitude</label>
                                        <input id="lat" class="w-100" name="lat" type="text" readonly />
                                    </div>
                                    <div class="form__item">
                                        <label for="lon">Longitude</label>
                                        <input id="lon" class="w-100" name="lon" type="text" readonly />
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
