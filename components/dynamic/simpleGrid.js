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
        if (name === "data-source") {
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
            const data = tableTransformer.transformFaultTableData(JSON.parse(raw));
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
                const transformed = tableTransformer.transformFaultTableData(raw) || [];
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
                        const transformed = tableTransformer.transformFaultTableData(raw) || [];
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
            return val.toLocaleString();
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

        loadGridJsModule().then((module) => {
            const { Grid, h } = module;

            const clickableColumns = this.parseClickableColumnsAttr();
            const clickableSet = new Set(clickableColumns);
            const labels = this.parseColumnLabelsAttr();
            const formattersMap = this.parseColumnFormattersAttr();

            const conditionsMap = this.parseColumnConditionsAttr();

            // mark row conditions so we can treat them specially in formatters
            const rawRowConditions = this.parseRowConditionsAttr();
            const rowConditions = Array.isArray(rawRowConditions)
                ? rawRowConditions.map((r) => ({ ...r, __rowRule: true }))
                : [];

            const gridColumns = this.state.columns.map((colName) => {
                const displayName = labels[colName] || colName;
                const valueFormatter = this.getValueFormatter(colName, formattersMap);
                const conditionalFormatter = this.getConditionalFormatter(colName, conditionsMap, rowConditions, h);

                if (!clickableSet.has(colName)) {
                    return {
                        name: displayName,
                        formatter: (cell, row) => {
                            const rowObj = this.rowArrayToObject(row.cells.map((c) => c.data));
                            const conditional = conditionalFormatter ? conditionalFormatter(cell, rowObj) : null;
                            if (conditional) return conditional;
                            return valueFormatter ? valueFormatter(cell, row) : (cell ?? "");
                        },
                    };
                }

                return {
                    name: displayName,
                    formatter: (cell, row) => {
                        const rowObj = this.rowArrayToObject(row.cells.map((c) => c.data));
                        const conditional = conditionalFormatter ? conditionalFormatter(cell, rowObj) : null;
                        const content = conditional || (valueFormatter ? valueFormatter(cell, row) : (cell ?? ""));
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

            const baseConfig = {
                columns: gridColumns,
                pagination: {
                    enabled: true,
                    limit: this.state.perPage,
                },
                sort: true,
                search: false,
                className: {
                    td: "gridjs-td",
                    th: "gridjs-th",
                },
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
                const dataArray = this.state.data.map((row) =>
                    this.state.columns.map((c) => row[c] ?? "")
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
                            let transformed;
                            if (resp && resp.data) {
                                // Try transform helper
                                try {
                                    const maybe = tableTransformer.transformFaultTableData({
                                        data: resp.data,
                                    });
                                    transformed = Array.isArray(maybe) ? maybe : resp.data;
                                } catch (_) {
                                    transformed = resp.data;
                                }
                            } else {
                                try {
                                    const maybe =
                                        tableTransformer.transformFaultTableData(resp) || [];
                                    transformed = maybe;
                                } catch (_) {
                                    transformed = Array.isArray(resp) ? resp : [];
                                }
                            }
                            return transformed.map((item) =>
                                this.state.columns.map((c) => item?.[c] ?? "")
                            );
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
                                const colName = this.state.columns[col.index];

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

            // Hide selected columns by name (using nth-child selectors)
            const hidden = this.parseHiddenColumnsAttr();
            if (Array.isArray(hidden) && hidden.length) {
                const idxs = this.state.columns
                    .map((c, i) => (hidden.includes(c) ? i + 1 : null))
                    .filter(Boolean);
                const old = mountPoint.querySelector("style[data-hidden-cols]");
                if (old) old.remove();
                if (idxs.length) {
                    const style = document.createElement("style");
                    style.setAttribute("data-hidden-cols", "1");
                    style.textContent = idxs
                        .map(
                            (n) => `
.grid-container thead tr th:nth-child(${n}),
.grid-container tbody tr td:nth-child(${n}) { display: none; }`
                        )
                        .join("\n");
                    mountPoint.appendChild(style);
                }
            }
        });
    }

    rowArrayToObject(rowArray) {
        const obj = {};
        for (let i = 0; i < this.state.columns.length; i++) {
            obj[this.state.columns[i]] = rowArray[i];
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
