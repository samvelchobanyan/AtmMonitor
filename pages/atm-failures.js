import { DynamicElement } from '../core/dynamic-element.js';
import '../components/dynamic/chartComponent.js';
import '../components/dynamic/infoCard.js';
import '../components/ui/customTab.js';
import '../components/dynamic/simpleTable.js';
import '../components/dynamic/select-box.js';
import '../components/dynamic/select-box-date.js';
import '../components/ui/customTab.js';
import '../components/dynamic/select-box-search.js';
import '../components/ui/customCheck.js';
import '../components/dynamic/segment.js';
import '../components/dynamic/filtrationTabs.js';

class AtmFailures extends DynamicElement {
  constructor() {
    super();
    this.topStartDate = null;
    this.topEndDate = null;
    this.topDateSelectBox = null;
    this.tableActiveTab = null;
    this.filtrationTabs = null;
    this.bottomTable = null;
    this.filtrationQuery = null;
  }

  onConnected() {
    this.initTableTabs();
  }

  onAfterRender() {
    this.topDateSelectBox = this.$('#top-date');
    this.filtrationTabs = this.$('filtration-tabs');
    this.bottomTable = this.$('#bottom_table');

    this.fetchTopSummary();
  }

  addEventListeners() {
    this.selectTopDateListener();

    this.addListener(this.filtrationTabs, 'filter-submit', (e) => {
      const queryString = e.detail.query;
      this.filtrationQuery = queryString;

      this.$('#bottom_table').setAttribute(
        'data-source',
        `/device-faults/by-device-type?deviceId=${this.tableActiveTab}&${queryString}`
      );
    });
  }

  async fetchTopSummary() {
    const queryString = new URLSearchParams();
    if (this.topStartDate) queryString.append('startDate', this.topStartDate);
    if (this.topEndDate) queryString.append('endDate', this.topEndDate);

    try {
      this.$('#top_table').setAttribute(
        'data-source',
        `/device-faults/top?${queryString}`
      );
    } catch (err) {
      console.error('❌ Error fetching top summary:', err);
    }
  }

  async initTableTabs() {
    try {
      const res = await this.fetchData(`/device-faults/all-device-types`);

      const tableContainer = this.$('.table_tabs');
      if (tableContainer) {
        tableContainer.innerHTML = this.renderTableTabs(res.data);
      }

      this.tableActiveTab = res.data[0].id;

      this.bottomTable.setAttribute(
        'data-source',
        `/device-faults/by-device-type?deviceId=${res.data[0].id}`
      );

      this.tableTabsListener();
    } catch (err) {
      console.error('❌ Failed to init table tabs:', err);
    }
  }

  tableTabsListener() {
    const tableTabs = this.$$('.table_tabs custom-tab');

    tableTabs.forEach((tab) => {
      this.addListener(tab, 'click', async () => {
        const selectedTab = tab.getAttribute('name');
        if (this.tableActiveTab === selectedTab) return;
        // todo check that Arsen has changed segmentId to segmentIds and it will work fine
        this.tableActiveTab = selectedTab;
        this.bottomTable.setAttribute(
          'data-source',
          `/device-faults/by-device-type?deviceId=${selectedTab}${
            this.filtrationQuery ? `&${this.filtrationQuery}` : ''
          }`
        );
      });
    });
  }

  selectTopDateListener() {
    if (this.topDateSelectBox) {
      this.addListener(this.topDateSelectBox, 'date-range-change', (e) => {
        const { startDate, endDate } = e.detail || {};
        if (!startDate || !endDate) return;
        this.topStartDate = startDate;
        this.topEndDate = endDate;

        this.fetchTopSummary();
      });
    }
  }

  renderTableTabs(data) {
    return /*html*/ ` ${data
      .map(
        (type) =>
          `<custom-tab name="${type.id}" ${
            type.id == this.tableActiveTab ? 'active' : ''
          }>${type.type_name}</custom-tab>`
      )
      .join('')}`;
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
                                      this.topStartDate ? this.topStartDate : ''
                                    }"
                                    end-date="${
                                      this.topEndDate ? this.topEndDate : ''
                                    }"
                                    id='top-date'
                                ></select-box-date>
                            </div>

                            <div class="container top_table">
                                <simple-table
                                    id='top_table'
                                    data-source = '/device-faults/top'
                                    columns='["atm_id", "address", "total_faults", "faults_summary"]'
                                    column-labels='{
                                        "atm_id": "Բանկոմատի ID",
                                        "address": "Հասցե",
                                        "total_faults": "Խափանումների քանակ",
                                        "faults_summary": "Խափանումների նկարագրություն"
                                        }'
                                    searchable="false"
                                ></simple-table>
                            </div>
                    </div>
                  </div>
            </div>

            <filtration-tabs></filtration-tabs>

            <div class='row'>
                <div class="column sm-12">
                    <div class="container">
                        <div class="tabs table_tabs">
                        </div>
                        <div class="container bottom_table">
                            <simple-table
                                id='bottom_table'
                                columns='["atm_id", "address", "total_faults", "faults_duration"]'
                                column-labels='{
                                    "atm_id": "Բանկոմատի ID",
                                    "address": "Հասցե",
                                    "total_faults": "Խափանումների քանակ",
                                    "faults_duration": "Խափանումների տևողություն"
                                    }'

                                searchable="false">
                            </simple-table>
                        </div>

                    </div>
                </div>
            </div>
        </div>
      `;
  }
}

customElements.define('atm-failures', AtmFailures);
