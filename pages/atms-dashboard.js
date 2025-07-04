import { InfoCard } from "../components/ui/infoCard.js";
import { ContainerTop } from "../components/ui/containerTop.js";
import { LineChart } from "../components/ui/LineChart.js";
import "../components/dynamic/chartComponent.js"
// import { ChartComponent } from "../components/dynamic/chartComponent.js";

class AtmsDashboard extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    render() {
        this.innerHTML = this.getTemplate();
    }

    getTemplate() {
        return /* html */ `
            <div class="main-container">
                <div class="row">
                    <div class="column sm-2">
                        <info-card title="Առկա գումար" value="510,000,217" value-currency="֏" icon="icon icon-coins" highlight></info-card>
                    </div>
                    <div class="column sm-2">
                        <info-card title="Բանկոմատների թիվ" value="156" icon="icon icon-box"></info-card>
                    </div>
                    <div class="column sm-2">
                        <info-card title="Չաշխատող" value="4" value-color="color-red" icon="icon icon-x-octagon" button-text="Տեսնել"></info-card>
                    </div>
                    <div class="column sm-2">
                        <info-card title="Դատարկ" value="2" value-color="color-red" icon="icon icon-minus-circle" button-text="Տեսնել"></info-card>
                    </div>
                    <div class="column sm-2">
                        <info-card title="Վերջացող" value="11" icon="icon icon-box" value-color="color-orange" button-text="Տեսնել"></info-card>
                    </div>
                    <div class="column sm-2">
                        <info-card title="Առգրավված քարտեր" value="5" value-color="color-red" icon="icon icon-card" button-text="Տեսնել"></info-card>
                    </div>
                </div>
                <div class="row">
                    <div class="column sm-6">
                        <div class="container">
                            <container-top icon="icon-trending-up" title="Գործարքների գումար" link-text="Մանրամասն" link-href="/details"> </container-top>
                            <div class="infos">
                                <info-card title="Այսօր կանխիկացված գումար" value="510,000,217" value-currency="֏" value-color="color-green" stat='<i class="icon icon-up"></i><span>+7%</span>' stat-class="stat_green" border></info-card>
                                <info-card title="Այսօր մուտքագրված գումար" value="50,525,800" value-currency="֏" value-color="color-blue" stat='<i class="icon icon-down"></i><span>-3%</span>' stat-class="stat_red" border></info-card>
                            </div>
<!--                            <select-box value="1" options='[ {"value":"1","label":"Այսօր"}, {"value":"2","label":"Այս շաբաթ"}, {"value":"3","label":"Այս ամիս"} ]'></select-box>-->
<!--                            <line-chart chart-id="line-chart" legend-id="legend-container"> </line-chart>-->
                            <chart-component
                                id="line-chart"
                                api-url="/dashboard/transactions-amount-in-days"
                                start-date = "2025-06-24"
                                end-date = "2025-06-29"
                            ></chart-component>
                        </div>
                    </div>
                    <div class="column sm-6">
                        <div class="container">
                            <container-top icon="icon-chart" title="Գործարքների քանակ" link-text="Մանրամասն" link-href="/details"> </container-top>
                            <select-box-simple value="1" options='[ {"value":"1","label":"Այսօր"}, {"value":"2","label":"Այս շաբաթ"}, {"value":"3","label":"Այս ամիս"} ]'></select-box-simple>
                            <div class="chart-container chart-container_between">
                                <div class="chart chart_280">
                                    <canvas id="doughnut-chart"></canvas>
                                    <div class="chart-info">
                                        <div class="chart-info__number">15,000,000<span>֏</span></div>
                                        <div class="chart-info__stat stat stat_green"><i class="icon icon-up"></i><span>+7%</span></div>
                                    </div>
                                </div>
                                <div class="custom-legend custom-legend_center" id="legend-container-doughnut"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="column sm-12">
                        <div class="container">
                            <container-top icon="icon-coins" title="Ինկասացիա"> </container-top>
                            <div class="infos">
                                <info-card title="Այսօրվա ինկասացիաներ" value="17" icon="icon icon-box"></info-card>
                                <info-card title="Այսօր հետ բերված գումար" value="25,108,500" value-currency="֏" value-color="color-green" icon="icon icon-arrow-down-left"></info-card>
                                <info-card title="Բանկոմատների թիվ" value="250,108,500" value-currency="֏" value-color="color-blue" icon="icon icon-arrow-up-right"></info-card>
                                <info-card title="Երեկ դատարկ բանկոմատներ" value="5" value-color="color-red" icon="icon icon-box" message="2"></info-card>
                            </div>
                            <select-box-simple value="1" options='[ {"value":"1","label":"Այսօր"}, {"value":"2","label":"Այս շաբաթ"}, {"value":"3","label":"Այս ամիս"} ]'></select-box-simple>
                            <line-chart chart-id="line-chart-2" legend-id="legend-container-2"> </line-chart>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define("atms-dashboard", AtmsDashboard);
