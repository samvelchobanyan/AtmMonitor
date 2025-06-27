export class InfoCard extends HTMLElement {
    static get observedAttributes() {
        return ["title", "value", "value-currency", "value-color", "icon", "button-text", "stat", "stat-class", "message", "highlight", "border"];
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
        const title = this.getAttribute("title") || "";
        const value = this.getAttribute("value") || "";
        const valueCurrency = this.getAttribute("value-currency");
        const valueColor = this.getAttribute("value-color") || "";
        const icon = this.getAttribute("icon") || "";
        const buttonText = this.getAttribute("button-text");
        const stat = this.getAttribute("stat");
        const statClass = this.getAttribute("stat-class") || "";
        const message = this.getAttribute("message");

        const isHighlighted = this.hasAttribute("highlight");
        const hasBorder = this.hasAttribute("border");

        this.className = `info${isHighlighted ? " info_highlighted" : ""}${hasBorder ? " info_border" : ""}`;

        this.innerHTML = `
            <div class="info__top">
                <div class="info__title">${title}</div>
                ${icon ? `<div class="info__icon"><i class="${icon}"></i></div>` : ""}
            </div>
            <div class="info__bottom">
                <div class="info__text ${valueColor}">${value}${valueCurrency ? `<span>${valueCurrency}</span>` : ""}</div>
                ${stat ? `<div class="info__stat stat ${statClass}">${stat}</div>` : ""}
                ${buttonText ? `<div class="btn btn_link"><span>${buttonText}</span> <i class="icon icon-chevron-right"></i></div>` : ""}
                ${message ? `<div class="info__message message"><i class="icon icon-message"></i><span>${message}</span></div>` : ""}
            </div>
        `;
    }
}

customElements.define("info-card", InfoCard);
