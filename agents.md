# Agents Guide for Codex and Codegen

This document describes the roles, behavior, and conventions of all components, helpers, and infrastructure in this WebComponents-based microframework. It is intended for use by AI assistants like Codex to generate accurate, minimal, and compatible code.

---

## ⚙️ Framework Overview

* No build step, no Node.js, no Shadow DOM.
* All components are native Web Components using class-based syntax.
* Components live inside `components/` and extend either `StaticElement` or `DynamicElement`.
* Global store is provided in `core/store.js` (single store, namespaced keys).
* App is mounted statically and enhanced progressively.
* Routing is handled via [`page.js`](https://visionmedia.github.io/page.js/) client-side router.

---

## 🧩 Component Roles

### `<chart-component>`

* **Type**: `DynamicElement`
* **Purpose**: Renders a `line` or `doughnut` Chart.js chart.
* **Attributes**:

  * `api-url`, `start-date`, `end-date`, `city`, `region`, `chart-type`
* **Behavior**:

  * Fetches API data and transforms it using `chartDataTransformer`.
  * Creates or updates Chart.js visualizations.
  * Includes a `<select-box>` for selecting time ranges including custom date modal.

### `<simple-table>`

* **Type**: `DynamicElement`
* **Purpose**: Displays remote data using Simple-DataTables.
* **Attributes**:

  * `data-source`: API endpoint
  * `columns`: JSON array of columns to show
  * `data-key`: optional nested key to extract data
* **Behavior**:

  * Fetches and parses data on connect or attribute change.
  * Renders table markup and initializes the datatable instance.

### `<select-box>`

* **Type**: `HTMLElement`
* **Purpose**: Custom dropdown component.
* **Attributes**:

  * `value`, `options` (JSON), `searchable`, `multiple`, `tag-mode`
* **Behavior**:

  * Emits `change` event on selection.
  * Supports keyboard filtering, slot-less setup, and dynamic value setting.

---

## 🧱 Base Classes

### `StaticElement`

* Simple base class for static Web Components.
* Re-renders `innerHTML` on attribute change.
* Requires `render()` method.

### `DynamicElement`

* Lifecycle-driven, stateful base component.
* Core features:

  * `state`, `setState()`, `getAttr()`
  * `onConnected()`, `onStoreChange()`, `onAfterRender()`, `addEventListeners()`
  * `fetchData()`, `dispatch()`, `cleanup()`
  * Store subscription logic and event batching
* Intended for data-driven components.

---

## 🌍 Store Integration

* Central global store in `core/store.js`
* API:

  * `store.getState()` – returns full state
  * `store.setState(patch)` – shallow patch with validation
  * `store.subscribe(fn)` – listener for updates
  * `store.reset()` – restores `initialState`
* Keys validated against `initialState` structure (supports namespaced subkeys).

---

## 📊 Utilities

### `chartDataTransformer`

* Converts API response to Chart.js format.
* Supports:

  * `transformData()` for line charts
  * `transformDoughnutData()` for pie/doughnut
  * `transformBarData()` for bar charts
* Automatically maps internal field labels and chart structure.

### `locationTransformer`

* Used to extract province/city/district options from hierarchical data.
* Methods:

  * `getProvinceOptions()`, `getCitiesByProvince()`, `getDistrictsByCity()`
  * `getOptionsByLevel()` (unified helper)

---

## 📁 Folder Structure Overview

```
core/
  dynamic-element.js         → Dynamic base class
  static-element.js          → Static base class
  store.js                   → Global app state

components/
  dynamic/                   → Stateful components (e.g. chartComponent.js)
  static/                    → Pure layout blocks (e.g. infoCard.js)
  ui/                        → UI widgets (e.g. select-box, simple-table)

pages/
  atms-dashboard.js          → Route-based containers

utils/
  data-transformer.js        → Chart adapter
  location-transformer.js    → Location tree helper
```

---

## 🧠 Codex Usage Recommendations

When generating code for this framework:

* ✅ Use `class`-based custom elements and `customElements.define()`.
* ✅ Extend `DynamicElement` for anything that has state or API logic.
* ✅ Use `this.setState()` to trigger re-renders.
* ✅ Use `this.getAttr('name')` for safe attribute access.
* ✅ Use `template()` or `render()` to build HTML.
* ✅ Style globally — no Shadow DOM should be used.
* ✅ Lazy-load third-party libraries (e.g., via CDN).
* ❌ Do not use JSX, build tools, or frameworks (no React/Vue/Svelte).
* ❌ Avoid global side-effects — isolate logic inside components.

---

## 🧪 Codex Prompt Examples

To help guide generation:

```
"Create a DynamicElement Web Component that loads ATM data from /api/atms and displays a simple HTML table."

"Extend chart-component to support 'bar' chart-type and fetch from a new endpoint."

"Create a select-box that loads province/city options from the store and updates on user selection."

"Add a 'reload' button to chart-component that re-fetches data on click."
```

---
