export default function page(path, fn) {
  if (typeof path === 'function') {
    page.start(path);
  } else {
    page._routes.push({ path, fn });
  }
}

page._routes = [];

function dispatch(url) {
  const urlObj = new URL(url, location.origin);
  const path = urlObj.pathname;
  const qs = urlObj.search.slice(1);
  const query = {};
  urlObj.searchParams.forEach((v, k) => {
    query[k] = v;
  });

  const route = page._routes.find(r => r.path === path);
  if (route) {
    route.fn({ path, querystring: qs, query });
  }
}

page.show = function (url) {
  history.pushState({}, '', url);
  dispatch(url);
};

page.start = function () {
  window.addEventListener('popstate', () => dispatch(location.pathname + location.search));
  dispatch(location.pathname + location.search);
};
