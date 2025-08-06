import { DynamicElement } from "../core/dynamic-element.js";
import { ContainerTop } from "../components/ui/containerTop.js";
import "../components/dynamic/doughnutTabs.js";
import "../components/ui/customTab.js";
import "../components/dynamic/select-box-search.js";
import "../components/ui/customCheck.js";
import "../components/dynamic/segment.js";

class GeoAnalythics extends DynamicElement {
  constructor() {
    super();

    this.state = {
      summary: null,
      atmId: null
    };

    this.currentRegion = null;
    this.currentCity = null;
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
      const response = await this.fetchData(
        `/analytics/summary?${queryString}`
      );
      this.currentRegion = region;
      this.currentCity = city;
      this.setState({
        summary: response,
        atmId: atmId
      });
    } catch (err) {
      console.error("❌ Error fetching summary:", err);
      this.setState({ summary: null });
    }
  }
  onStoreChange(storeState) {
    const region = storeState.selectedRegion;
    const city = storeState.selectedCity;
    if (region !== this.currentRegion || city !== this.currentCity) {
      this.fetchSummary(region, city);
    }
  }

  template() {
    const summary = this.state.summary;
    if (!summary) {
      return /*html*/ `
            <div class="row">
                <div class="column sm-12">
                    <div class="loading">
                        <div class="loading__spinner spinner"></div>
                        <div class="loading__text">Տվյալները բեռնվում են…</div>
                    </div>
                </div>
            </div>
            `;
    }
    console.log("!!!!!!!!!!!!!", summary.data);

    const dispenseData = JSON.stringify(summary.data.dispense_summary).replace(
      /"/g,
      "&quot;"
    );
    const depositData = JSON.stringify(summary.data.deposit_summary).replace(
      /"/g,
      "&quot;"
    );
    const transactionsData = JSON.stringify(
      summary.data.transaction_dynamics.exchange_dynamic.hourly_data
    ).replace(/"/g, "&quot;");

    const dispenseDynamicData = JSON.stringify(
      summary.data.transaction_dynamics.dispense_dynamic.hourly_data
    ).replace(/"/g, "&quot;");

    const depositDynamicData = JSON.stringify(
      summary.data.transaction_dynamics.deposit_dynamic.hourly_data
    ).replace(/"/g, "&quot;");

    const exchangeData = summary.data.exchange_summary.currency_details;

    return /*html*/ `
        <div class="row">
           <div class="column sm-6">
                <div class="container">
                    <div class="tabs-container">
                        <div class="tabs">
                            <custom-tab name="geo" active>Աշխարհագրական</custom-tab>
                            <custom-tab name="atms">Բանկոմատներ</custom-tab>
                        </div>
                    </div>
                    <div class="tab-content" data-tab="geo">
                       <div class="row"> 
                            <select-box placeholder="Choose district" options='[ {"value":"s","label":"Apple"}, {"value":"banana","label":"Banana"}, {"value":"cherry","label":"Cherry"} ]'> </select-box>
                            <select-box placeholder="Choose city" options='[ {"value":"s","label":"Apple"}, {"value":"banana","label":"Banana"}, {"value":"cherry","label":"Cherry"} ]'> </select-box>
                            <select-box placeholder="Choose village" options='[ {"value":"s","label":"Apple"}, {"value":"banana","label":"Banana"}, {"value":"cherry","label":"Cherry"} ]'> </select-box>
                        </div>
                        <div class="row"> <segment-block></segment-block></div>
                    </div>
                    <div class="tab-content" data-tab="atms" style="display: none;">
                        <select-box-search placeholder="Choose your fruit" options='[ {"value":"s","label":"Apple"}, {"value":"banana","label":"Banana"}, {"value":"cherry","label":"Cherry"} ]'> </select-box-search>
                    <div class="tab-content" data-tab="atms" style="display: none;">
                        <div class="checkboxes">
                            <custom-checkbox id="yerevan" value="yerevan" checked>Երևան</custom-checkbox> 
                            <custom-checkbox id="armavir" value="armavir">Արմավիր</custom-checkbox> 
                            <custom-checkbox id="lori" value="lori">Լոռի</custom-checkbox> 
                            <custom-checkbox id="tavush" value="tavush">Տավուշ</custom-checkbox> 
                            <custom-checkbox id="aragatsotn" value="aragatsotn">Արագածոտն</custom-checkbox> 
                            <custom-checkbox id="gegharkunik" value="gegharkunik">Գեղարքունիք</custom-checkbox> 
                            <custom-checkbox id="shirak" value="shirak">Շիրակ</custom-checkbox> 
                            <custom-checkbox id="vayots-dzor" value="vayots-dzor">Վայոց ձոր</custom-checkbox> 
                            <custom-checkbox id="ararat" value="ararat">Արարատ</custom-checkbox> 
                            <custom-checkbox id="kotayk" value="kotayk">Կոտայք</custom-checkbox> 
                            <custom-checkbox id="syunik" value="syunik">Սյունիք</custom-checkbox> 
                        </div>  
                    </div>
                    </div>
                </div>
            </div>

             <div class="column sm-6">
                <div class="container">
                    <div class="tabs-container">
                        <div class="tabs">
                            <custom-tab name="geo" active>Աշխարհագրական</custom-tab>
                            <custom-tab name="atms">Բանկոմատներ</custom-tab>
                        </div>
                    </div>
                    <div class="tab-content" data-tab="geo">
                       <div class="row"> 
                            <select-box placeholder="Choose district" options='[ {"value":"s","label":"Apple"}, {"value":"banana","label":"Banana"}, {"value":"cherry","label":"Cherry"} ]'> </select-box>
                            <select-box placeholder="Choose city" options='[ {"value":"s","label":"Apple"}, {"value":"banana","label":"Banana"}, {"value":"cherry","label":"Cherry"} ]'> </select-box>
                            <select-box placeholder="Choose village" options='[ {"value":"s","label":"Apple"}, {"value":"banana","label":"Banana"}, {"value":"cherry","label":"Cherry"} ]'> </select-box>
                        </div>
                        <div class="row"> <segment-block></segment-block></div>
                    </div>
                    <div class="tab-content" data-tab="atms" style="display: none;">
                        <select-box-search placeholder="Choose your fruit" options='[ {"value":"s","label":"Apple"}, {"value":"banana","label":"Banana"}, {"value":"cherry","label":"Cherry"} ]'> </select-box-search>
                    <div class="tab-content" data-tab="atms" style="display: none;">
                        <div class="checkboxes">
                            <custom-checkbox id="yerevan" value="yerevan" checked>Երևան</custom-checkbox> 
                            <custom-checkbox id="armavir" value="armavir">Արմավիր</custom-checkbox> 
                            <custom-checkbox id="lori" value="lori">Լոռի</custom-checkbox> 
                            <custom-checkbox id="tavush" value="tavush">Տավուշ</custom-checkbox> 
                            <custom-checkbox id="aragatsotn" value="aragatsotn">Արագածոտն</custom-checkbox> 
                            <custom-checkbox id="gegharkunik" value="gegharkunik">Գեղարքունիք</custom-checkbox> 
                            <custom-checkbox id="shirak" value="shirak">Շիրակ</custom-checkbox> 
                            <custom-checkbox id="vayots-dzor" value="vayots-dzor">Վայոց ձոր</custom-checkbox> 
                            <custom-checkbox id="ararat" value="ararat">Արարատ</custom-checkbox> 
                            <custom-checkbox id="kotayk" value="kotayk">Կոտայք</custom-checkbox> 
                            <custom-checkbox id="syunik" value="syunik">Սյունիք</custom-checkbox> 
                        </div>  
                    </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="column sm-6">
                <div class="container">
                    <doughnut-tabs id="dispense" data="${dispenseData}"></doughnut-tabs>
                </div>
            </div>

            <div class="column sm-6">
                <div class="container">
                    <doughnut-tabs id="dispense" data="${dispenseData}"></doughnut-tabs>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="column sm-6">
                <div class="container">
                    <doughnut-tabs id="deposit" data="${depositData}"></doughnut-tabs>
                </div>
            </div>

            <div class="column sm-6">
                <div class="container">
                    <doughnut-tabs id="deposit" data="${depositData}"></doughnut-tabs>
                </div>
            </div>
            </div>

<div class="row">
            <div class="column sm-6">
                <div class="container">

                <container-top icon="icon-coins" title="Արտարժույթի փոխանակում"></container-top>
                <div class="infos">
                    ${exchangeData
                      .map(exchange => {
                        return `
                        <info-card
                        title="${exchange.currency_code}"
                        value="${exchange.total_amount}"
                        value-currency="$"
                        trend="${exchange.total_amount_percent_change}"
                        icon="icon icon-box"
                        show-border="true">
                        </info-card>`;
                      })
                      .join("")}
                </div>
                </div>
                </div>
            <div class="column sm-6">

                 <div class="container">

                <container-top icon="icon-coins" title="Արտարժույթի փոխանակում"></container-top>
                <div class="infos">
                    ${exchangeData
                      .map(exchange => {
                        return `
                        <info-card
                        title="${exchange.currency_code}"
                        value="${exchange.total_amount}"
                        value-currency="$"
                        trend="${exchange.total_amount_percent_change}"
                        icon="icon icon-box"
                        show-border="true">
                        </info-card>`;
                      })
                      .join("")}
                </div>
                </div>
                </div>

              
            </div>

            <div class="column sm-6">
                <div class="container">
                <container-top icon="icon-trending-up" title="Կանխիկացումների դինամիկա"></container-top>
                <chart-component
                    id="line-chart-dispense-dynamics"
                    chart-type="line"
                    chart-data='${dispenseDynamicData}'
                    api-url="/analytics/dispense-dynamic-in-days"
                    ${this.attrIf("city", this.state.currentCity)}
                    ${this.attrIf("region", this.state.currentRegion)}>
                </chart-component>
                </div>
            </div>

            <div class="column sm-6">
                <div class="container">
                <container-top icon="icon-trending-up" title="Մուտքագրված գումարների դինամիկա"></container-top>
                <chart-component
                    id="line-chart-deposit-dynamics"
                    chart-type="line"
                    chart-data='${depositDynamicData}'
                    api-url="/analytics/deposit-dynamic-in-days"
                    ${this.attrIf("city", this.state.currentCity)}
                    ${this.attrIf("region", this.state.currentRegion)}>
                </chart-component>
                </div>
            </div>
            </div>
            
        `;
  }
}

customElements.define("geo-analythics", GeoAnalythics);
