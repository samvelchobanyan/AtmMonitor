// components/ui/simpleTable.js
import { DynamicElement } from "../../core/dynamic-element.js";
import tableTransformer from "../../core/utils/table-transformer.js";

// Lazy-load Simple-DataTables once for all instances
let dataTableModulePromise = null;
function loadDataTableModule() {
    if (!dataTableModulePromise) {
        dataTableModulePromise = import(
            "https://cdn.jsdelivr.net/npm/simple-datatables@9.0.4/dist/module.js"
        ).then((mod) => {
            // Normalize the exports
            const DataTable = mod.DataTable || mod.default;
            const { exportCSV, exportJSON, exportSQL } = mod;
            return { DataTable, exportCSV, exportJSON, exportSQL };
        });
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
            error: false,
        };
        this.datatableInstance = null;
    }

    static get observedAttributes() {
        return [
            "data-source",
            "columns",
            "clickable-columns",
            "per-page",
            "per-page-select",
            "searchable",
            "data",
        ];
    }

    async onConnected() {
        const dataStr = this.getAttr("data");
        if (dataStr) {
            let raw = JSON.parse(dataStr);
            this.transformData(raw);
        }
    }

    async onAttributeChange(name, oldVal, newVal) {
        if (name === "data-source" && oldVal !== newVal) {
            await this.loadRemoteData();
        }
        if (name === "data" && oldVal !== newVal) {
            let raw = JSON.parse(newVal);
            this.transformData(raw);
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

            console.log("raw", raw);

            this.transformData(raw);
            // const transformed = tableTransformer.transformFaultTableData(raw);

            // const definedColumns = this.parseColumnsAttr();
            // const columns = definedColumns.length
            //     ? definedColumns
            //     : Object.keys(transformed[0] || {});

            // this.setState({ data: transformed, columns, loading: false });
        } catch (err) {
            console.warn("Failed to load or transform table data", err);
            this.setState({ loading: false, error: true });
        }
    }

    transformData(raw) {
        const transformed = tableTransformer.transformFaultTableData(raw);

        const definedColumns = this.parseColumnsAttr();
        const columns = definedColumns.length ? definedColumns : Object.keys(transformed[0] || {});

        this.setState({ data: transformed, columns, loading: false });
    }

    onAfterRender() {
        if (this.datatableInstance) {
            this.datatableInstance.destroy();
            this.datatableInstance = null;
        }
        const searchable = this.getAttribute("searchable") === "false" ? false : true;
        if (this.$("table")) {
            loadDataTableModule().then((sdtLib) => {
                this.sdtLib = sdtLib;

                this.datatableInstance = new this.sdtLib.DataTable(this.$("table"), {
                    perPage: this.getPerPageOption() || 10,
                    perPageSelect: this.getPerPageSelectOption(),
                    sortable: true,
                    sessionStorage: false,
                    searchable,
                    labels: {
                        placeholder: "Փնտրել...",
                        perPage: "Տողեր յուրաքանչյուր էջում",
                        noRows: "Տվյալներ չկան",
                        info: "Ցուցադրված են {start}–{end} տողերը՝ ընդհանուր {rows}-ից",
                    },
                });

                // Listen to Simple-DataTables events to re-attach click listeners after pagination/sort/search
                this.datatableInstance.on("datatable.page", () => {
                    this.addEventListeners();
                });
                this.datatableInstance.on("datatable.sort", () => this.addEventListeners());
                this.datatableInstance.on("datatable.search", () => this.addEventListeners());

                // Attach listeners initially
                this.addEventListeners();
            });
        }
    }

    addEventListeners() {
        // console.log("adding event listners");
        this.clearEventListeners();
        const table = this.$("table");
        if (!table) return;

        // CSV export button
        const exportBtn = this.$(".csv-export-btn");
        if (exportBtn) {
            this.addListener(exportBtn, "click", () => {
                const filenameBase = (this.getAttr("export-filename") || "export").replace(
                    /\.csv$/i,
                    ""
                );
                console.log("this.sdtLib", this.sdtLib);

                if (this.sdtLib?.exportCSV && this.datatableInstance) {
                    this.sdtLib.exportCSV(this.datatableInstance, {
                        download: true,
                        filename: filenameBase,
                        columnDelimiter: ";", // optional
                    });
                    // this.datatableInstance.export({
                    //     type: "csv",
                    //     filename: filenameBase,
                    //     download: true,
                    // });
                } else {
                    console.warn(
                        "Simple-DataTables export() is not available. Ensure the export plugin is loaded or implement your own CSV generation."
                    );
                }
            });
        }

        const clickable = this.parseClickableColumnsAttr();
        const colIndices = clickable
            .map((col) => this.state.columns.indexOf(col))
            .filter((i) => i !== -1);

        this.$$("tbody tr").forEach((rowEl) => {
            const cells = rowEl.children;

            colIndices.forEach((i) => {
                const cell = cells[i];
                if (!cell) return;
                cell.classList.add("clickable");

                this.addListener(cell, "click", (event) => {
                    const clickedRow = event.target.closest("tr");
                    const rowIndex = parseInt(clickedRow.getAttribute("data-row-index"), 10);

                    const rowData = this.state.data[rowIndex];
                    const column = this.state.columns[i];
                    const cellValue = rowData ? rowData[column] : null;

                    this.dispatch("cell-click", { column, cellValue, rowData });
                });
            });
        });
    }

    template() {
        if (this.state.error) {
            return `<div class="error">Տվյալների բերնման սխալ</div>`;
        }

        if (this.state.loading) {
            return `<div class="loading">Տվյալները բեռնվում են…</div>`;
        }

        if (!this.state.columns || !this.state.data) {
            return `<div class="empty">No data available</div>`;
        }

        const linkCols = (() => {
            try {
                const raw = this.getAttr("link-columns");
                return raw ? JSON.parse(raw) : {};
            } catch (e) {
                return {};
            }
        })();

        // take translated column labels from column-labels attr
        const labels = (() => {
            try {
                const raw = this.getAttr("column-labels");
                return raw ? JSON.parse(raw) : {};
            } catch {
                return {};
            }
        })();

        const header = this.state.columns.map((c) => `<th>${labels[c] || c}</th>`).join("");

        const rows = this.state.data
            .map((row, index) => {
                const cells = this.state.columns
                    .map((col) => {
                        let cellValue = row[col] ?? "";
                        console.log("cellValue", cellValue);

                        // for notifications redirect
                        // If column is in link-columns → wrap in <a>
                        if (linkCols[col]) {
                            // extract ID (first part before "/")
                            const id = String(cellValue)
                                .split("/")[0]
                                .trim();

                            const href = linkCols[col].replace(":id", id);

                            return `<td><a href="${href}">${cellValue}</a></td>`;
                        }

                        return `<td>${cellValue}</td>`;
                    })
                    .join("");

                return `<tr data-row-index="${index}">${cells}</tr>`;
            })
            .join("");

        const showExport = this.hasAttribute("exportable");
        const exportLabel = this.getAttr("export-label") || "Ներբեռնել CSV-ն";

        return /* html */ `
      <table class="data-table">
        <thead><tr>${header}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${
          showExport
              ? `<div class="table-actions "><button type="button" class="csv-export-btn btn btn_fit btn_blue btn_md">${exportLabel}</button></div>`
              : ``
      }
    `;
    }
}

customElements.define("simple-table", SimpleTable);
