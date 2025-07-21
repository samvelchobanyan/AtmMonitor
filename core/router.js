import page from 'https://unpkg.com/page/page.mjs';

const mount = document.querySelector('main');

function mountComponent(tagName, title=null, query = {}) {
  mount.innerHTML = '';
  const pageComponent = document.createElement(tagName);

  for (const [k, v] of Object.entries(query)) {
    pageComponent.setAttribute(k, v);
  }

  //dispatch route-title event
  if (title) {
    el.dispatchEvent(new CustomEvent('route-title', {
      detail: { title },
      bubbles: true,
      composed: true
    }));
  }

  mount.appendChild(pageComponent);
}

export function startRouter() {
  console.log('router start')
// — Home Route
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
}