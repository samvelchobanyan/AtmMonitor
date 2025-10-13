import { DynamicElement } from "../core/dynamic-element.js";

class AnalyticsView extends DynamicElement {
  template() {
    return `
      <section>
        <h2>Analytics</h2>
        <p>This page will host analytics widgets.</p>
      </section>
    `;
  }
}

customElements.define("analytics-view", AnalyticsView);
