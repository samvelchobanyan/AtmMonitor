import { DynamicElement } from "../core/dynamic-element.js";
import { api } from "../core/api-client.js";
import "../components/dynamic/select-box-search.js";
import encode from "../assets/js/utils/encode.js";
import "../components/dynamic/yandex-address.js";
import "../components/ui/customCheck.js";
import "../components/ui/selectBox.js";

class SegmentsPage extends DynamicElement {
    constructor() {
        super();

        this.segments = null;
    }

    onStoreChange(storeState) {
        this.segments = storeState.segments.map((item) => ({
            value: item.id,
            text: item.name,
        }));
    }

    addEventListeners() {
        const addBtn = this.$(".add-segment-btn");
        if (addBtn)
            addBtn.addEventListener("click", () => {
                console.log("add");
            });
    }

    template() {
        if (this.segments?.length == 0) {
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

        console.log("this.segments", this.segments);

        return /* html */ `
        <div class="row">
            <div class="column">

                <div class="container">
                    <div class="segments-page">
                        <div class="segments-header">
                            <h2>Սեգմենտներ</h2>
                            <button class="btn btn_blue add-segment-btn">+ Ավելացնել</button>
                        </div>

                        <div class="segments-list">
                            ${this.segments
                                .map(
                                    (seg) => `
                                    <div class="segment-card">
                                        <div class="segment-name">${seg.text}</div>
                                        <div class="segment-id">ID: ${seg.value}</div>
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

customElements.define("segments-page", SegmentsPage);
