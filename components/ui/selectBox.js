import { StaticElement } from '../../core/static-element.js';

class SelectBox extends StaticElement {
  render() {
    return /*html*/`
      <div class="custom-select">
        <div class="combo-box" data-combo-name="single" data-combo-value="all">
            <div class="combo-box-selected">
                <div class="combo-box-selected-wrap">
                    <span class="combo-box-placeholder">Երևան</span>
                </div>
            </div>
            <div class="combo-box-dropdown">
                <div class="combo-box-options">
                    <div class="combo-option selected" data-option-value="all">
                        <span>Երևան</span>
                    </div>
                    <div class="combo-option" data-option-value="1">
                        <span>Գորիս</span>
                    </div>
                    <div class="combo-option" data-option-value="2">
                        <span>Գյումրի</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
  }
}

customElements.define('select-box', SelectBox);