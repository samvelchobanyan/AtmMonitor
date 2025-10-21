// components/dynamic/simpleGrid.js
import { DynamicElement } from '../../core/dynamic-element.js';
import tableTransformer from '../../core/utils/table-transformer.js';
import { api } from '../../core/api-client.js';

// Lazy-load Grid.js once for all instances
let gridJsModulePromise = null;
function loadGridJsModule() {
  if (!gridJsModulePromise) {
    gridJsModulePromise = import(
      'https://cdn.jsdelivr.net/npm/gridjs/dist/gridjs.module.js'
    );
  }
  return gridJsModulePromise;
}

// Inject Grid.js CSS once
let gridJsCssInjected = false;
function ensureGridJsCss() {
  if (gridJsCssInjected) return;
  const id = 'gridjs-css';
  if (!document.getElementById(id)) {
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://cdn.jsdelivr.net/npm/gridjs/dist/theme/mermaid.min.css';
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
      mode: 'client', // client | server
      perPage: 10,
    };
    this.grid = null;
  }

  static get observedAttributes() {
    return ['data-source', 'columns', 'clickable-columns', 'mode', 'per-page'];
  }

  async onConnected() {
    ensureGridJsCss();
    const url = this.getAttr('data-source');
    if (url) await this.loadData();
  }

  async onAttributeChange(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'data-source') {
      await this.loadData();
      return;
    }
    if (name === 'columns') {
      const parsed = this.parseColumnsAttr();
      if (parsed) this.setState({ columns: parsed });
      return;
    }
    if (name === 'mode') {
      this.setState({ mode: this.getModeOption() });
      return;
    }
    if (name === 'per-page') {
      this.setState({ perPage: this.getPerPageOption() });
      return;
    }
  }

  parseColumnsAttr() {
    try {
      const raw = this.getAttr('columns');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('Invalid columns attribute JSON', e);
      return [];
    }
  }

  parseClickableColumnsAttr() {
    try {
      const raw = this.getAttr('clickable-columns');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('Invalid clickable-columns attribute JSON', e);
      return [];
    }
  }

  getModeOption() {
    const raw = (this.getAttr('mode') || 'client').toLowerCase();
    return raw === 'server' ? 'server' : 'client';
  }

  getPerPageOption() {
    const raw = this.getAttr('per-page');
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

    const url = this.getAttr('data-source');
    if (!url) {
      this.setState({ loading: false, error: true });
      return;
    }

    console.log('grid load data - mode', mode);

    if (mode === 'client') {
      try {
        const raw = await this.fetchData(url);
        const transformed = tableTransformer.transformFaultTableData(raw) || [];
        const definedColumns = this.parseColumnsAttr();
        const columns = definedColumns.length
          ? definedColumns
          : Object.keys(transformed[0] || {});
        this.setState({ data: transformed, columns, loading: false });
      } catch (err) {
        console.warn('Failed to load or transform grid data', err);
        this.setState({ loading: false, error: true });
      }
    } else {
      // server mode defers data loading to Grid.js server config
      try {
        // Probe once to derive columns if not provided
        const definedColumns = this.parseColumnsAttr();
        let columns = definedColumns;
        console.log('grid fetching', url);
        if (!columns.length) {
          try {
            const raw = await this.fetchData(url);
            const transformed =
              tableTransformer.transformFaultTableData(raw) || [];
            columns = Object.keys(transformed[0] || {});
          } catch (_) {
            // ignore probe error; grid server mode may still work
          }
        }
        this.setState({ columns, loading: false });
      } catch (err) {
        console.warn('Failed to initialize server grid', err);
        this.setState({ loading: false, error: true });
      }
    }
  }

  parseColumnLabelsAttr() {
    try {
      const raw = this.getAttr('column-labels');
      console.log(raw);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.warn('Invalid column-labels attribute JSON', e);
      return {};
    }
  }

  parseColumnFormattersAttr() {
    try {
      const raw = this.getAttr('column-formatters');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.warn('Invalid column-formatters attribute JSON', e);
      return {};
    }
  }

  getValueFormatter(colName, map) {
    const spec = map[colName];
    if (spec !== 'currency') return null;

    const formatCommas = (val) => {
      return val.toLocaleString();
    };

    return (v) => formatCommas(v);
  }

  onAfterRender() {
    // Destroy old grid if exists to avoid duplicates
    if (this.grid && typeof this.grid.destroy === 'function') {
      try {
        this.grid.destroy();
      } catch {}
      this.grid = null;
    }

    if (this.state.error) return;
    if (!this.state.columns.length) return;

    const mountPoint = this.$('.grid-container');
    if (!mountPoint) return;

    loadGridJsModule().then((module) => {
      const { Grid, h } = module;

      const clickableColumns = this.parseClickableColumnsAttr();
      const clickableSet = new Set(clickableColumns);
      const labels = this.parseColumnLabelsAttr();
      const formattersMap = this.parseColumnFormattersAttr();

      const gridColumns = this.state.columns.map((colName) => {
        console.log(colName);
        const displayName = labels[colName] || colName;
        const valueFormatter = this.getValueFormatter(colName, formattersMap);

        if (!clickableSet.has(colName)) {
          if (!valueFormatter) return { name: displayName };
          return {
            name: displayName,
            formatter: (cell) => valueFormatter(cell),
          };
        }

        return {
          name: displayName,
          formatter: (cell, row) => {
            const content = valueFormatter ? valueFormatter(cell) : cell ?? '';
            return h(
              'span',
              {
                className: 'clickable',
                onclick: () => {
                  const rowObj = this.rowArrayToObject(
                    row.cells.map((c) => c.data)
                  );
                  this.dispatch('cell-click', {
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
          td: 'gridjs-td',
          th: 'gridjs-th',
        },
        language: {
          search: {
            placeholder: '🔍 Որոնել...',
          },
          pagination: {
            previous: 'նախորդը',
            next: 'հաջորդը',
            showing: '😃 Ցուցադրվում են',
            results: () => 'Տվյալներ',
          },
          loading: 'Տվյալներ բեռնվում են...',
          noRecordsFound: 'Տվյալներ չեն գտնվել',
          error: 'Տվյալներ չեն գտնվել',
        },
      };

      const mode = this.state.mode;
      let endpoint = this.getAttr('data-source');

      if (mode === 'client') {
        const dataArray = this.state.data.map((row) =>
          this.state.columns.map((c) => row[c] ?? '')
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
              console.log('transformed ===>', transformed);
              return transformed.map((item) =>
                this.state.columns.map((c) => item?.[c] ?? '')
              );
            },
            total: (resp) => {
              // Try common fields for total records
              if (typeof resp?.data?.total_count === 'number')
                return resp.data.total_count;
              if (typeof resp?.total === 'number') return resp.total;
              if (typeof resp?.data?.total === 'number') return resp.data.total;
              if (Array.isArray(resp?.data)) return resp.data.length;
              if (Array.isArray(resp)) return resp.length;
              return 0;
            },
          },
          pagination: {
            enabled: true,
            limit: this.state.perPage,
            server: {
              url: (prev, page, limit) => {
                const join = prev.includes('?') ? '&' : '?';
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
                const dir = col.direction === 1 ? 'asc' : 'desc';
                const colName = this.state.columns[col.index];

                const join = prev.includes('?') ? '&' : '?';
                
                return `${prev}${join}sort=${encodeURIComponent(
                  colName
                )}&order=${dir}`;
              },
            },
          },
        });
      }

      this.grid.render(mountPoint);
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
      return `<div class="error">Տվյալների բերնման սխալ</div>`;
    }

    if (this.state.loading) {
      return `<div class="loading">Տվյալները բեռնվում են…</div>`;
    }

    return /* html */ `
      <div class="grid-container"></div>
    `;
  }
}

customElements.define('simple-grid', SimpleGrid);
