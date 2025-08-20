import page from "https://unpkg.com/page/page.mjs";

const mount = document.querySelector("main");

function mountComponent(tagName, title = null, query = {}) {
    mount.innerHTML = "";
    const pageComponent = document.createElement(tagName);

    for (const [k, v] of Object.entries(query)) {
        pageComponent.setAttribute(k, v);
    }

    mount.appendChild(pageComponent);

    //dispatch route-title event
    if (title) {
        // console.log('router mount component - dispatching',tagName, title);
        document.dispatchEvent(
            new CustomEvent("route-title", {
                detail: { title },
                bubbles: true,
                composed: true,
            })
        );
    }
}

export function startRouter() {
    page.base("/ATM_monitor");

    // — Default Route - redirect to home
    page("/", () => {
        page.redirect("/home");
    });

    // — Home Route
    page("/home", async (ctx) => {
        // console.log('router home route');
        if (!customElements.get("atms-dashboard")) {
            await import("../pages/atms-dashboard.js");
        }
        mountComponent("atms-dashboard", "Ակնարկ", ctx.query);
        
        // Dispatch route change event for sidebar highlighting
        console.log('Router: Dispatching route-changed event for /home');
        document.dispatchEvent(
            new CustomEvent("route-changed", {
                detail: { route: "/home" },
                bubbles: true,
                composed: true,
            })
        );
    });

    // — Input-output page Route
    page("/inout", async (ctx) => {
        if (!customElements.get("in-out")) {
            await import("../pages/in-out.js");
        }
        mountComponent("in-out", "Մուտք/Ելք", ctx.query);
        
        // Dispatch route change event for sidebar highlighting
        document.dispatchEvent(
            new CustomEvent("route-changed", {
                detail: { route: "/inout" },
                bubbles: true,
                composed: true,
            })
        );
    });

    // — Atm failures page Route
    page("/failures", async (ctx) => {
        if (!customElements.get("atm-failures")) {
            await import("../pages/atm-failures.js");
        }
        mountComponent("atm-failures", "Անսարքություններ", ctx.query);
        
        // Dispatch route change event for sidebar highlighting
        document.dispatchEvent(
            new CustomEvent("route-changed", {
                detail: { route: "/failures" },
                bubbles: true,
                composed: true,
            })
        );
    });

    // — Journal page Route
    page("/journal", async (ctx) => {
        if (!customElements.get("journal-page")) {
            await import("../pages/journal.js");
        }
        mountComponent("journal-page", "Մատյան", ctx.query);
        
        // Dispatch route change event for sidebar highlighting
        document.dispatchEvent(
            new CustomEvent("route-changed", {
                detail: { route: "/journal" },
                bubbles: true,
                composed: true,
            })
        );
    });

    // — Analytics Route
    page("/analytics", async (ctx) => {
        if (!customElements.get("analytics-view")) {
            await import("../pages/analytics.js");
        }
        mountComponent("analytics-view", "Վերլուծություն", ctx.query);
        
        // Dispatch route change event for sidebar highlighting
        document.dispatchEvent(
            new CustomEvent("route-changed", {
                detail: { route: "/analytics" },
                bubbles: true,
                composed: true,
            })
        );
    });

    // — Geo Analytics Route
    page("/geo", async (ctx) => {
        if (!customElements.get("geo-analythics")) {
            await import("../pages/geo-analythics.js");
        }
        mountComponent("geo-analythics", "Անալիտիկա | Աշխարհագրական", ctx.query);
        
        // Dispatch route change event for sidebar highlighting
        document.dispatchEvent(
            new CustomEvent("route-changed", {
                detail: { route: "/geo" },
                bubbles: true,
                composed: true,
            })
        );
    });

    // — Cumulative Analytics Route
    page("/cumulative", async (ctx) => {
        if (!customElements.get("cumulative-analythics")) {
            await import("../pages/cumulative.js");
        }
        mountComponent("cumulative-analythics", "Անալիտիկա | Կումուլատիվ", ctx.query);
        
        // Dispatch route change event for sidebar highlighting
        document.dispatchEvent(
            new CustomEvent("route-changed", {
                detail: { route: "/cumulative" },
                bubbles: true,
                composed: true,
            })
        );
    });

    // — Atms listing Route
    page("/atms", async (ctx) => {
        if (!customElements.get("atm-list")) {
            await import("../pages/atm-list.js");
        }
        mountComponent("atm-list", "ԲԱնկոմատներ", ctx.query);
        
        // Dispatch route change event for sidebar highlighting
        document.dispatchEvent(
            new CustomEvent("route-changed", {
                detail: { route: "/atms" },
                bubbles: true,
                composed: true,
            })
        );
    });

    page();
}
