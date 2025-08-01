import { DynamicElement } from "../../core/dynamic-element.js";

class ListView extends DynamicElement {
    constructor() {
        super();
        this.state = {
            items: [],
            loading: false,
            error: false,
            searchQuery: "",
            checkedValues: new Set(),
        };
        this.userTemplateHTML = null;
    }

    static get observedAttributes() {
        return ["src", "items", "searchable", "search-fields"];
    }

    async onConnected() {
        // Cache the template once
        const tpl = this.querySelector("template");
        this.userTemplateHTML = tpl?.innerHTML?.trim() || null;

        const src = this.getAttr("src");
        const inline = this.getAttr("items");

        if (src) {
            await this.fetchItems(src);
        } else if (inline) {
            try {
                const parsed = JSON.parse(inline);
                this.setState({ items: parsed });
            } catch (e) {
                this.setState({ error: true });
            }
        }
    }

    async fetchItems(url) {
        this.setState({ loading: true });
        try {
            const data = await this.fetchData(url);
            this.setState({ items: data, loading: false });
        } catch (err) {
            this.setState({ error: true, loading: false });
        }
    }

    getSearchableFields() {
        const raw = this.getAttr("search-fields");
        return raw ? raw.split(",").map((f) => f.trim()) : null;
    }

    renderTemplate(template, item) {
        return template.replace(/\{\{(.*?)\}\}/g, (_, key) => {
            const val = item[key.trim()];
            return val != null ? String(val) : "";
        });
    }

    // Used to inject filtered items into the list container
    renderItems(filteredItems) {
        const container = this.$(".list");
        const template = this.userTemplateHTML;

        if (!container || !template) return;

        if (!filteredItems.length) {
            container.innerHTML = `<div class="empty">No items found.</div>`;
            return;
        }

        container.innerHTML = filteredItems.map((item) => this.renderTemplate(template, item)).join("");

        this.addCheckboxListeners();
    }

    template() {
        const { loading, error } = this.state;
        const searchEnabled = this.hasAttribute("searchable");
        const rawTemplate = this.userTemplateHTML;

        if (loading) return `<div class="loading">Loading list…</div>`;
        if (error) return `<div class="error">Failed to load list items.</div>`;
        if (!rawTemplate) return `<div class="error">No <template> provided inside list-view.</div>`;

        return `
            ${
                searchEnabled
                    ? `
                <div class="list__search">
                    <input type="search" placeholder="Փնտրել..." />
                </div>
            `
                    : ""
            }
            <div class="list"></div>
        `;
    }

    onAfterRender() {
        this.renderItems(this.state.items);
    }

    addEventListeners() {
        const input = this.$("input[type='search']");
        const searchFields = this.getSearchableFields();

        if (input) {
            this.addListener(input, "input", (e) => {
                const q = e.target.value.trim().toLowerCase();

                const filtered = this.state.items.filter((item) => {
                    const values = searchFields ? searchFields.map((k) => item[k]).filter((v) => v != null) : Object.values(item).filter((v) => v != null);

                    return values.some((val) => String(val).toLowerCase().includes(q));
                });

                this.renderItems(filtered);
            });
        }

        this.addCheckboxListeners();
    }

    addCheckboxListeners() {
        const checkboxes = this.$$(".list custom-checkbox");

        checkboxes.forEach((checkbox) => {
            // Create new listener
            const changeListener = () => {
                const val = checkbox.getAttribute("value");
                const input = checkbox.querySelector('input[type="checkbox"]');

                if (input && input.checked) {
                    checkbox.setAttribute("checked", "");
                    this.state.checkedValues.add(val);
                } else {
                    checkbox.removeAttribute("checked");
                    this.state.checkedValues.delete(val);
                }
            };

            this.addListener(checkbox, "change", changeListener);

            // Set initial state based on checkedValues
            const val = checkbox.getAttribute("value");
            const input = checkbox.querySelector('input[type="checkbox"]');

            if (this.state.checkedValues.has(val)) {
                checkbox.setAttribute("checked", "");
                if (input) {
                    input.checked = true;
                }
            } else {
                checkbox.removeAttribute("checked");
                if (input) {
                    input.checked = false;
                }
            }
        });
    }

    // Method to programmatically set checked values
    setCheckedValues(values) {
        this.state.checkedValues.clear();
        values.forEach((value) => this.state.checkedValues.add(value));
        this.addCheckboxListeners(); // Update visual state
    }

    // Method to get current checked values
    getCheckedValues() {
        return Array.from(this.state.checkedValues);
    }
}

customElements.define("list-view", ListView);
