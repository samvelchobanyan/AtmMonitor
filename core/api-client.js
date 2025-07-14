// api-client.js
export class ApiClient {
  constructor({ baseUrl, useProxy = false, delay = null }) {
    this.baseUrl = baseUrl;
    this.useProxy = useProxy;
    this.delay = delay;
  }

  buildUrl(endpoint, params = {}) {
    const base = this.baseUrl + (endpoint.startsWith('/') ? endpoint : `/${endpoint}`);
    const qs = new URLSearchParams(params).toString();
    const full = qs ? `${base}?${qs}` : base;
    const delay = this.delay !== null ? `delay=${this.delay}&` : '';
    return this.useProxy ? `http://localhost/ATM_monitor/proxy.php?${delay}url=${encodeURIComponent(full)}` : full;
  }

  async get(endpoint, params = {}, headers = {}) {
    const url = this.buildUrl(endpoint, params);
    const res = await fetch(url, { headers });
    return this.handle(res);
  }

  async post(endpoint, body = {}, headers = {}) {
    const url = this.buildUrl(endpoint);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body)
    });
    return this.handle(res);
  }

  async postForm(endpoint, formData, headers = {}) {
    const url = this.buildUrl(endpoint);
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
      headers // don't set Content-Type manually
    });
    return this.handle(res);
  }

  async handle(res) {
    const type = res.headers.get('Content-Type') || '';
    const isJson = type.includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const err = new Error(`API ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  }
}

// export default client for most use-cases
export const api = new ApiClient({
  baseUrl: 'https://atmmonitorapi-production.up.railway.app/api',
  // baseUrl: 'http://37.186.122.133:3393/api',
  // baseUrl: 'http://localhost/ATM_monitor',
  useProxy: true,
  delay: 1,
});
