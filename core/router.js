import page from "https://unpkg.com/page/page.mjs";

const mount = document.querySelector("main");

function mountComponent(tagName, title = null, query = {}, route = null) {
    mount.innerHTML = "";
    const pageComponent = document.createElement(tagName);

    for (const [k, v] of Object.entries(query)) {
        pageComponent.setAttribute(k, v);
    }

    mount.appendChild(pageComponent);

    // Single consolidated event with all route information
    document.dispatchEvent(
        new CustomEvent("route-changed", {
            detail: { 
                route: route,
                title: title || "",
                component: tagName,
                query: query
            },
            bubbles: true,
            composed: true,
        })
    );
}

export function startRouter() {
    page.base("/ATM_monitor");

    // — Default Route - redirect to home
    page("/", () => {
        page.redirect("/home");
    });

    // — Home Route
    page("/home", async (ctx) => {
        if (!customElements.get("atms-dashboard")) {
            await import("../pages/atms-dashboard.js");
        }
        mountComponent("atms-dashboard", "Ակնարկ", ctx.query, "/home");
    });

    // — Input-output page Route
    page("/inout", async (ctx) => {
        if (!customElements.get("in-out")) {
            await import("../pages/in-out.js");
        }
        mountComponent("in-out", "Մուտք/Ելք", ctx.query, "/inout");
    });

    // — Atm failures page Route
    page("/failures", async (ctx) => {
        if (!customElements.get("atm-failures")) {
            await import("../pages/atm-failures.js");
        }
        mountComponent("atm-failures", "Անսարքություններ", ctx.query, "/failures");
    });

    // — Journal page Route
    page("/journal", async (ctx) => {
        if (!customElements.get("journal-page")) {
            await import("../pages/journal.js");
        }
        mountComponent("journal-page", "Մատյան", ctx.query, "/journal");
    });

    // — Analytics Route
    page("/analytics", async (ctx) => {
        if (!customElements.get("analytics-view")) {
            await import("../pages/analytics.js");
        }
        mountComponent("analytics-view", "Վերլուծություն", ctx.query, "/analytics");
    });

    // — Geo Analytics Route
    page("/geo", async (ctx) => {
        if (!customElements.get("geo-analythics")) {
            await import("../pages/geo-analythics.js");
        }
        mountComponent("geo-analythics", "Անալիտիկա | Աշխարհագրական", ctx.query, "/geo");
    });

    // — Cumulative Analytics Route
    page("/cumulative", async (ctx) => {
        if (!customElements.get("cumulative-analythics")) {
            await import("../pages/cumulative.js");
        }
        mountComponent("cumulative-analythics", "Անալիտիկա | Կումուլատիվ", ctx.query, "/cumulative");
    });

    // — Incashment listing Route
    page("/incassate", async (ctx) => {
        if (!customElements.get("incassate-analythics")) {
            await import("../pages/incassate.js");
        }
        mountComponent("incassate-analythics", "Անալիտիկա | Ինկասացիա", ctx.query);
    });

    // — Atms listing Route
    page("/atms", async (ctx) => {
        if (!customElements.get("atm-list")) {
            await import("../pages/atm-list.js");
        }
        mountComponent("atm-list", "ԲԱնկոմատներ", ctx.query, "/atms");
    });

    page();
}
