import { DynamicElement } from "../core/dynamic-element.js";

class AtmDetails extends DynamicElement {
    constructor() {
        super();

        this.state = {
            summary: null,
        };

        //store selected region and city to compare when store changed
        // this.selectedRegion = null;
        // this.selectedCity = null;
        this.id = "";
        // take id from path not attributer
    }

    onConnected() {
        this.fetchAtm();
        const pathParts = window.location.pathname.split("/").filter(Boolean);
        this.id = pathParts[pathParts.length - 1];
        console.log("this.id", this.id);
    }

    onAfterRender() {
        console.log("details page");

        // Override in child classes for post-render logic
    }

    addEventListeners() {
        // Listen for the custom event from atm-item components
        // this.addEventListener("atm-item-clicked", this.handleAtmItemClick);
    }

    // handleAtmItemClick(event) {
    //     const { id, latitude, longitude } = event.detail;

    //     // Convert string values to numbers
    //     const atmId = parseInt(id, 10);
    //     const lat = parseFloat(latitude);
    //     const lng = parseFloat(longitude);

    //     this.navigateToMarker(atmId, lat, lng);
    // }

    // onStoreChange(state) {
    //     if (
    //         this.selectedRegion !== state.selectedRegion ||
    //         this.selectedCity !== state.selectedCity
    //     ) {
    //         this.selectedCity = state.selectedCity;
    //         this.selectedRegion = state.selectedRegion;
    //         this.fetchAtms(); // one API call → one render
    //     }
    // }

    async fetchAtm() {
        const queryString = new URLSearchParams();

        queryString.append("id", this.id);

        try {
            const response = await this.fetchData(`/atm/getatms?${queryString}`);
            this.setState({
                summary: response.data,
            });
        } catch (err) {
            console.error("❌ Error fetching summary:", err);
            this.setState({ summary: null });
        }
    }

    // navigateToMarker(atmId, latitude, longitude) {
    //     // Find the yandex-map component and navigate to the marker
    //     const mapComponent = this.querySelector("yandex-map");

    //     if (mapComponent && mapComponent.navigateToMarker) {
    //         mapComponent.navigateToMarker(atmId, latitude, longitude);
    //     }
    // }

    template() {
        console.log(this.state.summary);

        if (!this.state.summary) {
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
                     <p>aaaaaaaaaaaaaa</p>
                </div>
                
            </div>
        `;
    }
}

customElements.define("atm-detail", AtmDetails);
