export class AtmItem extends HTMLElement {
    static get observedAttributes() {
        return ["id", "city", "district", "address", "status", "icon", "data-working"];
    }

    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        
        // Add click event listener and dispatch custom event
        this.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('atm-item-clicked', {
                detail: {
                    id: this.getAttribute('id'),
                    latitude: this.getAttribute('data-lat'),
                    longitude: this.getAttribute('data-lng')
                },
                bubbles: true,
                composed: true
            }));
        });
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        const id = this.getAttribute("id") || "";
        const city = this.getAttribute("city") || "";
        const district = this.getAttribute("district") || "";
        const address = this.getAttribute("address") || "";
        
        const isWorking = this.getAttribute("data-working") === "true";
        const status = isWorking ? "Աշխատող" : "Չաշխատող";
        const statusClass = isWorking ? "atm-item__status_working" : "atm-item__status_not-working";

        this.classList.add("atm-item");

        this.innerHTML = `
            <div class="atm-item__icon">
                <img src="assets/img/atm-icon.svg" alt="ATM Icon"/>
            </div>
            <div class="atm-item__info">
                <div class="atm-item__id"><span class="atm-item__label">ATM ID:</span> <span class="atm-item__value">#<span class="font-black">${id}</span></span></div>
                <div class="atm-item__location">
                    <div><span class="atm-item__label">Քաղաք՝</span> <span class="atm-item__value">${city}</span></div>
                    <div><span class="atm-item__label">Համայնք՝</span> <span class="atm-item__value">${district}</span></div>
                </div>
                <div class="atm-item__address">
                    <span class="atm-item__label">Հասցե՝</span> <span class="atm-item__value">${address}</span>
                </div>
            </div>
            <div class="atm-item__status ${statusClass}">
                <span>${status}</span>
            </div>
        `;
    }
}

customElements.define("atm-item", AtmItem);
