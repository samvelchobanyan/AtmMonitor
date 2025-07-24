// components/ui/modal-popup.js
import { BaseElement } from "../../core/base-element.js";
class ModalPopup extends BaseElement {
    static get observedAttributes() {
        return ["open"];
    }

    render() {
        if (!this.hasAttribute("open")) {
            this.innerHTML = "";
            return;
        }

        const content = this.querySelector('[slot="content"]');

        this.innerHTML = `
          <div class="modal-overlay">
            <div class="modal-content"></div>
          </div>
        `;

        if (content) {
            this.querySelector(".modal-content").appendChild(content);
        }

        this.querySelector(".modal-overlay").addEventListener("click", (e) => {
            if (e.target.classList.contains("modal-overlay")) {
                this.removeAttribute("open");
            }
        });
    }
}

customElements.define("modal-popup", ModalPopup);
