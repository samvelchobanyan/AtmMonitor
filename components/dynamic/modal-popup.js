// components/ui/modal-popup.js
import { BaseElement } from '../../core/base-element.js';

class ModalPopup extends BaseElement {
  static get observedAttributes() { return ['open']; }

  render() {
    if (!this.hasAttribute('open')) {
      this.innerHTML = '';
      return;
    }

    this.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <h2>Ընտրեք ամսաթվի միջակայքը</h2>
          <slot name="content"></slot>
        </div>
      </div>
    `;

    // Optional: click outside to close
    this.querySelector('.modal-overlay').addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        this.removeAttribute('open');
      }
    });
  }
}

customElements.define('modal-popup', ModalPopup);
