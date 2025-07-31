export class CustomCheckbox extends HTMLElement {
    static get observedAttributes() {
        return ["checked", "id", "value"];
    }

    constructor() {
        super();
        this.addEventListener("click", this.handleClick.bind(this));
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        this.render();
    }

    handleClick(event) {
        // Prevent double toggle when clicking on the input itself
        if (event.target.tagName === "INPUT") return;

        const isChecked = this.hasAttribute("checked");
        if (isChecked) {
            this.removeAttribute("checked");
        } else {
            this.setAttribute("checked", "");
        }

        // Update input checked property
        const input = this.querySelector("input[type=checkbox]");
        if (input) {
            input.checked = !isChecked;
        }

        const changeEvent = new Event("change", { bubbles: true });
        this.dispatchEvent(changeEvent);
    }

    render() {
        this.className = "custom-check";

        const id = this.getAttribute("id") || `custom-checkbox-${Math.random().toString(36).substr(2, 9)}`;
        const value = this.getAttribute("value") || "";
        const checked = this.hasAttribute("checked");

        // Save label text before clearing innerHTML
        const labelText = this.textContent.trim();

        this.innerHTML = `
      <label for="${id}">
        <input type="checkbox" id="${id}" value="${value}" ${checked ? "checked" : ""} />
        <div class="custom-check__checkmark"></div>
        <div class="custom-check__label">${labelText}</div>
      </label>
    `;
    }
}

customElements.define("custom-checkbox", CustomCheckbox);


/* <div class="checkboxes">
    <custom-checkbox id="yerevan" value="yerevan" checked>Երևան</custom-checkbox> 
    <custom-checkbox id="armavir" value="armavir">Արմավիր</custom-checkbox> 
    <custom-checkbox id="lori" value="lori">Լոռի</custom-checkbox> 
    <custom-checkbox id="tavush" value="tavush">Տավուշ</custom-checkbox> 
    <custom-checkbox id="aragatsotn" value="aragatsotn">Արագածոտն</custom-checkbox> 
    <custom-checkbox id="gegharkunik" value="gegharkunik">Գեղարքունիք</custom-checkbox> 
    <custom-checkbox id="shirak" value="shirak">Շիրակ</custom-checkbox> 
    <custom-checkbox id="vayots-dzor" value="vayots-dzor">Վայոց ձոր</custom-checkbox> 
    <custom-checkbox id="ararat" value="ararat">Արարատ</custom-checkbox> 
    <custom-checkbox id="kotayk" value="kotayk">Կոտայք</custom-checkbox> 
    <custom-checkbox id="syunik" value="syunik">Սյունիք</custom-checkbox> 
</div>   */