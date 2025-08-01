import { DynamicElement } from "../../core/dynamic-element.js";
import "./select-box.js";
import "../ui/pillItem.js";

class SelectBoxSearch extends DynamicElement {
    constructor() {
        super();
        this.selectEl = null;
        this.selectedDiv = null;
        this.selectedValues = [];
        this.optionsMap = new Map();
        this.allOptions = [];
    }

    static get observedAttributes() {
        return ["value", "options", "placeholder"];
    }

    onAfterRender() {
        this.selectEl = this.$("select-box");

        if (this.selectEl) {
            const value = this.getAttr("value", null);
            const placeholder = this.getAttr("placeholder", "Select an option");
            const options = this.getAttr("options", "[]");

            this.selectEl.setAttribute("placeholder", placeholder);
            this.selectEl.value = "";

            this.selectedDiv = this.querySelector(".selected-values");
            if (!this.selectedDiv) {
                this.selectedDiv = document.createElement("div");
                this.selectedDiv.className = "selected-values";
                this.selectedDiv.style.display = "none";
                this.selectEl.insertAdjacentElement("afterend", this.selectedDiv);
            }

            this._parseOptions(options);

            if (value) {
                this._initializeSelectedValues(value);
            } else {
                this.selectedDiv.innerHTML = "";
            }

            this._updateAvailableOptions();
        }
    }

    onAttributeChange(name, oldValue, newValue) {
        if (name === "options" && this.selectEl) {
            this._parseOptions(newValue);
            this._updateAvailableOptions();
        }
    }

    _parseOptions(options) {
        try {
            const optionsList = JSON.parse(options);
            this.optionsMap.clear();
            this.allOptions = optionsList;

            optionsList.forEach((opt) => {
                if (typeof opt === "string") {
                    this.optionsMap.set(opt, opt);
                } else {
                    this.optionsMap.set(opt.value, opt.label || opt.text || opt.value);
                }
            });
        } catch (e) {
            console.error("Error parsing options", e);
            this.optionsMap.clear();
            this.allOptions = [];
        }
    }

    _initializeSelectedValues(value) {
        try {
            const initialValues = JSON.parse(value);

            if (Array.isArray(initialValues)) {
                this.selectedValues = initialValues.map((val) => ({
                    value: val,
                    displayText: this.optionsMap.get(val) || val,
                }));
            } else {
                this.selectedValues = [
                    {
                        value: value,
                        displayText: this.optionsMap.get(value) || value,
                    },
                ];
            }
        } catch {
            this.selectedValues = [
                {
                    value: value,
                    displayText: this.optionsMap.get(value) || value,
                },
            ];
        }
        this.renderSelectedValues();
    }

    _updateAvailableOptions() {
        if (!this.selectEl) return;

        const selectedValuesList = this.selectedValues.map((item) => item.value);

        const availableOptions = this.allOptions.filter((opt) => {
            const optValue = typeof opt === "string" ? opt : opt.value;
            return !selectedValuesList.includes(optValue);
        });

        this.selectEl.setAttribute("options", JSON.stringify(availableOptions));
        this._forceSelectBoxRebuild();
    }

    _forceSelectBoxRebuild() {
        if (!this.selectEl) return;

        const optionsWrapper = this.selectEl.querySelector(".combo-box-options");
        if (optionsWrapper) {
            optionsWrapper.innerHTML = "";
        }

        const optionsAttr = this.selectEl.getAttribute("options");
        if (optionsAttr) {
            try {
                const options = JSON.parse(optionsAttr);
                this.selectEl._options = options.map((opt) => {
                    const optEl = document.createElement("div");
                    optEl.className = "combo-option";

                    if (typeof opt === "string") {
                        optEl.setAttribute("data-option-value", opt);
                        optEl.textContent = opt;
                    } else {
                        optEl.setAttribute("data-option-value", opt.value);
                        optEl.textContent = opt.label || opt.text || opt.value;
                        if (opt.selected) optEl.classList.add("selected");
                    }

                    optionsWrapper.appendChild(optEl);
                    return optEl;
                });
            } catch (e) {
                console.error("Error rebuilding options", e);
            }
        }
    }

    addEventListeners() {
        if (this.selectEl) {
            this.addListener(this.selectEl, "change", this.onSelectChange);
        }
    }

    onSelectChange(e) {
        const selectedValue = this.selectEl.value;
        if (!selectedValue) return;

        const isAlreadySelected = this.selectedValues.some((item) => item.value === selectedValue);
        if (!isAlreadySelected) {
            this.selectedValues.push({
                value: selectedValue,
                displayText: this.optionsMap.get(selectedValue) || selectedValue,
            });
        }

        this.renderSelectedValues();
        this.selectEl.value = "";
        this._updateValueAttribute();
        this._updateAvailableOptions();
        this._dispatchEvents(selectedValue);
    }

    _updateValueAttribute() {
        const valuesArray = this.selectedValues.map((item) => item.value);
        this.setAttribute("value", JSON.stringify(valuesArray));
    }

    _dispatchEvents(selectedValue) {
        this.dispatchEvent(
            new CustomEvent("option-selected", {
                bubbles: true,
                detail: {
                    value: selectedValue,
                    values: this.selectedValues.map((item) => item.value),
                    items: this.selectedValues,
                },
            })
        );

        this.dispatch("select-change", {
            value: selectedValue,
            values: this.selectedValues.map((item) => item.value),
            items: this.selectedValues,
        });
    }

    renderSelectedValues() {
        if (!this.selectedDiv) return;

        this.selectedDiv.innerHTML = "";

        if (this.selectedValues.length === 0) {
            this.selectedDiv.style.display = "none";
        } else {
            this.selectedDiv.style.display = "flex";
        }

        this.selectedValues.forEach((item) => {
            const pill = document.createElement("pill-item");
            pill.setAttribute("text", item.displayText);
            pill.setAttribute("value", item.value);
            pill.setAttribute("remove", "");
            pill.className = "selected-value";

            setTimeout(() => {
                const closeIcon = pill.querySelector(".icon-x");
                if (closeIcon) {
                    closeIcon.addEventListener("click", (e) => {
                        e.stopPropagation();
                        this.selectedValues = this.selectedValues.filter((v) => v.value !== item.value);
                        this._updateValueAttribute();
                        this._updateAvailableOptions();
                        this._dispatchEvents(null);
                    });
                }
            });

            this.selectedDiv.appendChild(pill);
        });
    }

    template() {
        const options = this.getAttr("options", "[]");
        const placeholder = this.getAttr("placeholder", "Select an option");

        return /* html */ `
            <select-box
                searchable
                placeholder="${placeholder}"
                options='${options}'>
            </select-box>
        `;
    }
}

customElements.define("select-box-search", SelectBoxSearch);

export { SelectBoxSearch };
