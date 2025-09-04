import { DynamicElement } from "../core/dynamic-element.js";
import "../components/dynamic/simpleGrid.js";

class GridExample extends DynamicElement {
    constructor() {
        super();
        this.state = {
            selectedMode: 'client',
            clickInfo: null
        };
    }

    addEventListeners() {
        // Listen to cell click events from the grid
        this.$("simple-grid")?.addEventListener("cell-click", (e) => {
            const { column, cellValue, rowData } = e.detail;
            console.log("Grid cell clicked:", { column, cellValue, rowData });
            
            this.setState({
                clickInfo: {
                    column,
                    cellValue,
                    rowData: JSON.stringify(rowData, null, 2)
                }
            });
        });

        // Mode switcher
        this.$("#mode-switcher")?.addEventListener("change", (e) => {
            this.setState({ selectedMode: e.target.value });
        });
    }

    template() {
        return /*html*/ `
            <div class="grid-example-page">
                <h2>SimpleGrid Component Example</h2>
                
                <div class="controls">
                    <label for="mode-switcher">
                        Mode:
                        <select id="mode-switcher">
                            <option value="client" ${this.state.selectedMode === 'client' ? 'selected' : ''}>Client-side</option>
                            <option value="server" ${this.state.selectedMode === 'server' ? 'selected' : ''}>Server-side</option>
                        </select>
                    </label>
                </div>

                <div class="grid-container">
                    <h3>ATM Failures Grid (${this.state.selectedMode} mode)</h3>
                    <simple-grid
                        data-source="/device-faults/summary?startDate=2025-06-01"
                        columns='["atm_and_address", "total_faults", "faults_summary"]'
                        clickable-columns='["faults_summary", "atm_and_address"]'
                        mode="${this.state.selectedMode}"
                        per-page="10"
                        sort="true"
                        search="true">
                    </simple-grid>
                </div>

                ${this.state.clickInfo ? `
                    <div class="click-info">
                        <h3>Last Clicked Cell Info:</h3>
                        <p><strong>Column:</strong> ${this.state.clickInfo.column}</p>
                        <p><strong>Value:</strong> ${this.state.clickInfo.cellValue}</p>
                        <p><strong>Row Data:</strong></p>
                        <pre>${this.state.clickInfo.rowData}</pre>
                    </div>
                ` : ''}

                <div class="usage-info">
                    <h3>SimpleGrid Component Usage:</h3>
                    <pre><code>&lt;simple-grid
    data-source="/api/endpoint"
    columns='["col1", "col2", "col3"]'
    clickable-columns='["col2"]'
    mode="client|server"
    per-page="10"
    sort="true"
    search="true"&gt;
&lt;/simple-grid&gt;</code></pre>

                    <h4>Attributes:</h4>
                    <ul>
                        <li><strong>data-source</strong>: API endpoint URL</li>
                        <li><strong>columns</strong>: JSON array of column names to display</li>
                        <li><strong>clickable-columns</strong>: JSON array of columns that should be clickable</li>
                        <li><strong>mode</strong>: "client" or "server" - determines where pagination/sorting happens</li>
                        <li><strong>per-page</strong>: Number of rows per page (default: 10)</li>
                        <li><strong>sort</strong>: Enable/disable sorting (default: true)</li>
                        <li><strong>search</strong>: Enable/disable search (default: true)</li>
                    </ul>

                    <h4>Events:</h4>
                    <ul>
                        <li><strong>cell-click</strong>: Fired when a clickable cell is clicked. Event detail contains:
                            <ul>
                                <li>column: The column name</li>
                                <li>cellValue: The clicked cell's value</li>
                                <li>rowData: The entire row data object</li>
                            </ul>
                        </li>
                    </ul>
                </div>

                <style>
                    .grid-example-page {
                        padding: 20px;
                        max-width: 1200px;
                        margin: 0 auto;
                    }
                    .controls {
                        margin: 20px 0;
                        padding: 15px;
                        background: #f5f5f5;
                        border-radius: 8px;
                    }
                    .controls label {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    .controls select {
                        padding: 5px 10px;
                        border-radius: 4px;
                        border: 1px solid #ddd;
                    }
                    .grid-container {
                        margin: 30px 0;
                    }
                    .click-info {
                        margin: 30px 0;
                        padding: 20px;
                        background: #e8f4f8;
                        border-radius: 8px;
                        border: 1px solid #b3d9e6;
                    }
                    .click-info pre {
                        background: white;
                        padding: 10px;
                        border-radius: 4px;
                        overflow-x: auto;
                    }
                    .usage-info {
                        margin-top: 40px;
                        padding: 20px;
                        background: #f9f9f9;
                        border-radius: 8px;
                    }
                    .usage-info pre {
                        background: #2d2d2d;
                        color: #f8f8f2;
                        padding: 15px;
                        border-radius: 4px;
                        overflow-x: auto;
                    }
                    .usage-info ul {
                        margin: 10px 0;
                        padding-left: 20px;
                    }
                    .usage-info li {
                        margin: 5px 0;
                    }
                </style>
            </div>
        `;
    }
}

customElements.define("grid-example", GridExample);