
// components/ui/modal-popup.js
import { BaseElement } from "../../core/base-element.js";

class ModalPopup extends BaseElement {
    connectedCallback() {
        // Render base structure only if not already set
        if (!this.innerHTML.trim()) {
            this.render();
        }

        // Close on outside click
        this.querySelector(".modal-overlay")?.addEventListener("click", (e) => {
            if (e.target === e.currentTarget) {
                this.remove();
            }
        });

        // Close on ESC
        this._escHandler = (e) => {
            if (e.key === "Escape") this.remove();
        };
        document.addEventListener("keydown", this._escHandler);
    }

    disconnectedCallback() {
        if (this._escHandler) {
            document.removeEventListener("keydown", this._escHandler);
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
        const target = this.querySelector("#popup-content");
        if (!target) return;

        if (typeof content === "string") {
            target.innerHTML = content;
        } else if (content instanceof Node) {
            target.innerHTML = "";
            target.appendChild(content);
        }

        // Reattach close button listener (if present)
        const closeBtn = this.querySelector(".modal__close");
        closeBtn?.addEventListener("click", () => this.remove());
    }

    /**
     * Universal method to render modal with title, body, and optional body class
     * @param {Object} options
     * @param {string} options.title - Modal title
     * @param {string} [options.bodyClass] - Optional class for body container
     * @param {string|Node} options.bodyContent - Inner HTML or Node for modal body
     */
    renderModal({ title, bodyClass = "", bodyContent = "", footerContent = "" }) {
        const html = `
      <div class="modal__header">
        <div class="modal__title">${title}</div>
        <img class="modal__close" src="assets/img/icons/x-circle.svg" alt="close" />
      </div>
      <div class="modal__body ${bodyClass}">
        ${bodyContent}
      </div>
       ${footerContent ? `<div class="modal__footer">${footerContent}</div>` : ""}
    `;
        this.setContent(html);
    }
}

customElements.define("modal-popup", ModalPopup);
