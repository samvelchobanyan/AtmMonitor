import page from "https://unpkg.com/page/page.mjs";

export class AtmItem extends HTMLElement {
    static get observedAttributes() {
        return ["id", "city", "district", "address", "status", "icon", "data-working"];
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
        const id = this.getAttribute("id") || "";
        const name = this.getAttribute("name") || "";
        const city = this.getAttribute("city") || "";
        const district = this.getAttribute("district") || "";
        const address = this.getAttribute("address") || "";
        const isConnected = this.getAttribute("connection-status") == "1";
        const isWorking = this.getAttribute("data-working") == "1";
        const connectionStatus = isConnected ? "Կապի մեջ" : "Կապից դուրս";
        const workingStatus = isWorking ? "Աշխատում է" : "Չի աշխատում";
        const connectionStatusClass = isConnected
            ? "atm-item__status_working"
            : "atm-item__status_not-working";
        const workingStatusClass = isWorking
            ? "atm-item__status_working"
            : "atm-item__status_not-working";

        this.classList.add("atm-item");

        this.innerHTML = `
          <a href="atms/${id}" class="atm-item__link align-between">
            <div style='display:flex'>
                <div class="atm-item__icon">
                    <img src="assets/img/atm-icon.svg" alt="ATM Icon"/>
                </div>
                <div class="atm-item__info">
                    <div class="atm-item__id"><span class="atm-item__label">Անուն:</span> <span class="atm-item__value"><span class="font-black">${name}</span></span></div>
                    <div class="atm-item__location">
                        <div><span class="atm-item__label">ATM ID:</span> <span class="atm-item__value">${id}</span></div>
                        <div><span class="atm-item__label">Քաղաք՝</span> <span class="atm-item__value">${city}</span></div>
                        <div><span class="atm-item__label">Համայնք՝</span> <span class="atm-item__value">${district}</span></div>
                    </div>
                    <div class="atm-item__address">
                        <span class="atm-item__label">Հասցե՝</span> <span class="atm-item__value">${address}</span>
                    </div>
                </div>
            </div>
            <div>
                <div class="atm-item__status ${connectionStatusClass}" style="margin-bottom:8px">
                    <span>${connectionStatus}</span>
                </div>
                    <div class="atm-item__status ${workingStatusClass}">
                    <span>${workingStatus}</span>
                </div>
            </div>
        </a>
        `;
    }
}

customElements.define("atm-item", AtmItem);
