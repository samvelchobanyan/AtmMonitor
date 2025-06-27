export class SelectBox extends HTMLElement {
    static get observedAttributes() {
        return ["value", "options"];
    }

    constructor() {
        super();
        this.options = [];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "options") {
            this.options = JSON.parse(newValue);
        }
        this.render();
    }

    render() {
        const value = this.getAttribute("value") || this.options[0]?.value || "";
        const selectedOption = this.options.find((opt) => opt.value === value) || this.options[0] || null;
        const selectedLabel = selectedOption ? selectedOption.label : "";

        this.classList.add("custom-select");

        this.innerHTML = /* html */ `
            <div class="combo-box" data-combo-name="single" data-combo-value="${selectedOption ? selectedOption.value : ""}">
              <div class="combo-box-selected">
                <div class="combo-box-selected-wrap">
                  <span class="combo-box-placeholder">${selectedLabel}</span>
                </div>
              </div>
                <div class="combo-box-dropdown">
                  <div class="combo-box-options">
                    ${
                        this.options.length > 0
                            ? this.options
                                  .map(
                                      (opt) => `
                          <div class="combo-option${opt.value === (selectedOption ? selectedOption.value : "") ? " selected" : ""}" data-option-value="${opt.value}">
                            <span>${opt.label}</span>
                          </div>
                        `
                                  )
                                  .join("")
                            : '<div class="combo-option disabled">No options available</div>'
                    }
                  </div>
              </div>
            </div>
    `;
    }
}

customElements.define("select-box", SelectBox);
