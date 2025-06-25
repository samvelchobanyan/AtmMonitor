export class StaticElement extends HTMLElement {
    connectedCallback() {
      if (this._rendered) return;
      this._rendered = true;
      this.innerHTML = this.render();
    }
    // subclasses override this
    render() { return ''; }
  }
  