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
            atmVersion: "",
            atmArchived: "",
            atmCimType: "",
            connectionStatusId: "",
            models: null,
            cimTypes: null,
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

    template() {
        const segments = encode(this.segments);
        const models = encode(this.state.models);
        const cimTypes = encode(this.state.cimTypes);

        console.log("this.state.models", this.state.models);

        return /* html */ `
            <div class="row align-center">
                <div class="column sm-12">
                    <div class="create_form">
                        <form id="create-atm-form" class="form">
                            <div class="row">
                                <div class="form__item column sm-6">
                                    <label for="name">Atm name</label>
                                    <input id="name" class="w-100" name="name" type="text" required />
                                </div>
                                  <div class="form__item column sm-6">
                                    <select-box-search id='segmentId' placeholder="Որոնել Սեգմենտ" options='${segments}' id='segments-search'></select-box-search>
                                </div>
                              
                            </div>


                            <div class="row">
                              <div class="form__item column sm-6">
                                    <label for="atmType">atmType</label>
                                    <input id="atmType" class="w-100" name="atmType" type="number" required />
                                </div>
                             
                                <div class="form__item column sm-6">
                                    <label for="ipAddress">ipAddress</label>
                                    <input id="ipAddress" class="w-100" name="ipAddress" type="text" required />
                                </div>
                            </div>


                            <div class="row">
                               <div class="form__item column sm-2">
                                    <p>modelId</p>
                                    <select-box id="modelId" placeholder="Ընտրել մոդելը" options='${models}'></select-box>
                                </div>
                                <div class="form__item column sm-2">
                                    <p>atmCimType</p>
                                    <select-box id="atmCimType" placeholder="Ընտրել տեսակ" options='${cimTypes}'></select-box>
                                </div>
                                 <div class="form__item column sm-2 checkbox">
                                    <custom-checkbox id="atmArchived" value="true">առխիվացված </custom-checkbox>
                                </div>
                                <div class="form__item column sm-6">
                                    <label for="atmVersion">atmVersion</label>
                                    <input id="atmVersion" class="w-100"  type='text' name="atmVersion" required />
                                </div>
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
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
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
        const atmVersionInput = this.$("#atmVersion");
        const atmArchivedInput = this.$("#atmArchived");
        const atmCimTypeInput = this.$("#atmCimType");
        const lonInput = this.$("#lon");
        const latInput = this.$("#lat");

        const name = nameInput?.value.trim();
        const modelId = Number(modelIdInput?.value);
        const ipAddress = ipAddressInput?.value.trim();

        const atmType = Number(atmTypeInput?.value);
        const atmVersion = atmVersionInput?.value.trim();
        const atmArchived = atmArchivedInput?.hasAttribute("checked") || false;

        const atmCimType = Number(atmCimTypeInput?.value);

        const lon = lonInput?.value.trim();
        const lat = latInput?.value.trim();

        const rawVal = segmentIdInput.getAttribute("value") || "[]";
        const segmentIds = JSON.parse(rawVal).map((v) => Number(v));
        console.log("Input values:", {
            name: nameInput?.value,
            modelId: modelIdInput?.value,
            ipAddress: ipAddressInput?.value,
            atmType: atmTypeInput?.value,
            atmVersion: atmVersionInput?.value,
            atmArchived: atmArchived,
            atmCimType: atmCimTypeInput?.value,
            lon: lonInput?.value,
            lat: latInput?.value,
            segmentIdsRaw: segmentIdInput?.getAttribute("value"),
        });

        if (
            !name ||
            !modelId ||
            !ipAddress ||
            segmentIds.length == 0 ||
            !atmType ||
            !atmVersion ||
            !atmCimType ||
            !lon ||
            !lat
        ) {
            this.setState({ error: "Լրացրեք բոլոր դաշտերը" });
            return;
        }

        this.setState({ isLoading: true, error: "" });

        try {
            const response = await api.post("/atm/add-atm", {
                name,
                modelId,
                ipAddress,
                segmentIds,
                atmType,
                atmVersion,
                atmArchived,
                atmCimType,
                lon,
                lat,

                // for test
                // modelId: 1,
                // name: "string",
                // ipAddress: "string",
                // lat: "44.3333333",
                // lon: "40.333232332",
                // segmentIds: [1, 5],
                // atmType: 1,
                // atmVersion: "string",
                // atmArchived: true,
                // atmCimType: 1
            });
            console.log("creation response", response);

            // const nextAttr = this.getAttribute("next") || "";
            // const next = nextAttr && nextAttr.startsWith("/") ? nextAttr : "/home";
            // window.location.href = `/ATM_monitor${next}`;
        } catch (err) {
            const message = err?.message || "Ստեղծել ձախողվեց";
            this.setState({ error: message });
        } finally {
            this.setState({ isLoading: false });
        }
    }
}

customElements.define("create-atm-page", CreateAtm);
