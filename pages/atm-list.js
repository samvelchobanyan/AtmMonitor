import { DynamicElement } from "../core/dynamic-element.js";
import "../components/dynamic/list-view.js";
import "../components/ui/atmItem.js";
import "../components/dynamic/yandex-map.js";
import { store } from "../core/store/store.js";

class AtmList extends DynamicElement {
    constructor() {
        super();

        this.state = {
            atms: null,
        };

        //store selected region and city to compare when store changed
        this.selectedRegion = null;
        this.selectedCity = null;
    }

    onConnected() {
        this.fetchAtms();
    }

    onAfterRender() {
        // Override in child classes for post-render logic
    }

    addEventListeners() {
        // Listen for the custom event from atm-item components
        this.addEventListener("atm-item-clicked", this.handleAtmItemClick);
    }

    handleAtmItemClick(event) {
        const { id, latitude, longitude } = event.detail;

        // Convert string values to numbers
        const atmId = parseInt(id, 10);
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        this.navigateToMarker(atmId, lat, lng);
    }

    onStoreChange(state) {
        if (
            this.selectedRegion !== state.selectedRegion ||
            this.selectedCity !== state.selectedCity
        ) {
            this.selectedCity = state.selectedCity;
            this.selectedRegion = state.selectedRegion;
            this.fetchAtms(); // one API call → one render
        }
    }

    async fetchAtms() {
        const queryString = new URLSearchParams();

        const globalState = store.getState();
        if (globalState.selectedRegion) {
            this.selectedRegion = globalState.selectedRegion;
            queryString.append("province", globalState.selectedRegion);
        }
        if (globalState.selectedCity) {
            this.selectedCity = globalState.selectedCity;
            queryString.append("city", globalState.selectedCity);
        }

        try {
            const response = await this.fetchData(`/atm/getatms?${queryString}`);
            this.setState({
                atms: response.data.atms,
            });
        } catch (err) {
            console.error("❌ Error fetching summary:", err);
            this.setState({ atms: null });
        }
    }

    navigateToMarker(atmId, latitude, longitude) {
        // Find the yandex-map component and navigate to the marker
        const mapComponent = this.querySelector("yandex-map");

        if (mapComponent && mapComponent.navigateToMarker) {
            mapComponent.navigateToMarker(atmId, latitude, longitude);
        }
    }

    template() {
        if (this.state.atms?.length == 0) {
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

        return /*html*/ `
            <div class="row">
                <div class="column sm-6">
                    <div class="atm-list-container">
                        <list-view
                          scroll
                          white
                          searchable
                          search-fields="name,city,district,address"
                          items='${JSON.stringify(this.state.atms)}'
                        >
                        <template>
                            <atm-item 
                                id="{{id}}" 
                                name="{{name}}" 
                                city="{{city}}" 
                                district="{{district}}" 
                                address="{{address}}"
                                connection-status="{{connection_status_id}}"
                                data-working="{{working_status_id}}"
                                data-lat="{{latitude}}"
                                data-lng="{{longitude}}">
                            </atm-item>
                        </template>
                        </list-view>
                    </div>
                </div>
                <div class="column sm-6">
                    <div class="atm-map">
                        <yandex-map
                          atms='${JSON.stringify(this.state.atms)}'
                          center-lat="40.1872"
                          center-lng="44.5152"
                          zoom="10">
                        </yandex-map>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define("atm-list", AtmList);
