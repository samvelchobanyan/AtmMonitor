import { DynamicElement } from "../../core/dynamic-element.js";
import "./select-box.js";
import { openDateRangePopup, resolvePeriodToDates } from "../../core/utils/date-utils.js";

class SelectBoxDate extends DynamicElement {
  constructor() {
    super();
    this.selectEl = null;
  }

  static get observedAttributes() {
    return ["value"];
  }

  onConnected() {
    this.render();
  }

  onAfterRender() {
    this.selectEl = this.$("select-box");
    if (this.selectEl) {
      this.selectEl.value = this.getAttr("value", "today");
    }
  }

  addEventListeners() {
    if (this.selectEl) {
      this.addListener(this.selectEl, "change", this.onSelectChange);
    }
  }

  onSelectChange(e) {
    const val = e.target.value;
    this.setAttribute("value", val);
    if (val === "custom") {
      openDateRangePopup().then((range) => {
        if (range && range.startDate && range.endDate) {
          this.dispatch("date-range-change", { ...range, period: val });
        }
      });
    } else {
      const range = resolvePeriodToDates(val);
      if (range) {
        this.dispatch("date-range-change", { ...range, period: val });
      }
    }
  }

  template() {
    const initial = this.getAttr("value", "today");
    return /* html */`
      <select-box
        value="${initial}"
        options='[
          {"value":"today","label":"Այսօր"},
          {"value":"week","label":"Այս շաբաթ"},
          {"value":"custom","label":"Ամսաթվի միջակայք"}
        ]'>
      </select-box>
    `;
  }
}

export { SelectBoxDate };
customElements.define("select-box-date", SelectBoxDate);
