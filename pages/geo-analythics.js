import { DynamicElement } from '../core/dynamic-element.js';
import '../components/dynamic/doughnutTabs.js';
import encode from '../assets/js/utils/encode.js';
import '../components/dynamic/geo-filtration-tabs.js';
import '../components/dynamic/chartComponent.js';
import '../components/dynamic/infoCard.js';

class GeoAnalythics extends DynamicElement {
  onAfterRender() {
    this.fetchFirstSummary();
    this.fetchSecondSummary();
  }

  async fetchFirstSummary(filters) {
    const query = filters ? this.buildQueryString(filters) : '';
    try {
      const response = await this.fetchData(`/analytics/summary?${query}`);
      const leftColumn = this.$('#left-column');

      if (leftColumn) {
        leftColumn.innerHTML = this.renderLeftColumn(response.data);
      }
    } catch (err) {
      console.error('❌ Error fetching summary:', err);
    }
  }

  async fetchSecondSummary(filters) {
    const query = filters ? this.buildQueryString(filters) : '';
    try {
      const response = await this.fetchData(`/analytics/summary?${query}`);
      const rightColumn = this.$('#right-column');

      if (rightColumn) {
        rightColumn.innerHTML = this.renderRightColumn(response.data);
      }
    } catch (err) {
      console.error('❌ Error fetching summary:', err);
    }
  }

  buildQueryString(filters) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(filters || {})) {
      if (value == null || value == 'null') continue;
      if (Array.isArray(value) && value.length) {
        value.forEach((v) => query.append(key, v));
      } else if (value !== '') {
        query.append(key, value);
      }
    }
    return query.toString();
  }

  addEventListeners() {
    let tabs1 = this.$('#tabs1');
    tabs1?.addEventListener('geo-submit', (e) => {
      this.fetchFirstSummary(e.detail);
    });

    let tabs2 = this.$('#tabs2');
    tabs2?.addEventListener('geo-submit', (e) => {
      console.log('e.detail', e.detail);

      this.fetchSecondSummary(e.detail);
    });
  }

  renderLeftColumn(data) {
    return this.renderColumn(data, '1');
  }
  renderRightColumn(data) {
    return this.renderColumn(data, '2');
  }

  renderColumn(data, suffix) {
    if (!data) return `<div class="loading">Տվյալները բեռնվում են…</div>`;

    const dispense = encode(data.dispense_summary);
    const deposit = encode(data.deposit_summary);
    const dispenseDynamic = encode(
      data.transaction_dynamics.dispense_dynamic.hourly_data?.length
        ? data.transaction_dynamics.dispense_dynamic.hourly_data
        : data.transaction_dynamics.dispense_dynamic.daily_data
    );

    const depositDynamic = encode(
      data.transaction_dynamics.deposit_dynamic.hourly_data?.length
        ? data.transaction_dynamics.deposit_dynamic.hourly_data
        : data.transaction_dynamics.deposit_dynamic.daily_data
    );

    const exchange = data.exchange_summary.currency_details;

    const transactionDynamics = encode(
      data.transaction_dynamics.overall_dynamic.hourly_data?.length
        ? data.transaction_dynamics.overall_dynamic.hourly_data
        : data.transaction_dynamics.overall_dynamic.daily_data
    );

    return /*html*/ `
    <div class="container">
      <doughnut-tabs id="dispense${suffix}" data="${dispense}" show-date="false" title="Կանխիկացում"></doughnut-tabs>
    </div>

    <div class="container">
      <doughnut-tabs id="deposit${suffix}" data="${deposit}" show-date="false" title="Մուտքագրում"></doughnut-tabs>
    </div>

    <div class="container">
      <container-top icon="icon-dollar-sign" title="Արտարժույթի փոխանակում"></container-top>
      <div class="infos">
        ${exchange
          .map(
            (ex) => `
            <info-card
              title="${ex.currency_code}"
              value="${ex.total_amount}"
              value-currency="$"
              trend="${ex.total_amount_percent_change}"
              icon="icon icon-box"
              show-border="true">
            </info-card>
          `
          )
          .join('')}
      </div>
    </div>

    <div class="container">
      <container-top icon="icon-trending-up" title="Գործարքների դինամիկա"></container-top>
      <chart-component
        show-date-selector='false'
        id="line-chart-transaction-dynamics${suffix}"
        chart-type="line"
        chart-data=${transactionDynamics}>
      </chart-component>
    </div>

    <div class="container">
      <container-top icon="icon-trending-up" title="Կանխիկացումների դինամիկա"></container-top>
      <chart-component
        show-date-selector='false'
        id="line-chart-dispense-dynamics${suffix}"
        chart-type="line"
        chart-data=${dispenseDynamic}>
      </chart-component>
    </div>

    <div class="container">
      <container-top icon="icon-trending-up" title="Մուտքագրված գումարների դինամիկա"></container-top>
      <chart-component
        show-date-selector='false'
        id="line-chart-deposit-dynamics${suffix}"
        chart-type="line"
        chart-data=${depositDynamic}>
      </chart-component>
    </div>
  `;
  }

  template() {
    return /*html*/ `
        <div class="row">
            <div class="column sm-6">
                <geo-filtration-tabs id='tabs1'></geo-filtration-tabs>
           </div>
              <div class="column sm-6">
                <geo-filtration-tabs id='tabs2'></geo-filtration-tabs>
           </div>
        </div>

        <div class="row" style="display: flex; align-items: flex-start;">
            <div class="column sm-6" id="left-column"></div>
            <div class="column sm-6"  id="right-column"></div>
        </div>  
        `;
  }
}

customElements.define('geo-analythics', GeoAnalythics);
