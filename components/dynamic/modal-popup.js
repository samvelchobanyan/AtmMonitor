// components/ui/modal-popup.js
import { BaseElement } from "../../core/base-element.js";
class ModalPopup extends BaseElement {
    connectedCallback() {
        this.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-content" id="popup-content"></div>
    </div>
  `;

        // Close on outside click
        this.querySelector(".modal-overlay")?.addEventListener("click", (e) => {
            if (e.target === e.currentTarget) {
                this.remove();
            }
        });

        // Close on ESC
        this._escHandler = (e) => {
            if (e.key === 'Escape') this.remove();
        };
        document.addEventListener('keydown', this._escHandler);
    }

    disconnectedCallback() {
        if (this._escHandler) {
            document.removeEventListener('keydown', this._escHandler);
        }
    }

    render() {
        this.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content" id="popup-content"></div>
      </div>
    `;
    }

    /**
     * Injects HTML or Node into the modal content area
     * @param {string | Node} content
     */
    setContent(content) {
        const target = this.querySelector('#popup-content');
        if (!target) return;

        if (typeof content === 'string') {
            target.innerHTML = content;
        } else if (content instanceof Node) {
            target.innerHTML = '';
            target.appendChild(content);
        }
    }
}

customElements.define("modal-popup", ModalPopup);
