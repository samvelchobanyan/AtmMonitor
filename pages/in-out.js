import { DynamicElement } from "../core/dynamic-element.js";
import "../components/dynamic/chartComponent.js";
import "../components/static/infoCard.js";
import "../components/ui/customTab.js";
import "../components/dynamic/doughnutChart.js";

class inOut extends DynamicElement {
  constructor() {
    super();

    this.state = {
      selectedRegion: null,
      selectedCity: null,
      summary: null,
      atmId: null,
    };
  }

  onConnected() {
    this.fetchSummary();
  }

  async fetchSummary(region, city, atmId) {
    const queryString = new URLSearchParams();
    if (region) {
      queryString.append("district", region);
    }
    if (city) {
      queryString.append("city", city);
    }
    if (atmId) {
      queryString.append("atmId", atmId);
    }

    try {
      const response = await this.fetchData(`/analytics/summary?${queryString}`);
      this.setState({
        selectedRegion: region,
        selectedCity: city,
        summary: response.data,
        atmId: atmId,
      });
    } catch (err) {
      console.error("❌ Error fetching summary:", err);
      this.setState({ summary: null });
    }
  }
  onStoreChange(storeState) {
    const region = storeState.selectedRegion;
    const city = storeState.selectedCity;
    if (region !== this.state.selectedRegion || city !== this.state.selectedCity) {
      this.fetchSummary(region, city); // one API call → one render
    }
  }

  template() {
    if (!this.state.summary) {
      return /*html*/ `
            <div class="main-container">
                <div class="row">
                    <div class="column sm-12">
                        <div class="loading">
                            <div class="loading__spinner spinner"></div>
                            <div class="loading__text">Տվյալները բեռնվում են…</div>
                        </div>
                    </div>
                </div>
            </div>
            `;
    }

    const cashCardSummary = this.state.summary.dispense_summary;
    const safeData = JSON.stringify(cashCardSummary).replace(/"/g, "&quot;");

    return `
            <div class="main-container">
                <div class="row">
                    <div class="column sm-6">
                        <div class="container">
                             <container-top icon="icon-arrow-down-left" title="Կանխիկացում"> </container-top>
                            <div class="tabs">
                                <custom-tab name="language" active>English</custom-tab>
                                <custom-tab name="language">Հայերեն</custom-tab>
                            </div> 
                            <div class="chart-container">
                              <doughnut-chart id="dispence-amount" title='${cashCardSummary.dispense_amount}' initData=${safeData} type='amount'></doughnut-chart>
                              <doughnut-chart id="dispence-count" title='${cashCardSummary.dispense_count}' initData=${safeData} type='count'></doughnut-chart>
                            </div>
                          </div>
                        
                    </div>
                    <div class="column sm-6">
                        <div class="container">
                             <container-top icon="icon-arrow-down-left" title="Կանխիկացում"> </container-top>
                            <div class="tabs">
                                <custom-tab name="language" active>English</custom-tab>
                                <custom-tab name="language">Հայերեն</custom-tab>
                            </div> 
                           <doughnut-chart id="finance-chart"></doughnut-chart>
                        </div>
                        
                    </div>
              </div>
            </div>
        `;
  }
}

customElements.define("in-out", inOut);
