import { DynamicElement } from "../core/dynamic-element.js";
import { api } from "../core/api-client.js";
import "../components/dynamic/select-box-search.js";
import encode from "../assets/js/utils/encode.js";
import "../components/dynamic/yandex-address.js";
import "../components/ui/customCheck.js";
import "../components/ui/selectBox.js";
import "../components/ui/atmItem.js";

class AllAtmsPage extends DynamicElement {
    constructor() {
        super();
        this.state = { atms: null };
    }

    onConnected() {
        this.fetchAtms();
    }

    async fetchAtms() {
        try {
            const response = await this.fetchData(`/atm/getatms`);
            this.setState({
                atms: response.data.atms,
            });

            console.log("respo", response.data.atms);
        } catch (err) {
            console.error("❌ Error fetching summary:", err);
            this.setState({ atms: null });
        }
    }

    template() {
        console.log("this.state.atms", this.state.atms);

        if (this.state.atms == null || this.state.atms.length == 0) {
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

        return /* html */ `
        <div class="row">
            <div class="column">
                <div class="container">
                    <div class="segments-page">
                        <div class="segments-header">
                            <h2>Բանկոմատներ</h2>
                            <a href='create-atm'> <button class="btn btn_blue add-segment-btn">+ Ավելացնել</button></a>
                        </div>

                        <div class="atms-list">
                            ${this.state.atms
                                .map(
                                    (atm) => `
                                    <div class="segment-card">
                                      <atm-item 
                                        id="${atm.id}" 
                                        name="${atm.name}"  
                                        city="${atm.city}" 
                                        district="${atm.district}" 
                                        address="${atm.address}" 
                                        data-working="${atm.connection_status_id}" 
                                        data-lat="${atm.latitude}" 
                                        data-lng="${atm.longitude}">
                                      </atm-item>
                                      <a href='edit-atm/${atm.id}'>Փոփոխել</a>
                                    </div>
                                `
                                )
                                .join("")}
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
        `;
    }
}

customElements.define("all-atms-page", AllAtmsPage);
