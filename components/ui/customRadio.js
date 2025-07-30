export class CustomRadio extends HTMLElement {
  static get observedAttributes() {
    return ["checked", "name", "value"]; //take value to make new call
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

  handleClick() {
    const groupName = this.getAttribute("name");
    if (!groupName) return;

    const allRadios = document.querySelectorAll(`custom-radio[name="${groupName}"]`);
    allRadios.forEach((radio) => radio.removeAttribute("checked"));

    this.setAttribute("checked", "");
    this.querySelector("input[type=radio]").checked = true;

    const event = new Event("change", { bubbles: true });

    this.dispatchEvent(event);
  }

  render() {
    this.className = "radio-button";

    const name = this.getAttribute("name") || "";
    const value = this.getAttribute("value") || "";
    const checked = this.hasAttribute("checked");

    this.innerHTML = `
            <label class="radio-container">
                <input type="radio" name="${name}" value="${value}" ${checked ? "checked" : ""} />
                <span>${this.textContent.trim()}</span>
            </label>
        `;
  }
}

customElements.define("custom-radio", CustomRadio);
