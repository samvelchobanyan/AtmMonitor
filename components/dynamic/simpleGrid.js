// components/dynamic/simpleGrid.js
import { DynamicElement } from "../../core/dynamic-element.js";

// Lazy-load Grid.js once for all instances
let gridJsModulePromise = null;
function loadGridJsModule() {
    if (!gridJsModulePromise) {
        gridJsModulePromise = Promise.all([
            import("https://cdn.jsdelivr.net/npm/gridjs/dist/gridjs.module.js"),
            // Load CSS dynamically
            new Promise((resolve) => {
                const link = document.createElement("link");
                link.rel = "stylesheet";
                link.href = "https://cdn.jsdelivr.net/npm/gridjs/dist/theme/mermaid.min.css";
                link.onload = resolve;
                document.head.appendChild(link);
            })
        ]);
    }
    return gridJsModulePromise;
}

export class SimpleGrid extends DynamicElement {
    constructor() {
        super();
        this.state = {
            data: [],
            columns: [],
            loading: false,
            error: false,
            mode: 'client', // client or server
        };
        this.gridInstance = null;
        this.clickableColumns = [];
        this.endpoint = null;
        this.initializationPending = false;
        this.isConnected = false;
    }

    static get observedAttributes() {
        return ["data-source", "columns", "clickable-columns", "mode", "per-page", "sort", "search"];
    }

    async onConnected() {
        this.isConnected = true;
        
        // Parse all attributes first
        this.endpoint = this.getAttr("data-source");
        this.clickableColumns = this.parseClickableColumnsAttr();
        const mode = this.getAttr("mode") || 'client';
        this.setState({ mode });
    }

    async onAttributeChange(name, oldVal, newVal) {
        // During initial setup, attributes are set before onConnected
        // We should wait until connected to initialize
        if (!this.isConnected) {
            return;
        }

        let shouldReinitialize = false;

        if (name === "data-source" && oldVal !== newVal) {
            this.endpoint = newVal;
            shouldReinitialize = true;
        }
        if (name === "columns" && oldVal !== newVal) {
            const parsed = this.parseColumnsAttr();
            if (parsed) {
                this.setState({ columns: parsed });
                shouldReinitialize = true;
            }
        }
        if (name === "mode" && oldVal !== newVal) {
            this.setState({ mode: newVal || 'client' });
            shouldReinitialize = true;
        }
        if (name === "clickable-columns" && oldVal !== newVal) {
            this.clickableColumns = this.parseClickableColumnsAttr();
            shouldReinitialize = true;
        }

        // Only reinitialize if something actually changed and we're not already initializing
        if (shouldReinitialize && !this.initializationPending) {
            await this.initializeGrid();
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
        return isNaN(val) ? 10 : val;
    }

    getSortOption() {
        const raw = this.getAttr("sort");
        return raw === "false" ? false : true;
    }

    getSearchOption() {
        const raw = this.getAttr("search");
        return raw === "false" ? false : true;
    }

    async initializeGrid() {
        // Prevent multiple simultaneous initializations
        if (this.initializationPending) {
            return;
        }

        this.initializationPending = true;
        this.setState({ loading: true, error: false });

        try {
            const [gridModule] = await loadGridJsModule();
            const Grid = gridModule.Grid;
            const html = gridModule.html;

            // Destroy existing instance
            if (this.gridInstance) {
                this.gridInstance.destroy();
                this.gridInstance = null;
            }

            const container = this.$(".grid-container");
            if (!container) {
                this.setState({ loading: false });
                this.initializationPending = false;
                return;
            }

            const definedColumns = this.parseColumnsAttr();
            const mode = this.getAttr("mode") || 'client';
            const perPage = this.getPerPageOption();
            const enableSort = this.getSortOption();
            const enableSearch = this.getSearchOption();

            let gridConfig = {
                container: container,
                pagination: {
                    enabled: true,
                    limit: perPage,
                    summary: true
                },
                sort: enableSort,
                search: enableSearch,
                className: {
                    table: 'gridjs-table',
                    tr: 'gridjs-tr',
                    td: 'gridjs-td'
                }
            };

            if (mode === 'server') {
                // Server-side mode
                gridConfig.server = {
                    url: this.endpoint,
                    then: data => {
                        // Transform data if needed
                        if (Array.isArray(data)) {
                            return data;
                        } else if (data.data) {
                            return data.data;
                        }
                        return data;
                    },
                    total: data => {
                        // Handle total count for server-side pagination
                        if (data.total !== undefined) {
                            return data.total;
                        } else if (data.totalCount !== undefined) {
                            return data.totalCount;
                        } else if (Array.isArray(data)) {
                            return data.length;
                        }
                        return 0;
                    }
                };

                // Configure server-side pagination
                gridConfig.pagination = {
                    enabled: true,
                    limit: perPage,
                    server: {
                        url: (prev, page, limit) => {
                            const url = new URL(prev, window.location.origin);
                            url.searchParams.set('page', page);
                            url.searchParams.set('limit', limit);
                            return url.toString();
                        }
                    }
                };

                // Configure server-side sorting
                if (enableSort) {
                    gridConfig.sort = {
                        server: {
                            url: (prev, columns) => {
                                if (!columns.length) return prev;
                                const url = new URL(prev, window.location.origin);
                                const sortColumn = columns[0];
                                url.searchParams.set('sortBy', definedColumns[sortColumn.index]);
                                url.searchParams.set('sortOrder', sortColumn.direction === 1 ? 'asc' : 'desc');
                                return url.toString();
                            }
                        }
                    };
                }

                // Configure server-side search
                if (enableSearch) {
                    gridConfig.search = {
                        server: {
                            url: (prev, keyword) => {
                                const url = new URL(prev, window.location.origin);
                                url.searchParams.set('search', keyword);
                                return url.toString();
                            }
                        }
                    };
                }
            } else {
                // Client-side mode - load all data at once
                const data = await this.fetchData(this.endpoint);
                const transformedData = Array.isArray(data) ? data : (data.data || []);
                
                gridConfig.data = transformedData;
            }

            // Configure columns
            if (definedColumns.length > 0) {
                gridConfig.columns = definedColumns.map((col, index) => {
                    const isClickable = this.clickableColumns.includes(col);
                    
                    return {
                        id: col,
                        name: col,
                        formatter: (cell, row) => {
                            if (isClickable) {
                                return html(`<span class="clickable-cell" data-column="${col}" data-row='${JSON.stringify(row._cells.map(c => c.data))}'>${cell}</span>`);
                            }
                            return cell;
                        }
                    };
                });
            }

            // Create Grid instance
            this.gridInstance = new Grid(gridConfig);
            
            // Render the grid
            this.gridInstance.render();

            // Add event listeners after grid is ready
            this.gridInstance.on('ready', () => {
                this.addGridEventListeners();
                this.setState({ loading: false });
                this.initializationPending = false;
            });

            // Re-attach click handlers after any update
            this.gridInstance.on('load', () => {
                // Wait for Grid.js to finish updating the DOM
                setTimeout(() => {
                    this.addGridEventListeners();
                }, 100);
            });

        } catch (err) {
            console.error("Failed to initialize Grid.js", err);
            this.setState({ loading: false, error: true });
            this.initializationPending = false;
        }
    }

    // Override parent's addEventListeners to initialize grid after render
    addEventListeners() {
        super.addEventListeners();
        
        // Initialize grid after first render
        if (this.endpoint && !this.initializationPending && !this.gridInstance) {
            this.initializeGrid();
        }
    }

    addGridEventListeners() {
        // Clear previous listeners first
        this.clearEventListeners();
        
        // Find all clickable cells in the grid
        const clickableCells = this.$$(".clickable-cell");
        
        // Attach click handlers to each clickable cell
        clickableCells.forEach(cell => {
            this.addListener(cell, "click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                
                const column = cell.getAttribute("data-column");
                const rowDataStr = cell.getAttribute("data-row");
                
                try {
                    const rowArray = JSON.parse(rowDataStr);
                    const definedColumns = this.parseColumnsAttr();
                    
                    // Reconstruct row object from array
                    const rowData = {};
                    definedColumns.forEach((col, idx) => {
                        rowData[col] = rowArray[idx];
                    });
                    
                    const cellValue = cell.textContent;
                    
                    // Dispatch the cell-click event with all relevant data
                    this.dispatch("cell-click", { 
                        column, 
                        cellValue, 
                        rowData 
                    });
                } catch (e) {
                    console.error("Error parsing row data", e);
                }
            });
        });
    }

    async fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Error fetching data:", error);
            throw error;
        }
    }

    onDestroy() {
        if (this.gridInstance) {
            this.gridInstance.destroy();
            this.gridInstance = null;
        }
    }

    template() {
        if (this.state.error) {
            return `<div class="error">Failed to load grid data.</div>`;
        }

        if (this.state.loading) {
            return `<div class="loading">Loading grid…</div>`;
        }

        return /* html */ `
            <div class="grid-wrapper">
                <div class="grid-container"></div>
            </div>
            <style>
                .grid-wrapper {
                    width: 100%;
                    overflow-x: auto;
                }
                .clickable-cell {
                    cursor: pointer;
                    color: #0066cc;
                    text-decoration: underline;
                }
                .clickable-cell:hover {
                    color: #0052a3;
                }
                .gridjs-wrapper {
                    border-radius: 8px;
                    overflow: hidden;
                }
            </style>
        `;
    }
}

customElements.define("simple-grid", SimpleGrid);