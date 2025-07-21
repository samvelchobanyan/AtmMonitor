import page from './assets/js/libs/page.mjs';

function renderRoute(component, title, query) {
    const main = document.querySelector('main');
    if (!main) return;
    main.innerHTML = '';
    const el = document.createElement(component);
    el.routeQuery = query;
    main.appendChild(el);

    const header = document.querySelector('header-custom');
    if (header) {
        header.setAttribute('page-title', title);
    }
}

page('/', ctx => {
    renderRoute('atms-dashboard', 'Ակնարկ', ctx.query);
});

page('/geo', ctx => {
    renderRoute('atm-analitic-geo', 'աշխարհագրական', ctx.query);
});

export function navigate(path) {
    page.show(path);
}

page.start();

