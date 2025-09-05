import { DynamicElement } from '../core/dynamic-element.js';
import '../components/dynamic/chartComponent.js';
import '../components/dynamic/infoCard.js';
import '../components/ui/customTab.js';
import '../components/dynamic/simpleTable.js';
import '../components/dynamic/select-box.js';
import '../components/dynamic/select-box-date.js';

class AtmFailures extends DynamicElement {
  constructor() {
    super();
    const today = new Date().toISOString().split('T')[0];

    this.selectedCity = null;
    this.selectedRegion = null;
    this.startDate = today;
    this.endDate = null;

    this.tableLink = `/device-faults/summary?startDate=${today}`;
  }

  onAfterRender() {
    const tableContainer = this.$('.table-container');
    if (tableContainer) {
      tableContainer.innerHTML = this.renderTable(this.tableLink);
    }
  }

  buildQuery() {
    const queryString = new URLSearchParams();

    if (this.selectedRegion)
      queryString.append('district', this.selectedRegion);
    if (this.selectedCity) queryString.append('city', this.selectedCity);
    if (this.startDate) queryString.append('startDate', this.startDate);
    if (this.endDate) queryString.append('endDate', this.endDate);

    return `/device-faults/summary?${queryString.toString()}`;
  }

  updateTableSource() {
    const table = this.$('simple-table');
    if (table) {
      const newSource = this.buildQuery();
      if (table.getAttribute('data-source') !== newSource) {
        this.tableLink = newSource;
        const tableContainer = this.$('.table-container');

        if (tableContainer) {
          tableContainer.innerHTML = this.renderTable(this.tableLink);
        }
      }
    }
  }

  onStoreChange(storeState) {
    const region = storeState.selectedRegion;
    const city = storeState.selectedCity;

    if (region !== this.selectedRegion || city !== this.selectedCity) {
      this.selectedRegion = region;
      this.selectedCity = city;
      this.updateTableSource();
    }
  }

  addEventListeners() {
    const dateSelector = this.$('select-box-date');
    const table = this.$('simple-table');
    if (dateSelector) {
      this.addListener(dateSelector, 'date-range-change', (e) => {
        const { startDate, endDate } = e.detail;
        this.startDate = startDate;
        this.endDate = endDate;
        this.updateTableSource();
      });
    }

    table?.addEventListener('cell-click', (e) => {
      const { column, cellValue, rowData } = e.detail;
    });
  }

  renderTable(link) {
    return /*html*/ `
            <div class="container">
              <simple-table
                data-source=${link}
                columns='["atm_and_address", "total_faults", "faults_summary"]'
                clickable-columns='["faults_summary"]'>
              </simple-table>
          </div>
        </div>`;
  }

  template() {
    return /*html*/ `
            <div class="row">
                <div class="column sm-12">
                    <div class="container">
                        <div class="select-container">
                            <container-top icon="icon-x-octagon" title="Ամենահաճախ փչացող 10 բանկոմատները"> </container-top>
                             <select-box-date
                                start-date="${
                                  this.startDate ? this.startDate : ''
                                }"
                                end-date="${this.endDate ? this.endDate : ''}"
                            ></select-box-date>
                        </div>  
                          <div class="table-container"></div>
                        </div>
                        </div>
                        </div>
                        `;
  }
}

customElements.define('atm-failures', AtmFailures);
