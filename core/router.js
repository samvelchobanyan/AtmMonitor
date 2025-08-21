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

    // — Home Route
    page("/home", async (ctx) => {
        // console.log('router home route');
        if (!customElements.get("atms-dashboard")) {
            await import("../pages/atms-dashboard.js");
        }
        mountComponent("atms-dashboard", "Ակնարկ", ctx.query);
    });

    // — Input-output page Route
    page("/inout", async (ctx) => {
        if (!customElements.get("in-out")) {
            await import("../pages/in-out.js");
        }
        mountComponent("in-out", "Մուտք/Ելք", ctx.query);
    });

    // — Atm failures page Route
    page("/failures", async (ctx) => {
        if (!customElements.get("atm-failures")) {
            await import("../pages/atm-failures.js");
        }
        mountComponent("atm-failures", "Անսարքություններ", ctx.query);
    });

    // — Journal page Route
    page("/journal", async (ctx) => {
        if (!customElements.get("journal-page")) {
            await import("../pages/journal.js");
        }
        mountComponent("journal-page", "Մատյան", ctx.query);
    });

    // — Analytics Route
    page("/analytics", async (ctx) => {
        if (!customElements.get("analytics-view")) {
            await import("../pages/analytics.js");
        }
        mountComponent("analytics-view", "Վերլուծություն", ctx.query);
    });

    // — Geo Analytics Route
    page("/geo", async (ctx) => {
        if (!customElements.get("geo-analythics")) {
            await import("../pages/geo-analythics.js");
        }
        mountComponent("geo-analythics", "Անալիտիկա | Աշխարհագրական", ctx.query);
    });

    // — Cumulative Analytics Route
    page("/cumulative", async (ctx) => {
        if (!customElements.get("cumulative-analythics")) {
            await import("../pages/cumulative.js");
        }
        mountComponent("cumulative-analythics", "Անալիտիկա | Կումուլատիվ", ctx.query);
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
        mountComponent("atm-list", "ԲԱնկոմատներ", ctx.query);
    });

    page();
}
