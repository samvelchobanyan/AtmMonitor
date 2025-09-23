import { DynamicElement } from "../core/dynamic-element.js";
import '../components/ui/customTab.js';
import "../components/dynamic/list-view.js";
import "../components/dynamic/simpleGrid.js";  // switch to simple grid
import encode from "../assets/js/utils/encode.js";

class JournalPage extends DynamicElement {
    constructor() {
        super();
        this.state = {
            summary: [],
        };
    }

    async onConnected() {
        this.fetchSummary();
    }

    async fetchSummary(region, city, searchText, cardnumber, pageNumber) {
        const queryString = new URLSearchParams();
        if (region) queryString.append("district", region);
        if (city) queryString.append("city", city);
        if (searchText) queryString.append("searchTerm", searchText);
        if (cardnumber) queryString.append("cardnumber", cardnumber);
        if (pageNumber) queryString.append("pageNumber", pageNumber);

        try {
            const response = await this.fetchData(`/journal/events-journal?${queryString}`);
            this.setState({ summary: response.data });

            // console.log("resopnse", response);
        } catch (err) {
            console.error("❌ Error fetching summary:", err);
            this.setState({ summary: [] });
        }
    }

    template() {
        
console.log('template journal');

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

            <div class="table-container">
                <simple-grid
                    data-source="/journal/events-journal"
                    columns='["server_date", "code", "card_number", "event_description"]'
                    clickable-columns='["code"]'
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
