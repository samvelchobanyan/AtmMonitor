// import { DynamicElement } from '../core/dynamic-element.js';
// import '../components/dynamic/list-view.js';
// import '../components/dynamic/simpleTable.js';
// import '../components/ui/customTab.js';
// import '../components/dynamic/select-box-search.js';
// import '../components/dynamic/select-box.js';

// class JournalPage extends DynamicElement {
//   constructor() {
//     super();
//     this.state = {
//       selectedRegion: null,
//       selectedCity: null,
//     };
//     this.atmsSearchBox = null;
//     this.cardSearchBox = null;
//     this.table = null;
//   }

//   async onConnected() {}

//   onAfterRender() {
//     this.atmsSearchBox = this.$('#atm-search');
//     this.cardSearchBox = this.$('#card-search');
//     this.table = this.$('simple-table');
//   }

//   onStoreChange(storeState) {
//     const region = storeState.selectedRegion;
//     const city = storeState.selectedCity;

//     if (
//       region !== this.state.selectedRegion ||
//       city !== this.state.selectedCity
//     ) {
//       this.setState({
//         selectedRegion: region,
//         selectedCity: city,
//       });
//       this.fetchSummary({ region, city });
//     }
//   }

//   addEventListeners() {
//     if (this.atmsSearchBox) {
//       this.addListener(this.atmsSearchBox, 'input', (e) => {
//         this.fetchSummary({
//           searchText: e.target.value,
//           region: this.state.selectedRegion,
//           city: this.state.selectedCity,
//         });
//       });
//     }

//     if (this.cardSearchBox) {
//       this.addListener(this.cardSearchBox, 'input', (e) => {
//         this.fetchSummary({
//           cardnumber: e.target.value,
//           region: this.state.selectedRegion,
//           city: this.state.selectedCity,
//         });
//       });
//     }
//   }

//   async fetchSummary({ region, city, searchText, cardnumber, pageNumber }) {
//     const queryString = new URLSearchParams();

//     if (region) queryString.append('district', region);
//     if (city) queryString.append('city', city);
//     if (searchText) queryString.append('searchTerm', searchText);
//     if (cardnumber) queryString.append('cardnumber', cardnumber);
//     if (pageNumber) queryString.append('pageNumber', pageNumber);

//     try {
//       const link = `/journal/events-journal?${queryString}`;

//       this.table.setAttribute('data-source', link);
//     } catch (err) {
//       this.table.setAttribute('data-source', '');
//     }
//   }

//   template() {
//     return /*html*/ `
//             <div class="row">
//                 <div class="column sm-12">
//                     <div class="container">
//                         <div class="tabs">
//                             <custom-tab name="atm" active>Բանկոմատ</custom-tab>
//                             <custom-tab name="card">Քարտ</custom-tab>
//                         </div>

//                         <div class="tab-content" data-tab="atm">
//                             <input type="text" placeholder="Որոնել ըստ բանկոմատի ID-ի կամ հասցեի" id='atm-search' class="list-search"/>
//                         </div>
//                         <div class="tab-content" data-tab="card" style="display:none">
//                             <input type="text placeholder="Որոնել ըստ Քարտի" id='card-search'  class="list-search"/>
//                         </div>

//                         <simple-table
//                             data-source="/journal/events-journal"
//                             columns='["date", "server_date","transaction_id", "code", "card_number", "event_description","atm_id"]'
//                             searchable="false">
//                         </simple-table>
//                     </div>
//                 </div>
//             </div>
//         `;
//   }
// }

// customElements.define('journal-page', JournalPage);

import { DynamicElement } from '../core/dynamic-element.js';
import '../components/dynamic/list-view.js';
import '../components/dynamic/simpleTable.js';
import '../components/ui/customTab.js';
import '../components/dynamic/select-box-search.js';
import '../components/dynamic/select-box.js';

class JournalPage extends DynamicElement {
  constructor() {
    super();

    this.selectedRegion = null;
    this.selectedCity = null;

    this.searchText = null;
    this.cardNumber = null;

    this.tableLink = `/journal/events-journal`;

    this.atmsSearchBox = null;
    this.cardSearchBox = null;
    this.table = null;
  }

  onAfterRender() {
    this.atmsSearchBox = this.$('#atm-search');
    this.cardSearchBox = this.$('#card-search');
    this.table = this.$('simple-table');

    const tableContainer = this.$('.table-container');
    if (tableContainer) {
      tableContainer.innerHTML = this.renderTable(this.tableLink);
    }
  }

  buildQuery() {
    const queryString = new URLSearchParams();
    const activeTab = this.$('.tabs custom-tab[active]')?.getAttribute('name');

    if (!activeTab) return `/journal/events-journal`;

    if (activeTab === 'atm') {
      if (this.searchText) queryString.append('searchTerm', this.searchText);
    } else if (activeTab === 'card') {
      if (this.cardNumber) queryString.append('cardnumber', this.cardNumber);
    }

    if (this.selectedRegion)
      queryString.append('district', this.selectedRegion);
    if (this.selectedCity) queryString.append('city', this.selectedCity);

    return `/journal/events-journal?${queryString.toString()}`;
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
    if (this.atmsSearchBox) {
      this.addListener(this.atmsSearchBox, 'input', (e) => {
        this.searchText = e.target.value;
        this.updateTableSource();
      });
    }

    if (this.cardSearchBox) {
      this.addListener(this.cardSearchBox, 'input', (e) => {
        this.cardNumber = e.target.value;
        this.updateTableSource();
      });
    }
  }

  renderTable(link) {
    return /*html*/ `
      <simple-table
        data-source="${link}"
        columns='["date", "server_date","transaction_id", "code", "card_number", "event_description","atm_id"]'
        searchable="false">
      </simple-table>
    `;
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
              <input type="text" placeholder="Որոնել ըստ Քարտի" id='card-search'  class="list-search"/>
            </div>

            <div class="table-container"></div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('journal-page', JournalPage);
