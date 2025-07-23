class BadgeItem extends HTMLElement {
    static get observedAttributes() {
        return ["text"];
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

        this.classList.add("badge");

        this.innerHTML = `<span>${text}</span>`;
    }
}

customElements.define("badge-item", BadgeItem);
