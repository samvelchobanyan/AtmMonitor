export class infoItem extends HTMLElement {
    static get observedAttributes() {
        return ["text", "value", "data-working"];
    }

    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        const text = this.getAttribute("text") || "";
        const infoValue = this.getAttribute("value");

        this.classList.add("info-item");

        if (infoValue !== null) {
            this.innerHTML = `
                <span>${text}</span>
                <span class="info-item__value">${infoValue}</span>
            `;
        } else {
            const isWorking = this.getAttribute("data-working") === "true";
            const status = isWorking ? "Աշխատում է" : "Չի աշխատում";
            const statusClass = isWorking
                ? "info-item__status_working"
                : "info-item__status_not-working";

            this.innerHTML = `
                <span>${text}</span>
                <span class="info-item__status ${statusClass}">${status}</span>
            `;
        }
    }
}

customElements.define("info-item", infoItem);
