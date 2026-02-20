# CRUD template

A minimal boilerplate for a browser-based CRUD application.
**Stack:** Deno backend · SQLite database · Vue 3 frontend · WebSocket communication

---

## Setup

1. Copy the env template and adjust values if needed:
   ```
   cp .env.example .env
   ```

2. Start the server:
   ```
   deno task start
   ```

3. Open `http://localhost:8000` in your browser.

---

## Environment variables

| Variable     | Default                  | Description                         |
|--------------|--------------------------|-------------------------------------|
| `PORT`       | `8000`                   | HTTP server port                    |
| `DB_PATH`    | `./.gitignored/app.db`   | Path to the SQLite database file    |
| `STATIC_DIR` | `./webserved_dir`        | Directory served as static frontend |

---

## Project structure

```
/
├── webserver.js              # Deno HTTP server, WebSocket handler, static file serving
├── database_functions.js     # SQLite CRUD operations
├── default_data.js           # Default data seeding (runs on startup)
├── runtimedata.js            # Runtime paths and OS info
├── functions.js              # Backend utility functions (add yours here)
├── command_api.js            # HTTP API command stubs (add yours here)
├── function_testings.js      # Deno tests — run with: deno task test
├── deno.json                 # Task definitions
├── .env                      # Local config (gitignored — copy from .env.example)
├── .env.example              # Committed env template
└── webserved_dir/            # Files served to the browser
    ├── index.html            # HTML entry point
    ├── index.js              # Vue 3 app, routing, WebSocket client
    ├── index.css             # Styling
    ├── constructors.js       # Model definitions, wsmsg list, factory functions
    ├── o_component__data.js  # CRUD data management component (full Create/Read/Update/Delete)
    ├── functions.js          # Frontend utility functions (add yours here)
    └── lib/
        ├── vue.esm-browser.js
        └── vue-router.esm-browser.js
```

---

## Adding a new model

1. Define it in [webserved_dir/constructors.js](webserved_dir/constructors.js) using `f_o_model(...)`.
2. Add it to the `a_o_model` array — the database table is created automatically on startup.
3. Add its data key to `o_state` in [webserved_dir/index.js](webserved_dir/index.js) so the frontend receives and stores it.

---

## Naming conventions

All code follows strict naming conventions documented in [CLAUDE.md](CLAUDE.md).
Key rules: type prefix on every variable (`n_`, `s_`, `b_`, `o_`, `a_`, `f_`), no plural words, double-underscore for grouping variants.
