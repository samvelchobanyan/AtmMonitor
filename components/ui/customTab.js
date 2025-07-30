export class CustomTab extends HTMLElement {
    static get observedAttributes() {
        return ["active", "name"];
    }

    constructor() {
        super();
        this.addEventListener("click", this.activateTab.bind(this));
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        this.render();
    }

    activateTab() {
        const groupName = this.getAttribute("name");
        if (!groupName) return;

        const allTabs = Array.from(document.querySelectorAll(`custom-tab`));
        const allContents = Array.from(document.querySelectorAll(`.tab-content`));

        allTabs.forEach((tab) => tab.removeAttribute("active"));

        allContents.forEach((content) => {
            content.style.display = "none";
        });

        this.setAttribute("active", "");

        const target = document.querySelector(`.tab-content[data-tab="${groupName}"]`);

        if (target) {
            target.style.display = "block";
        }
    }

    render() {
        this.className = "tab" + (this.hasAttribute("active") ? " active" : "");
    }
}

customElements.define("custom-tab", CustomTab);
