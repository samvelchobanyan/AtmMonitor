// components/ui/simpleTable.js
import { DynamicElement } from "../../core/dynamic-element.js";
import tableTransformer from "../../core/utils/table-transformer.js";

// Lazy-load Simple-DataTables once for all instances
let dataTableModulePromise = null;
function loadDataTableModule() {
  if (!dataTableModulePromise) {
    dataTableModulePromise = import("https://cdn.jsdelivr.net/npm/simple-datatables@latest/dist/module.js");
  }
  return dataTableModulePromise;
}

export class SimpleTable extends DynamicElement {
  constructor() {
    super();
    this.state = {
      data: [],
      columns: [],
      loading: false,
      error: false
    };
    this.datatableInstance = null;
  }

  static get observedAttributes() {
    return ["data-source", "columns", "clickable-columns", "per-page", "per-page-select"];
  }

  async onConnected() {
    const url = this.getAttr("data-source");
    if (url) await this.loadRemoteData();
  }

  async onAttributeChange(name, oldVal, newVal) {
    if (name === "data-source" && oldVal !== newVal) {
      await this.loadRemoteData();
    }
    if (name === "columns" && oldVal !== newVal) {
      const parsed = this.parseColumnsAttr();
      if (parsed) this.setState({ columns: parsed });
    }
  }

  parseColumnsAttr() {
    try {
      const raw = this.getAttr("columns");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn("Invalid columns attribute JSON", e);
      return [];
    }
  }

  parseClickableColumnsAttr() {
    try {
      const raw = this.getAttr("clickable-columns");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn("Invalid clickable-columns attribute JSON", e);
      return [];
    }
  }

  getPerPageOption() {
    const raw = this.getAttr("per-page");
    const val = parseInt(raw, 10);
    return isNaN(val) ? 0 : val;
  }

  getPerPageSelectOption() {
    const raw = this.getAttr("per-page-select");
    if (raw === "false" || raw === "0") return false;
    return [5, 10, 15, 25, 50]; // Default options
  }

  async loadRemoteData() {
    this.setState({ loading: true, error: false });
    const url = this.getAttr("data-source");

    try {
      const raw = await this.fetchData(url);
      const transformed = tableTransformer.transformFaultTableData(raw);

      const definedColumns = this.parseColumnsAttr();
      const columns = definedColumns.length ? definedColumns : Object.keys(transformed[0] || {});

      this.setState({ data: transformed, columns, loading: false });
    } catch (err) {
      console.warn("Failed to load or transform table data", err);
      this.setState({ loading: false, error: true });
    }
  }

  onAfterRender() {
    if (this.datatableInstance) {
      this.datatableInstance.destroy();
      this.datatableInstance = null;
    }

    if (this.$("table")) {
      loadDataTableModule().then(module => {
        this.datatableInstance = new module.DataTable(this.$("table"),{
          perPage: this.getPerPageOption(),
          perPageSelect: this.getPerPageSelectOption(),
          searchable: true,     // disables search box
          sortable: true         // optional: keep sorting
        });
      });
    }
  }

  addEventListeners() {
    const table = this.$("table");
    if (!table) return;

    const clickable = this.parseClickableColumnsAttr();
    const colIndices = clickable.map(col => this.state.columns.indexOf(col)).filter(i => i !== -1);

    this.$$("tbody tr").forEach((rowEl, rowIndex) => {
      const rowData = this.state.data[rowIndex];
      const cells = rowEl.children;
      colIndices.forEach(i => {
        const cell = cells[i];
        if (!cell) return;
        cell.classList.add("clickable");
        this.addListener(cell, "click", () => {
          this.dispatch("cell-click", {
            column: this.state.columns[i],
            cellValue: rowData[this.state.columns[i]],
            rowData
          });
        });
      });
    });
  }

  template() {
    if (this.state.error) {
      return `<div class="error">Failed to load table data.</div>`;
    }

    if (this.state.loading) {
      return `<div class="loading">Loading table…</div>`;
    }

    if (!this.state.columns.length || !this.state.data.length) {
      return `<div class="empty">No data available</div>`;
    }

    const header = this.state.columns.map(c => `<th>${c}</th>`).join("");
    const rows = this.state.data.map(row => {
      const cells = this.state.columns.map(col => `<td>${row[col] ?? ""}</td>`).join("");
      return `<tr>${cells}</tr>`;
    }).join("");

    return /* html */`
      <table class="data-table">
        <thead><tr>${header}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }
}

customElements.define("simple-table", SimpleTable);
