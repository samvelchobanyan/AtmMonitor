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

    // activateTab() {
    //     const groupName = this.getAttribute("name");
    //     if (!groupName) return;

    //     const allTabs = Array.from(document.querySelectorAll(`custom-tab`));
    //     const allContents = Array.from(document.querySelectorAll(`.tab-content`));

    //     allTabs.forEach((tab) => tab.removeAttribute("active"));

    //     allContents.forEach((content) => {
    //         content.style.display = "none";
    //     });

    //     this.setAttribute("active", "");

    //     const target = document.querySelector(`.tab-content[data-tab="${groupName}"]`);

    //     if (target) {
    //         target.style.display = "block";
    //     }
    // }

    activateTab() {
        const groupName = this.getAttribute("name");
        if (!groupName) return;

        // Limit search to this tab's container
        const container = this.closest(".container");
        if (!container) return;

        // Find tabs and contents only inside this container
        const allTabs = Array.from(container.querySelectorAll(`custom-tab`));
        const allContents = Array.from(container.querySelectorAll(`.tab-content`));

        // Deactivate all tabs in this container
        allTabs.forEach((tab) => tab.removeAttribute("active"));

        // Hide all tab contents in this container
        allContents.forEach((content) => {
            content.style.display = "none";
        });

        // Activate clicked tab
        this.setAttribute("active", "");

        // Show the matching content inside the same container
        const target = container.querySelector(`.tab-content[data-tab="${groupName}"]`);
        if (target) {
            target.style.display = "block";
        }
    }

    render() {
        this.className = "tab" + (this.hasAttribute("active") ? " active" : "");
    }
}

customElements.define("custom-tab", CustomTab);
