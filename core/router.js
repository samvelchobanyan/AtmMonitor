import page from 'https://unpkg.com/page/page.mjs';

const mount = document.querySelector('main');

function mountComponent(tagName, title, query = {}) {
  mount.innerHTML = '';
  const el = document.createElement(tagName);
  for (const [k, v] of Object.entries(query)) {
    el.setAttribute(k, v);
  }
  mount.appendChild(el);

  const header = document.querySelector('header-custom');
  if (header && title) {
    header.setAttribute('page-title', title);
  }
}

// — Dashboard Route
page('/', async ctx => {
  console.log('router home route');
  if (!customElements.get('atms-dashboard')) {
    await import('../pages/atms-dashboard.js');
  }
  mountComponent('atms-dashboard', 'Ակնարկ', ctx.query);
});

// — Geo Analytics Route
page('/geo', async ctx => {
  if (!customElements.get('atms-dashboard')) {
    await import('../pages/atms-dashboard.js');
  }

  // set default
  // if (!ctx.query.region) {
  //   ctx.query.region = 'Երևան'; // default fallback
  // }

  mountComponent('atm-analitic-geo', 'աշխարհագրական', ctx.query);
});

// — Analytics Route
page('/analytics', async ctx => {
  if (!customElements.get('analytics-view')) {
    await import('../pages/analytics.js');
  }

  // In the future: trigger some analytics tracking here
  mountComponent('analytics-view', 'Վերլուծություն', ctx.query);
});

page();