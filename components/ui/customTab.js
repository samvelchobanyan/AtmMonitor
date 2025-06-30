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

        const allTabs = document.querySelectorAll(`custom-tab[name="${groupName}"]`);
        allTabs.forEach((tab) => tab.removeAttribute("active"));

        this.setAttribute("active", "");
    }

    render() {
        this.className = "tab" + (this.hasAttribute("active") ? " active" : "");
        this.innerHTML = this.textContent.trim();
    }
}

customElements.define("custom-tab", CustomTab);

// implementation example

/* <div class="tabs">
  <custom-tab name="location" active>Մարզ</custom-tab>
  <custom-tab name="location">Քաղաք</custom-tab>
</div>

<div class="tabs">
  <custom-tab name="language" active>English</custom-tab>
  <custom-tab name="language">Հայերեն</custom-tab>
</div> */
