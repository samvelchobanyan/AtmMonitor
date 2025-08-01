import { DynamicElement } from "../../core/dynamic-element.js";
import "../ui/pillItem.js";
import "./modal-popup.js";
import "./list-view.js";

class SegmentBlock extends DynamicElement {
    static get properties() {
        return ["title"];
    }

    onConnected() {
        this.state = {};
        this.selectedSegments = [];
        this._childNodes = Array.from(this.childNodes);
    }

    template() {
        this.classList.add("segment-block");

        return `
            <div class="segment-block__container">
                <div class="selected-values" style="display: none;"></div>
                <pill-item text="Ավելացնել սեգմենտ" add></pill-item>
            </div>
        `;
    }

    onAfterRender() {
        const addPill = this.$("pill-item[add]");
        if (addPill) {
            addPill.addEventListener("click", () => this._openSegmentPopup());
        }

        this.selectedValuesContainer = this.$(".selected-values");
        this._updateSelectedValuesVisibility();
    }

    _openSegmentPopup() {
        const modal = document.createElement("modal-popup");
        document.body.appendChild(modal);

        modal.setContent(`
            <div class="modal__header">
                <div class="modal__title">Ավելացնել սեգմենտ</div>
                <img class="modal__close" src="assets/img/icons/x-circle.svg" alt="Close" />
            </div>
            <div class="modal__body">
                <list-view
                    searchable
                    search-fields="text"
                    items='[
                        { "text": "ՍԱՍ Սուպերմարկետ", "value": "sas_supermarket" },
                        { "text": "Առևտրի կենտրոն", "value": "shopping_mall" },
                        { "text": "Բենզալցակայաններ", "value": "gas_stations" },
                        { "text": "Օդանավակայան", "value": "airport" },
                        { "text": "Հյուրանոցներ", "value": "hotels" },
                        { "text": "Ռեստորաններ", "value": "restaurants" },
                        { "text": "Դեղատներ", "value": "pharmacies" }
                    ]'
                    item-component="checkbox-item"
                >
                    <template>
                        <custom-checkbox id="{{value}}" value="{{value}}">{{text}}</custom-checkbox>
                    </template>
                </list-view>

                <div class="modal__buttons">
                    <button class="ok btn btn_md btn_blue btn_full"><span>Ընտրել</span></button>
                </div>
            </div>
        `);

        const closeBtn = modal.querySelector(".modal__close");
        closeBtn?.addEventListener("click", () => modal.remove());

        const okBtn = modal.querySelector(".ok");
        okBtn?.addEventListener("click", () => {
            const checkedBoxes = modal.querySelectorAll("custom-checkbox input[type='checkbox']:checked");
            const selected = Array.from(checkedBoxes).map((cb) => {
                const value = cb.value;
                const label = cb.closest("custom-checkbox").textContent.trim();
                return { value, label };
            });

            selected.forEach(({ value, label }) => {
                if (!this.selectedSegments.find((seg) => seg.value === value)) {
                    this.selectedSegments.push({ value, label });
                    this._renderPill(label, value);
                }
            });

            modal.remove();
        });
    }

    _renderPill(label, value) {
        if (!this.selectedValuesContainer) return;

        const pill = document.createElement("pill-item");
        pill.setAttribute("text", label);
        pill.setAttribute("value", value);
        pill.setAttribute("remove", "");
        pill.classList.add("selected-value");

        this.selectedValuesContainer.appendChild(pill);
        this._updateSelectedValuesVisibility();

        setTimeout(() => {
            const closeIcon = pill.querySelector(".icon-x");
            if (closeIcon) {
                closeIcon.addEventListener("click", (e) => {
                    e.stopPropagation();
                    pill.remove();
                    this.selectedSegments = this.selectedSegments.filter((seg) => seg.value !== value);
                    this._updateSelectedValuesVisibility();
                });
            }
        });
    }

    _updateSelectedValuesVisibility() {
        if (!this.selectedValuesContainer) return;
        this.selectedValuesContainer.style.display = this.selectedSegments.length ? "flex" : "none";
    }
}

customElements.define("segment-block", SegmentBlock);
