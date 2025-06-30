export class TableCustom extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.innerHTML = `
            <table class="atm-table">
                <thead>
                    <tr>
                        <th>Ամսաթիվ / Ժամ</th>
                        <th>Բանկոմատ / Հասցե</th>
                        <th>Մուտքագրված գումար</th>
                        <th>Հանված գումար</th>
                        <th>Նշվել է որպես վերջացող</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>10.05.2025 / 13:45</td>
                        <td>АТМ0001 / Ալավերդյան 8, Երևան</td>
                        <td>2.560.000֏</td>
                        <td>2.560.000֏</td>
                        <td>10.05.2025</td>
                    </tr>
                    <tr>
                        <td>10.05.2025 / 13:45</td>
                        <td>АТМ0001 / Ալավերդյան 8, Ծովագյուղ, Գեղարքունիք</td>
                        <td>2.560.000֏</td>
                        <td>2.560.000֏</td>
                        <td>10.05.2025</td>
                    </tr>
                    <tr>
                        <td>10.05.2025 / 13:45</td>
                        <td>АТМ0001 / Ալավերդյան 8, Երևան</td>
                        <td>2.560.000֏</td>
                        <td>2.560.000֏</td>
                        <td>10.05.2025</td>
                    </tr>
                </tbody>
            </table>
        `;
    }
}

customElements.define("table-custom", TableCustom);
