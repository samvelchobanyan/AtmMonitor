import { DynamicElement } from "../core/dynamic-element.js";
import { api } from "../core/api-client.js";

class LoginPage extends DynamicElement {
    constructor() {
        super();
        this.state = {
            isLoading: false,
            error: "",
            username: "",
            password: "",
        };
    }

    static get observedAttributes() {
        return ["next"]; // optional redirect target after login
    }

    template() {
        return /* html */ `
            <div class="row align-center">
                <div class="column sm-6">
                    <div class="login">
                        <div class="login__logo">
                           <img src="assets/img/logo.png" alt="Logo" />
                        </div>
                        <form id="login-form" class="form">
                            <div class="form__item">
                                <label for="username">Օգտանուն</label>
                                <input id="username" class="w-100" name="username" type="text" autocomplete="username" required />
                            </div>
                            <div class="form__item">
                                <label for="password">Գաղտնաբառ</label>
                                <input id="password" class="w-100" name="password" type="password" autocomplete="current-password" required />
                            </div>
                            ${
                                this.state.error
                                    ? `<div class="error color-red" style="margin-bottom:10px;">${this.state.error}</div>`
                                    : ""
                            }
                            <div class="form__btn">
                                <button id="login-btn" type="submit" class="btn btn_md btn_blue btn_full" ${
                                    this.state.isLoading ? "disabled" : ""
                                }>
                                    <span>${
                                        this.state.isLoading ? "Մուտք է կատարվում…" : "Մուտք"
                                    }</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    onAfterRender() {
        const username = this.$("#username");
        const password = this.$("#password");
        if (username) username.value = this.state.username || "";
        if (password) password.value = this.state.password || "";
    }

    addEventListeners() {
        const form = this.$("#login-form");
        if (form) {
            this.addListener(form, "submit", this.handleSubmit);
        }
    }

    async handleSubmit(event) {
        event.preventDefault();

        const usernameInput = this.$("#username");
        const passwordInput = this.$("#password");
        const username = usernameInput?.value.trim() || "";
        const password = passwordInput?.value || "";

        if (!username || !password) {
            this.setState({ error: "Լրացրեք բոլոր դաշտերը" });
            return;
        }

        this.setState({ isLoading: true, error: "" });

        try {
            const response = await api.post(
                `/account/login?login=${username}&password=${password}`
            );

            // { success: true, data: { token, firstName, lastName } }
            if (!response?.success || !response?.data?.token) {
                throw new Error(response?.errors || "Սխալ մուտքագրում");
            }

            const token = response.data.token;
            sessionStorage.setItem("auth_token", token);

            if (response.data.firstName || response.data.lastName) {
                sessionStorage.setItem(
                    "auth_user",
                    JSON.stringify({
                        firstName: response.data.firstName || "",
                        lastName: response.data.lastName || "",
                    })
                );
            }

            const nextAttr = this.getAttribute("next") || "";
            const next = nextAttr && nextAttr.startsWith("/") ? nextAttr : "/home";
            window.location.href = `/ATM_monitor${next}`;
        } catch (err) {
            const message = err?.message || "Մուտքը ձախողվեց";
            this.setState({ error: message });
        } finally {
            this.setState({ isLoading: false });
        }
    }
}

customElements.define("login-page", LoginPage);
