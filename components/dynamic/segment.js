import { DynamicElement } from "../../core/dynamic-element.js";
import "../ui/pillItem.js";
import "./modal-popup.js";
import "./list-view.js";

class SegmentBlock extends DynamicElement {
    onConnected() {
        this.selectedSegments = [];
        this.segmentItems = [];
        this.loading = false;
        this.fetchSegments();
    }

    get values() {
        return this.selectedSegments.map((s) => s.value);
    }

    async fetchSegments() {
        try {
            const response = await this.fetchData("/atm/segments");

            this.segmentItems = response.data.map((item) => ({
                value: item.id,
                text: item.name,
                atm_segment_id: item.atm_segment_id,
            }));
        } catch (err) {
            console.error("❌ Error fetching segmentItems:", err);
            this.segmentItems = [];
        }
    }

    template() {
        this.classList.add("segment-block");

        return `
            <div class="segment-block__container">
                <pill-item text="Ավելացնել սեգմենտ" add></pill-item>
                <div class="selected-values" style="display: none;"></div>
            </div>
        `;
    }

    onAfterRender() {
        const addPill = this.$("pill-item[add]");
        if (addPill) {
            this.addListener(addPill, "click", this._openSegmentPopup);
        }

        this.selectedValuesContainer = this.$(".selected-values");
        this._updateSelectedValuesVisibility();
    }

    _openSegmentPopup() {
        const modal = document.createElement("modal-popup");
        document.body.appendChild(modal);

        const items = this.segmentItems;

        modal.setContent(`
            <div class="modal__header">
                <div class="modal__title">Ավելացնել սեգմենտ</div>
                <img class="modal__close" src="assets/img/icons/x-circle.svg" alt="Close" />
            </div>
            <div class="modal__body">
                <list-view
                    searchable
                    search-fields="text"
                    items='${JSON.stringify(items)}'
                    item-component="checkbox-item"
                >
                    <template>
                        <custom-checkbox id="{{value}}" value="{{value}}">{{text}}</custom-checkbox>
                    </template>
                </list-view>
            </div>
            <div class="modal__buttons">
                <button class="ok btn btn_md btn_blue btn_full"><span>Ընտրել</span></button>
            </div>
        `);

        const listView = modal.querySelector("list-view");

        this._syncCheckboxesWithSelectedSegments(listView);

        const closeBtn = modal.querySelector(".modal__close");
        if (closeBtn) {
            this.addListener(closeBtn, "click", () => modal.remove());
        }

        const okBtn = modal.querySelector(".ok");
        if (okBtn) {
            this.addListener(okBtn, "click", () => {
                const checkedValues = listView.getCheckedValues();
                console.log("checkedValues", checkedValues);

                // Remove unchecked pills
                this.selectedSegments = this.selectedSegments.filter((segment) => {
                    if (!checkedValues.includes(segment.value)) {
                        this._removePillByValue(segment.value);
                        return false;
                    }
                    return true;
                });

                // Add new pills
                const itemsData = JSON.parse(listView.getAttribute("items"));

                checkedValues.forEach((value) => {
                    if (!this.selectedSegments.find((seg) => seg.value == value)) {
                        const itemData = itemsData.find((item) => item.value == value);
                        if (itemData) {
                            this.selectedSegments.push({ value, label: itemData.text });
                            this._renderPill(itemData.text, value);
                        }
                    }
                });

                this._updateSelectedValuesVisibility();
                modal.remove();
            });
        }
    }

    _syncCheckboxesWithSelectedSegments(listView) {
        const values = this.selectedSegments.map((seg) => seg.value);
        listView.setCheckedValues(values);
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
                this.addListener(closeIcon, "click", (e) => {
                    e.stopPropagation();
                    pill.remove();
                    this.selectedSegments = this.selectedSegments.filter(
                        (seg) => seg.value !== value
                    );
                    this._updateSelectedValuesVisibility();
                });
            }
        });
    }

    _removePillByValue(value) {
        const pill = this.selectedValuesContainer?.querySelector(`pill-item[value="${value}"]`);
        if (pill) {
            pill.remove();
        }
    }

    _updateSelectedValuesVisibility() {
        if (!this.selectedValuesContainer) return;
        this.selectedValuesContainer.style.display = this.selectedSegments.length ? "flex" : "none";
    }
}

customElements.define("segment-block", SegmentBlock);
