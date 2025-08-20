import { DynamicElement } from "../core/dynamic-element.js";
import "../components/dynamic/list-view.js";
import "../components/ui/atmItem.js";
import { store } from "../core/store/store.js";

class AtmList extends DynamicElement {
  constructor() {
    super();

    this.state = {
      atms: null,
    };

    //store selected region and city to compare when store changed
    this.selectedRegion = null;
    this.selectedCity = null;

  }

  onConnected() {
    console.log('atm connected');
    this.fetchAtms();
  }

  onStoreChange(state) {
    if (this.selectedRegion !== state.selectedRegion || this.selectedCity !== state.selectedCity) {
      this.selectedCity = state.selectedCity;
      this.selectedRegion = state.selectedRegion;
      this.fetchAtms(); // one API call → one render
    }
  }

  async fetchAtms(){
    const queryString = new URLSearchParams();

    const globalState = store.getState();
    if (globalState.selectedRegion) {
      this.selectedRegion = globalState.selectedRegion;
      queryString.append("district", globalState.selectedRegion);
    }
    if (globalState.selectedCity) {
      this.selectedCity = globalState.selectedCity;
      queryString.append("city", globalState.selectedCity);
    }

    try {
      const response = await this.fetchData(`/atm/getatms?${queryString}`);
      this.setState({
        atms: response.data.atms,
      });
    } catch (err) {
      console.error("❌ Error fetching summary:", err);
      this.setState({ atms: null });
    }
  }

  template() {
    if (this.state.atms === null) return;
    return  /*html*/ `
            <div class="row">
                <div class="column sm-6">
                    <list-view
                      scroll
                      white
                      searchable
                      search-fields="id,city,district,address"
                      items='${JSON.stringify(this.state.atms)}'
                    >
                    <template>
                        <atm-item 
                            id="{{id}}" 
                            city="{{city}}" 
                            district="{{district}}" 
                            address="{{address}}"
                            data-working="{{isWorking}}">
                        </atm-item>
                    </template>
                </list-view>
                </div>
            </div>
        `;
  }
}

customElements.define("atm-list", AtmList);
