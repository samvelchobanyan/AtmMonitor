# WebComponents Framework (No Node.js)
# Microframework Overview

This project is a small microframework for building front‑end applications without requiring a backend runtime such as Node.js. 
It focuses on simplicity, minimal dependencies and clear structure.

## Features

- **No backend runtime required** – open `index.html` in a browser or serve the files with any static web server.
- **Client side routing** powered by [page.js](https://visionmedia.github.io/page.js/).
- **Simple store management** – a lightweight global store is provided in `core/store`.
- **Web Components without shadow DOM** – components are implemented as standard custom elements so that global styles can apply across the application.
- **Minimal dependencies** – the core library relies only on the browser APIs and a few small helper scripts.

### Third-Party Library Guidelines

- Shared UI libraries (e.g. Chart.js) → import in `index.js`
- Page-specific tools (e.g. page.js) → import in the file that needs it
- Component-specific libraries (e.g. Simple-DataTables) → lazy load inside the component

## Getting started

1. Clone the repository.
2. Serve the `AtmMonitor` directory as static files
3. Open the site in your browser.

That is all you need to start experimenting with the framework.

