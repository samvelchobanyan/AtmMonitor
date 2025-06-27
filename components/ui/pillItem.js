export class PillItem extends HTMLElement {
    static get observedAttributes() {
        return ["text", "add", "remove"];
    }

    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        this.attachEvents();
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        const text = this.getAttribute("text") || "";
        const remove = this.hasAttribute("remove");
        const add = this.hasAttribute("add");

        const type = add ? "blue" : remove ? "gray" : "";

        this.className = `pill pill_${type}`;

        this.innerHTML = `
            ${add ? `<i class="icon icon-plus-circle"></i>` : ""}
            <span>${text}</span>
            ${remove ? `<i class="icon icon-x" role="button" tabindex="0"></i>` : ""}
        `;
    }

    attachEvents() {
        const closeIcon = this.querySelector(".icon-x");
        if (closeIcon) {
            closeIcon.addEventListener("click", () => this.remove());
        }
    }
}

customElements.define("pill-item", PillItem);

// implementation example

//  <pill-item text="ՍԱՍ Սուպերմարկետ" remove></pill-item>
//  <pill-item text="Ավելացնել սեգմենտ" add></pill-item>
