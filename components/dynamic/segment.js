import { DynamicElement } from "../../core/dynamic-element.js";
import "../ui/pillItem.js";
import "./modal-popup.js";
import "./list-view.js";

class SegmentBlock extends DynamicElement {
    onConnected() {
        this.selectedSegments = [];
        this.segmentItems = [];
        this.loading = false;
    }

    get values() {
        return this.selectedSegments.map((s) => s.value);
    }

    onStoreChange(storeState) {
        this.segmentItems = storeState.segments.map((item) => ({
            value: item.id,
            text: item.name,
            atm_segment_id: item.atm_segment_id,
        }));
    }

    template() {
        this.classList.add("segment-block");
        const containerClass = this.hasAttribute("decor")
            ? "segment-block__container segment-block__container_decor"
            : "segment-block__container";

        if (this.hasAttribute("decor")) {
            this.classList.add("segment-block_decor");
        }

        return `
            <div class="${containerClass}">
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

        modal.renderModal({
            title: "Ավելացնել սեգմենտ",
            bodyContent: `
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
            `,
            footerContent: `<button class="ok btn btn_md btn_blue btn_full"><span>Ընտրել</span></button>`,
        });

        const listView = modal.querySelector("list-view");

        this._syncCheckboxesWithSelectedSegments(listView);

        const okBtn = modal.querySelector(".ok");
        if (okBtn) {
            this.addListener(okBtn, "click", () => {
                const checkedValues = listView.getCheckedValues();

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
