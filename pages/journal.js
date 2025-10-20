import { DynamicElement } from '../core/dynamic-element.js';
import '../components/ui/customTab.js';
import '../components/dynamic/list-view.js';
import '../components/dynamic/simpleGrid.js'; // switch to simple grid

class JournalPage extends DynamicElement {
  constructor() {
    super();
    this.activeTab = 'atm';
    this.selectedCity = null;
    this.selectedRegion = null;
    this.searchValue = '';
  }

  onStoreChange(storeState) {
    const region = storeState.selectedRegion;
    const city = storeState.selectedCity;

    if (region !== this.selectedRegion || city !== this.selectedCity) {
      this.selectedRegion = region;
      this.selectedCity = city;

      this.buildTable();
    }
  }

  addEventListeners() {
    this.inputsListener();
    this.tabsListener();
  }

  tabsListener() {
    this.$$('.tabs custom-tab').forEach((tabEl) => {
      this.addListener(tabEl, 'click', () => {
        this.activeTab = tabEl.getAttribute('name');
        this.searchValue = '';
      });
    });
  }

  inputsListener() {
    const atmInput = this.$('#atm-search');
    const cardInput = this.$('#card-search');

    if (atmInput) {
      this.addListener(atmInput, 'input', (e) => {
        this.searchValue = e.target.value;
        this.buildTable();
      });
    }

    if (cardInput) {
      this.addListener(cardInput, 'input', (e) => {
        this.searchValue = e.target.value;
        this.buildTable();
      });
    }
  }

  buildTable() {
    const queryString = new URLSearchParams();
    if (this.selectedRegion)
      queryString.append('province', this.selectedRegion);
    if (this.selectedCity) queryString.append('city', this.selectedCity);

    if (this.activeTab == 'atm') {
      if (this.searchValue) queryString.append('searchTerm', this.searchValue);
    } else if (this.activeTab == 'card') {
      if (this.searchValue) queryString.append('cardnumber', this.searchValue);
    }

    let link = `/journal/events-journal?${queryString.toString()}`;

    const table = this.$('simple-grid');
    table.setAttribute('data-source', link);
  }

  template() {
    return /*html*/ `
            <div class="row">
        <div class="column sm-12">
          <div class="container">
            <div class="tabs">
              <custom-tab name="atm" active>Բանկոմատ</custom-tab>
              <custom-tab name="card">Քարտ</custom-tab>
            </div>

            <div class="tab-content" data-tab="atm">
              <input type="text" placeholder="Որոնել ըստ բանկոմատի ID-ի կամ հասցեի" id='atm-search' class="list-search"/>
            </div>
            <div class="tab-content" data-tab="card" style="display:none">
              <input type="text" placeholder="Որոնել ըստ Քարտի" id='card-search' class="list-search"/>
            </div>

            <div class="table-container">
                <simple-grid
                    data-source="/journal/events-journal"
                    columns='["atm_name","date", "server_date", "transaction_id","code", "card_number", "event_description"]'
                    column-labels='{
                        "date":"Ամսաթիվ",
                        "server_date":"Սերվերի ամսաթիվ",
                        "transaction_id":"Գործարքի ID",
                        "code":"Կոդ",
                        "card_number":"Քարտի համար",
                        "event_description":"Միջոցառման նկարագրություն",
                        "atm_name":"Բանկոմատի ID"
                    }'
                    mode="server"
                    per-page="10">
                </simple-grid>
            </div>
          </div>
        </div>
      </div>
        `;
  }
}

customElements.define('journal-page', JournalPage);
