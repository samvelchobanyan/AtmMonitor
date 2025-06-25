import { StaticElement } from "../core/static-element.js";

class AtmsDashboard extends StaticElement {
    render() {
        return `
            <div class="main-container">
                <div class="row">
                    <div class="column sm-2">
                        <div class="info info_highlighted">
                            <div class="info__top">
                                <div class="info__title">Առկա գումար</div>
                                <div class="info__icon"><i class="icon icon-coins"></i></div>
                            </div>
                            <div class="info__bottom">
                                <div class="info__text">510,000,217<span>֏</span></div>
                            </div>
                        </div>
                    </div>
                    <div class="column sm-2">
                        <div class="info">
                            <div class="info__top">
                                <div class="info__title">Բանկոմատների թիվ</div>
                                <div class="info__icon"><i class="icon icon-box"></i></div>
                            </div>
                            <div class="info__bottom">
                                <div class="info__text">156</div>
                            </div>
                        </div>
                    </div>
                    <div class="column sm-2">
                        <div class="info">
                            <div class="info__top">
                                <div class="info__title">Չաշխատող</div>
                                <div class="info__icon"><i class="icon icon-x-octagon"></i></div>
                            </div>
                            <div class="info__bottom">
                                <div class="info__text color-red">4</div>
                                <div class="btn btn_link">
                                    <span>Տեսնել</span> <i class="icon icon-chevron-right"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="column sm-2">
                        <div class="info">
                            <div class="info__top">
                                <div class="info__title">Դատարկ</div>
                                <div class="info__icon"><i class="icon icon-minus-circle"></i></div>
                            </div>
                            <div class="info__bottom">
                                <div class="info__text color-red">2</div>
                                <div class="btn btn_link">
                                    <span>Տեսնել</span> <i class="icon icon-chevron-right"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="column sm-2">
                        <div class="info">
                            <div class="info__top">
                                <div class="info__title">Վերջացող</div>
                                <div class="info__icon"><i class="icon icon-box"></i></div>
                            </div>
                            <div class="info__bottom">
                                <div class="info__text color-orange">11</div>
                                <div class="btn btn_link">
                                    <span>Տեսնել</span> <i class="icon icon-chevron-right"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="column sm-2">
                        <div class="info">
                            <div class="info__top">
                                <div class="info__title">Առգրավված քարտեր</div>
                                <div class="info__icon"><i class="icon icon-card"></i></div>
                            </div>
                            <div class="info__bottom">
                                <div class="info__text color-red">5</div>
                                <div class="btn btn_link">
                                    <span>Տեսնել</span> <i class="icon icon-chevron-right"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="column sm-6">
                        <div class="container">
                            <div class="container__top">
                                <div class="container__title">
                                    <div class="title-icon"><i class="icon icon-trending-up"></i></div>
                                    <h2 class="h2-font">Գործարքների գումար</h2>
                                </div>
                                <a href="" class="btn btn_link color-blue"><span>Մանրամասն</span><i class="icon icon-chevron-right"></i></a>
                            </div>
                            <div class="infos">
                                <div class="info info_border">
                                    <div class="info__top">
                                        <div class="info__title">Այսօր կանխիկացված գումար</div>
                                    </div>
                                    <div class="info__bottom">
                                        <div class="info__text color-green">510,000,217<span>֏</span></div>
                                        <div class="info__stat stat stat_green"><i class="icon icon-up"></i><span>+7%</span></div>
                                    </div>
                                </div>
                                <div class="info info_border">
                                    <div class="info__top">
                                        <div class="info__title">Այսօր մուտքագրված գումար</div>
                                    </div>
                                    <div class="info__bottom">
                                        <div class="info__text color-blue">50,525,800<span>֏</span></div>
                                        <div class="info__stat stat stat_red"><i class="icon icon-down"></i><span>-3%</span></div>
                                    </div>
                                </div>
                            </div>
                            <div class="custom-select">
                                <div class="combo-box" data-combo-name="single" data-combo-value="today">
                                    <div class="combo-box-selected">
                                        <div class="combo-box-selected-wrap">
                                            <span class="combo-box-placeholder">Այսօր</span>
                                        </div>
                                    </div>
                                    <div class="combo-box-dropdown">
                                        <div class="combo-box-options">
                                            <div class="combo-option selected" data-option-value="today">
                                                <span>Այսօր</span>
                                            </div>
                                            <div class="combo-option" data-option-value="1">
                                                <span>Այս շաբաթ</span>
                                            </div>
                                            <div class="combo-option" data-option-value="2">
                                                <span>Այս ամիս</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="chart-container">
                                <div class="chart chart_252">
                                    <canvas id="line-chart"></canvas>
                                </div>
                                <div class="custom-legend custom-legend_checkmark" id="legend-container"></div>
                            </div>
                        </div>
                    </div>
                    <div class="column sm-6">
                        <div class="container">
                            <div class="container__top">
                                <div class="container__title">
                                    <div class="title-icon"><i class="icon icon-chart"></i></div>
                                    <h2 class="h2-font">Գործարքների քանակ</h2>
                                </div>
                                <a href="" class="btn btn_link color-blue"><span>Մանրամասն</span><i class="icon icon-chevron-right"></i></a>
                            </div>
                            <div class="custom-select">
                                <div class="combo-box" data-combo-name="single" data-combo-value="today">
                                    <div class="combo-box-selected">
                                        <div class="combo-box-selected-wrap">
                                            <span class="combo-box-placeholder">Այսօր</span>
                                        </div>
                                    </div>
                                    <div class="combo-box-dropdown">
                                        <div class="combo-box-options">
                                            <div class="combo-option selected" data-option-value="today">
                                                <span>Այսօր</span>
                                            </div>
                                            <div class="combo-option" data-option-value="1">
                                                <span>Այս շաբաթ</span>
                                            </div>
                                            <div class="combo-option" data-option-value="2">
                                                <span>Այս ամիս</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                            <div class="container__top">
                                <div class="container__title">
                                    <div class="title-icon"><i class="icon icon-coins"></i></div>
                                    <h2 class="h2-font">Ինկասացիա</h2>
                                </div>
                            </div>
                            <div class="infos">
                                <div class="info">
                                    <div class="info__top">
                                        <div class="info__title">Այսօրվա ինկասացիաներ</div>
                                        <div class="info__icon"><i class="icon icon-box"></i></div>
                                    </div>
                                    <div class="info__bottom">
                                        <div class="info__text">17</div>
                                    </div>
                                </div>
                                <div class="info">
                                    <div class="info__top">
                                        <div class="info__title">Այսօր հետ բերված գումար</div>
                                        <div class="info__icon"><i class="icon icon-arrow-down-left"></i></div>
                                    </div>
                                    <div class="info__bottom">
                                        <div class="info__text color-green">25,108,500<span>֏</span></div>
                                    </div>
                                </div>
                                <div class="info">
                                    <div class="info__top">
                                        <div class="info__title">Բանկոմատների թիվ</div>
                                        <div class="info__icon"><i class="icon icon-arrow-up-right"></i></div>
                                    </div>
                                    <div class="info__bottom">
                                        <div class="info__text color-blue">250,108,500<span>֏</span></div>
                                    </div>
                                </div>
                                <div class="info">
                                    <div class="info__top">
                                        <div class="info__title">Երեկ դատարկ բանկոմատներ</div>
                                        <div class="info__icon"><i class="icon icon-box"></i></div>
                                    </div>
                                    <div class="info__bottom">
                                        <div class="info__text color-red">5</div>
                                        <div class="info__message message"><i class="icon icon-message"></i><span>2</span></div>
                                    </div>
                                </div>
                            </div>
                            <div class="custom-select">
                                <div class="combo-box" data-combo-name="single" data-combo-value="today">
                                    <div class="combo-box-selected">
                                        <div class="combo-box-selected-wrap">
                                            <span class="combo-box-placeholder">Այսօր</span>
                                        </div>
                                    </div>
                                    <div class="combo-box-dropdown">
                                        <div class="combo-box-options">
                                            <div class="combo-option selected" data-option-value="today">
                                                <span>Այսօր</span>
                                            </div>
                                            <div class="combo-option" data-option-value="1">
                                                <span>Այս շաբաթ</span>
                                            </div>
                                            <div class="combo-option" data-option-value="2">
                                                <span>Այս ամիս</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="chart-container">
                                <div class="chart chart_252">
                                    <canvas id="line-chart-2"></canvas>
                                </div>
                                <div class="custom-legend custom-legend_checkmark" id="legend-container-2"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    `;
    }
}

customElements.define("atms-dashboard", AtmsDashboard);
