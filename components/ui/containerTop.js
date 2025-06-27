export class ContainerTop extends HTMLElement {
    static get observedAttributes() {
        return ["icon", "title", "link-text", "link-href"];
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
        const icon = this.getAttribute("icon") || "";
        const title = this.getAttribute("title") || "";
        const linkText = this.getAttribute("link-text");
        const linkHref = this.getAttribute("link-href") || "#";

        this.className = "container__top";

        this.innerHTML = `
            <div class="container__title">
                <div class="title-icon"><i class="icon ${icon}"></i></div>
                <h2 class="h2-font">${title}</h2>
            </div>
            ${
                linkText
                    ? `<a href="${linkHref}" class="btn btn_link color-blue">
                <span>${linkText}</span><i class="icon icon-chevron-right"></i>
            </a>`
                    : ""
            }
        `;
    }
}

customElements.define("container-top", ContainerTop);
