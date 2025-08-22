import page from "https://unpkg.com/page/page.mjs";

const mount = document.querySelector("main");

function mountComponent(tagName, title = null, query = {}, route = null) {
    mount.innerHTML = "";
    const pageComponent = document.createElement(tagName);

    for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null) {
            pageComponent.setAttribute(k, typeof v === "string" ? v : JSON.stringify(v));
        }
    }

    mount.appendChild(pageComponent);

    // Single consolidated event with all route information
    document.dispatchEvent(
        new CustomEvent("route-changed", {
            detail: {
                route: route,
                title: title || "",
                component: tagName,
                query: query,
            },
            bubbles: true,
            composed: true,
        })
    );
}

export function startRouter() {
    page.base("/ATM_monitor");

    // ——— Auth helpers and global guard ———
    function isAuthenticated() {
        try {
            return Boolean(sessionStorage.getItem('auth_token'));
        } catch (e) {
            return false;
        }
    }

    const PUBLIC = new Set(["/signin"]);

    // Global guard: runs before specific routes
    page("*", (ctx, next) => {
        const pathname = (typeof ctx.path === "string")
            ? ctx.path.split("?")[0]
            : "/";

        if (PUBLIC.has(pathname)) return next();

        if (!isAuthenticated()) {
            const target = pathname + (ctx.querystring ? `?${ctx.querystring}` : "");
            return page.redirect(`/signin?next=${encodeURIComponent(target)}`);
        }

        next();
    });

    // — Default Route - redirect to home
    page("/", () => {
        page.redirect("/home");
    });

    // — Public: Sign in Route
    page("/signin", async (ctx) => {
        // If already authenticated, redirect to next or home
        if (isAuthenticated()) {
            const nextUrl = (ctx.query && ctx.query.next) ? ctx.query.next : "/home";
            return page.redirect(nextUrl);
        }

        if (!customElements.get("login-page")) {
            await import("../pages/login-page.js");
        }

        const params = {};
        if (ctx.query && ctx.query.next) params.next = ctx.query.next;
        mountComponent("login-page", "Մուտք", params, "/signin");
    });

    // — Home Route (private by guard)
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
        mountComponent(
            "cumulative-analythics",
            "Անալիտիկա | Կումուլատիվ",
            ctx.query,
            "/cumulative"
        );
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
        mountComponent("atm-list", "Բանկոմատներ", ctx.query, "/atms");
    });

    // — Single ATM detail page Route
    page("/atms/:id", async (ctx) => {
        if (!customElements.get("atm-details")) {
            await import("../pages/atm-details.js");
        }

        mountComponent(
            "atm-details",
            `ATM #${ctx.params.id}`,
            { id: ctx.params.id },
            `/atms/${ctx.params.id}`
        );
    });

    page();
}
