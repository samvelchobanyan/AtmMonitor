// components/dynamic/simpleGrid.js
import { DynamicElement } from "../../core/dynamic-element.js";
import tableTransformer from "../../core/utils/table-transformer.js";
import { api } from "../../core/api-client.js";

// Lazy-load Grid.js once for all instances
let gridJsModulePromise = null;
function loadGridJsModule() {
    if (!gridJsModulePromise) {
        gridJsModulePromise = import("https://cdn.jsdelivr.net/npm/gridjs/dist/gridjs.module.js");
    }
    return gridJsModulePromise;
}

// Inject Grid.js CSS once
let gridJsCssInjected = false;
function ensureGridJsCss() {
    if (gridJsCssInjected) return;
    const id = "gridjs-css";
    if (!document.getElementById(id)) {
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = "https://cdn.jsdelivr.net/npm/gridjs/dist/theme/mermaid.min.css";
        document.head.appendChild(link);
    }
    gridJsCssInjected = true;
}

export class SimpleGrid extends DynamicElement {
    constructor() {
        super();
        this.state = {
            data: [],
            columns: [],
            loading: false,
            error: false,
            mode: "client", // client | server
            perPage: 10,
        };
        this.grid = null;
    }

    static get observedAttributes() {
        return [
            "data-source",
            "data-type",
            "columns",
            "clickable-columns",
            "mode",
            "per-page",
            "exportable",
            "data",
        ];
    }

    async onConnected() {
        ensureGridJsCss();
        const dataAttr = this.getAttr("data");
        if (dataAttr) {
            this.handleDataAttribute(dataAttr);
            return;
        }
        const url = this.getAttr("data-source");
        if (url) await this.loadData();
    }

    addEventListeners() {
        const grid = this.$(".grid-container");

        if (!grid) return;

        const exportBtn = this.$(".csv-export-btn");
        if (exportBtn) {
            this.addListener(exportBtn, "click", async () => {
                const event = new CustomEvent("export-clicked", {
                    detail: { url: "" },
                    bubbles: true,
                    cancelable: true,
                });
                this.dispatchEvent(event);

                const finalUrl = event.detail.url;
                if (!finalUrl) return;

                try {
                    const response = await this.fetchData(finalUrl, {
                        method: "GET",
                        headers: { Accept: "*/*" },
                        asBlob: true, // 👈 Important
                    });

                    const blob = await response.blob();

                    // ✅ Extract filename
                    let filename = "export.xlsx";
                    const disposition = response.headers.get("Content-Disposition");
                    if (disposition && disposition.includes("filename=")) {
                        const match = disposition.match(/filename="?([^";]+)"?/);
                        if (match) filename = match[1];
                    }

                    // ✅ Trigger download
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    URL.revokeObjectURL(link.href);
                } catch (err) {
                    console.error("❌ Export failed:", err);
                    alert("Չհաջողվեց ներբեռնել ֆայլը։");
                }
            });
        }
    }

    async onAttributeChange(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        if (name === "data-source" || name === "data-type") {
            await this.loadData();
            return;
        }
        if (name === "data") {
            this.handleDataAttribute(newVal);
            return;
        }
        if (name === "columns") {
            const parsed = this.parseColumnsAttr();
            if (parsed) this.setState({ columns: parsed });
            return;
        }
        if (name === "mode") {
            this.setState({ mode: this.getModeOption() });
            return;
        }
        if (name === "per-page") {
            this.setState({ perPage: this.getPerPageOption() });
            return;
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

    handleDataAttribute(raw) {
        try {
            const dataType = this.getAttr("data-type") || '';
            const data = tableTransformer.transformTableData(JSON.parse(raw), dataType);
            const columns = JSON.parse(this.getAttr("columns"));
            if (!data.length) return;

            this.setState({
                data,
                columns,
                loading: false,
                error: false,
            });
        } catch (err) {
            console.warn("Invalid 'data' attribute JSON", err);
            this.setState({ error: true, loading: false });
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

    getModeOption() {
        const raw = (this.getAttr("mode") || "client").toLowerCase();
        return raw === "server" ? "server" : "client";
    }

    getPerPageOption() {
        const raw = this.getAttr("per-page");
        const val = parseInt(raw, 10);
        return isNaN(val) ? 10 : val;
    }

    async loadData() {
        const mode = this.getModeOption();
        this.setState({
            loading: true,
            error: false,
            mode,
            perPage: this.getPerPageOption(),
        });

        const url = this.getAttr("data-source");
        if (!url) {
            this.setState({ loading: false, error: true });
            return;
        }

        if (mode === "client") {
            try {
                const raw = await this.fetchData(url);
                const dataType = this.getAttr("data-type") || '';
                const transformed = tableTransformer.transformTableData(raw, dataType) || [];

                const definedColumns = this.parseColumnsAttr();
                const columns = definedColumns.length
                    ? definedColumns
                    : Object.keys(transformed[0] || {});
                this.setState({ data: transformed, columns, loading: false });
            } catch (err) {
                console.warn("Failed to load or transform grid data", err);
                this.setState({ loading: false, error: true });
            }
        } else {
            // server mode defers data loading to Grid.js server config
            try {
                // Probe once to derive columns if not provided
                const definedColumns = this.parseColumnsAttr();
                let columns = definedColumns;
                if (!columns.length) {
                    try {
                        const raw = await this.fetchData(url);
                        const dataType = this.getAttr("data-type") || '';
                        const transformed = tableTransformer.transformTableData(raw, dataType) || [];
                        columns = Object.keys(transformed[0] || {});
                    } catch (_) {
                        // ignore probe error; grid server mode may still work
                    }
                }
                this.setState({ columns, loading: false });
            } catch (err) {
                console.warn("Failed to initialize server grid", err);
                this.setState({ loading: false, error: true });
            }
        }
    }

    parseColumnLabelsAttr() {
        try {
            const raw = this.getAttr("column-labels");
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            console.warn("Invalid column-labels attribute JSON", e);
            return {};
        }
    }

    parseColumnFormattersAttr() {
        try {
            const raw = this.getAttr("column-formatters");
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            console.warn("Invalid column-formatters attribute JSON", e);
            return {};
        }
    }

    // NEW: Hidden columns parser
    parseHiddenColumnsAttr() {
        try {
            const raw = this.getAttr("hidden-columns");
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.warn("Invalid hidden-columns attribute JSON", e);
            return [];
        }
    }

    // NEW: Column conditions parser
    parseColumnConditionsAttr() {
        try {
            const raw = this.getAttr("column-conditions");
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            console.warn("Invalid column-conditions attribute JSON", e);
            return {};
        }
    }

    // NEW: Row conditions parser (universal row-level rules)
    parseRowConditionsAttr() {
        try {
            const raw = this.getAttr("row-conditions");
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.warn("Invalid row-conditions attribute JSON", e);
            return [];
        }
    }

	// NEW: Minimal evaluator for simple conditions (used by column-conditions)
	evaluateSimple(when, value) {
		if (when === "isTrue") {
			return value === true || value === "true" || value === 1 || value === "1";
		}
		if (when === "notNull") {
			return value !== null && value !== undefined && String(value).trim() !== "";
		}
		if (when === "isNull") {
			return value === null || value === undefined || String(value).trim() === "";
		}
		return false;
	}

    // Build conditional formatter per column
    getConditionalFormatter(colName, conditionsMap, rowConditions, h) {
        const colRules = conditionsMap[colName] || [];
        const rowRules = Array.isArray(rowConditions) ? rowConditions : [];

        // row rules first so they take precedence, then column-specific rules
        const rules = [...rowRules, ...colRules];
        if (!rules.length) return null;

        return (cell, rowObj) => {
            for (const rule of rules) {
                const key = (rule?.field || "").replace(/^row\./, "");
                const v = rowObj[key];
                if (!this.evaluateSimple(rule?.when, v)) continue;

                const tag = rule.tag || "span";
                const cls = rule.class || "";
                const text = (rule.text ?? String(cell ?? "")).replaceAll("{{value}}", String(cell ?? ""));


                // row-conditions get full-cell inline sizing; color comes from the class
                const isRowRule = rule.__rowRule === true;
                const style = isRowRule ? "display:block;width:100%;height:100%;" : undefined;

                if (tag === "button") {
                    return h("button", {
                        className: cls,
                        style,
                        onclick: () => {
                            this.dispatch("cell-action", {
                                column: colName,
                                cellValue: rowObj[colName],
                                rowData: rowObj,
                                rule,
                            });
                        },
                    }, text);
                }
                return h(tag, { className: cls, style }, text);
            }
            return null;
        };
    }

    getValueFormatter(colName, map) {
        const spec = map[colName];
        if (spec !== "currency") return null;

        const formatCommas = (val) => {
            if (val === null || val === undefined || val === "") return "";
            const num =
                typeof val === "number"
                    ? val
                    : Number(String(val).replace(/\s/g, "").replace(/,/g, ""));
            if (Number.isNaN(num)) return val;
            return num.toLocaleString();
        };

        return (v) => formatCommas(v);
    }

    onAfterRender() {
        // Destroy old grid if exists to avoid duplicates
        if (this.grid && typeof this.grid.destroy === "function") {
            try {
                this.grid.destroy();
            } catch {}
            this.grid = null;
        }

        if (this.state.error) return;
        if (!this.state.columns.length) return;

        const mountPoint = this.$(".grid-container");
        if (!mountPoint) return;

        // Generate unique scope class once per instance
        if (!this._scopeClass) {
            const hostId = this.id?.trim();
            if (hostId) {
                this._scopeClass = `grid-scope-${hostId}`;
            } else {
                this._scopeClass = `grid-scope-${Math.random().toString(36).slice(2)}`;
            }
        }

        loadGridJsModule().then((module) => {
            const { Grid, h } = module;

            const includeSerial = this.hasAttribute("serial");

            const clickableColumns = this.parseClickableColumnsAttr();
            const clickableSet = new Set(clickableColumns);
            const labels = this.parseColumnLabelsAttr();
            const formattersMap = this.parseColumnFormattersAttr();

            const conditionsMap = this.parseColumnConditionsAttr();
            const rawRowConditions = this.parseRowConditionsAttr();
            const rowConditions = Array.isArray(rawRowConditions)
                ? rawRowConditions.map((r) => ({ ...r, __rowRule: true }))
                : [];

            // Fixed/narrow widths for specific columns (others use auto width)
            const fixedWidths = {
                // atm_id: "80px",
                // date: "100px",
                // balance_amd: "50px",
                // balance_usd: "50px",
                // balance_eur: "50px",
                // balance_rub: "50px",               
            };

            const gridColumns = this.state.columns.map((colName) => {
                const displayName = labels[colName] || colName;
                const valueFormatter = this.getValueFormatter(colName, formattersMap);
                const conditionalFormatter = this.getConditionalFormatter(
                    colName,
                    conditionsMap,
                    rowConditions,
                    h
                );

                const baseConfig = {
                    name: displayName,
                };

                if (fixedWidths[colName]) {
                    baseConfig.width = fixedWidths[colName];
                }

                if (!clickableSet.has(colName)) {
                    return {
                        ...baseConfig,
                        formatter: (cell, row) => {
                            const rowObj = this.rowArrayToObject(
                                row.cells.map((c) => c.data)
                            );

                            const display = valueFormatter
                                ? valueFormatter(cell, row)
                                : cell ?? "";

                            const conditional = conditionalFormatter
                                ? conditionalFormatter(display, rowObj)
                                : null;

                            if (conditional) return conditional;
                            return display;
                        },
                    };
                }

                return {
                    ...baseConfig,
                    formatter: (cell, row) => {
                        const rowObj = this.rowArrayToObject(
                            row.cells.map((c) => c.data)
                        );

                        const display = valueFormatter
                            ? valueFormatter(cell, row)
                            : cell ?? "";

                        const conditional = conditionalFormatter
                            ? conditionalFormatter(display, rowObj)
                            : null;

                        const content = conditional || display;

                        return h(
                            "span",
                            {
                                className: "clickable",
                                onclick: () => {
                                    this.dispatch("cell-click", {
                                        column: colName,
                                        cellValue: rowObj[colName],
                                        rowData: rowObj,
                                    });
                                },
                            },
                            content
                        );
                    },
                };
            });

            const columnsForGrid = includeSerial
                ? [{ name: "№", sort: false, width: "30px" }, ...gridColumns]
                : gridColumns;

            const baseConfig = {
                columns: columnsForGrid,
                pagination: {
                    enabled: true,
                    limit: this.state.perPage,
                },
                sort: true,
                search: false,
                language: {
                    search: {
                        placeholder: "🔍 Որոնել...",
                    },
                    pagination: {
                        previous: "նախորդը",
                        next: "հաջորդը",
                        showing: "😃 Ցուցադրվում են",
                        results: () => "Տվյալներ",
                    },
                    loading: "Տվյալներ բեռնվում են...",
                    noRecordsFound: "Տվյալներ չեն գտնվել",
                    error: "Տվյալներ չեն գտնվել",
                },
            };

            const mode = this.state.mode;
            let endpoint = this.getAttr("data-source");

            if (mode === "client") {
                const dataArray = this.state.data.map((row, i) =>
                    includeSerial
                        ? [i + 1, ...this.state.columns.map((c) => row[c] ?? "")]
                        : this.state.columns.map((c) => row[c] ?? "")
                );
                this.grid = new Grid({
                    ...baseConfig,
                    data: dataArray,
                });
            } else {
                // Server mode
                const absoluteUrl = api.buildUrl(endpoint);
                this.grid = new Grid({
                    ...baseConfig,
                    server: {
                        url: absoluteUrl,
                        headers: api.getAuthHeaders(),
                        then: (resp) => {
                            // Expect API similar to existing transformer structures.
                            // We reuse transformer for mapping shape. If the server already returns sliced data,
                            // use it directly; otherwise, transform known formats.
                            const dataType = this.getAttr("data-type") || '';
                            let transformed;
                            if (resp && resp.data) {
                                // Try transform helper
                                try {
                                    const maybe = tableTransformer.transformTableData(
                                        { data: resp.data },
                                        dataType
                                    );
                                    transformed = Array.isArray(maybe) ? maybe : resp.data;
                                } catch (_) {
                                    transformed = resp.data;
                                }
                            } else {
                                try {
                                    const maybe = tableTransformer.transformTableData(resp, dataType) || [];
                                    transformed = maybe;
                                } catch (_) {
                                    transformed = Array.isArray(resp) ? resp : [];
                                }
                            }
                            return transformed.map((item, i) => {
                                const rowVals = this.state.columns.map((c) => item?.[c] ?? "");
                                if (!includeSerial) return rowVals;
                                const page = this._currentPage || 0; // 0-based
                                const offset = page * this.state.perPage;
                                return [offset + i + 1, ...rowVals];
                            });
                        },
                        total: (resp) => {
                            // Try common fields for total records
                            if (typeof resp?.data?.total_count === "number")
                                return resp.data.total_count;
                            if (typeof resp?.total === "number") return resp.total;
                            if (typeof resp?.data?.total === "number") return resp.data.total;
                            // Some APIs return total_count on the first element of the data array
                            if (typeof resp?.data?.[0]?.total_count === "number")
                                return resp.data[0].total_count;
                            if (Array.isArray(resp?.data)) return resp.data.length;
                            if (Array.isArray(resp)) return resp.length;
                            if (typeof resp?.data[0].total_count === "number")
                                return resp.data.total_count;
                            return 0;
                        },
                    },
                    pagination: {
                        enabled: true,
                        limit: this.state.perPage,
                        server: {
                            url: (prev, page, limit) => {
                                this._currentPage = page; // track 0-based page
                                const join = prev.includes("?") ? "&" : "?";
                                // API expects pageSize and 1-based pageNumber
                                return `${prev}${join}pageSize=${limit}&pageNumber=${page + 1}`;
                            },
                        },
                    },
                    sort: {
                        multiColumn: false,
                        server: {
                            url: (prev, columns) => {
                                if (!columns?.length) return prev;
                                const col = columns[0];
                                const dir = col.direction === 1 ? "asc" : "desc";
                                // If serial column is present and selected, ignore server sort
                                if (includeSerial && col.index === 0) return prev;
                                const indexOffset = includeSerial ? 1 : 0;
                                const colName = this.state.columns[col.index - indexOffset];

                                const join = prev.includes("?") ? "&" : "?";

                                return `${prev}${join}sort=${encodeURIComponent(
                                    colName
                                )}&order=${dir}`;
                            },
                        },
                    },
                });
            }

            this.grid.render(mountPoint);

            // Add scope class to mountPoint for scoped hidden-columns CSS
            mountPoint.classList.add(this._scopeClass);

            // Fix serial column width to 30px
            if (includeSerial) {
                const old = mountPoint.querySelector("style[data-serial-col]");
                if (old) old.remove();
                const style = document.createElement("style");
                style.setAttribute("data-serial-col", "1");
                style.textContent = `
                .grid-container thead tr th:nth-child(1),
                .grid-container tbody tr td:nth-child(1) {
                  width: 30px !important;
                  min-width: 30px !important;
                  max-width: 30px !important;
                  padding-left: 0 !important;
                  padding-right: 0 !important;
                  text-align: center;
                }`;
                mountPoint.appendChild(style);
            }

            // Hide selected columns by name (using nth-child selectors)
            const hidden = this.parseHiddenColumnsAttr();
            if (Array.isArray(hidden) && hidden.length) {
                const offset = includeSerial ? 1 : 0;
                const idxs = this.state.columns
                    .map((c, i) => (hidden.includes(c) ? i + 1 + offset : null))
                    .filter(Boolean);
                const old = mountPoint.querySelector("style[data-hidden-cols]");
                if (old) old.remove();
                if (idxs.length) {
                    const style = document.createElement("style");
                    style.setAttribute("data-hidden-cols", "1");
                    style.textContent = idxs
                        .map(
                            (n) => `
                                        .${this._scopeClass} thead tr th:nth-child(${n}),
                                        .${this._scopeClass} tbody tr td:nth-child(${n}) { display: none !important; }`
                        )
                        .join("\n");
                    mountPoint.appendChild(style);
                }
            }
        });
    }

    rowArrayToObject(rowArray) {
        const arr =
            rowArray.length === this.state.columns.length + 1
                ? rowArray.slice(1)
                : rowArray;

        const obj = {};
        for (let i = 0; i < this.state.columns.length; i++) {
            obj[this.state.columns[i]] = arr[i];
        }
        return obj;
    }

    template() {
        if (this.state.error) {
            return `<div class="error">Տվյալների բեռնման սխալ</div>`;
        }

        if (this.state.loading) {
            return `<div class="loading">Տվյալները բեռնվում են…</div>`;
        }

        const showExport = this.hasAttribute("exportable");
        const exportLabel = this.getAttr("export-label") || "Ներբեռնել CSV-ն";

        return /* html */ `
      <div class="grid-container"></div>
       ${
           showExport
               ? `<div class="table-actions"><button type="button" class="csv-export-btn btn btn_fit btn_blue btn_md">${exportLabel}</button></div>`
               : ``
       }
    `;
    }
}

customElements.define("simple-grid", SimpleGrid);
