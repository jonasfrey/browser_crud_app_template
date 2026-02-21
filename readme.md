# CRUD template

A minimal boilerplate for a browser-based CRUD application.
**Stack:** Deno backend · SQLite database · Vue 3 frontend · WebSocket communication

---

## Quick start

Create a new project directory, then initialize it:
```
mkdir project_name && cd project_name
deno eval "import { f_init_project } from 'jsr:@apn/websersocketgui/init'; await f_init_project();"
```

Then start the server:
```
deno task run
```

Open `http://localhost:8000` in your browser.

---

## Environment variables

| Variable     | Default                  | Description                         |
|--------------|--------------------------|-------------------------------------|
| `PORT`       | `8000`                   | HTTP server port                    |
| `DB_PATH`    | `./.gitignored/app.db`   | Path to the SQLite database file    |
| `STATIC_DIR` | `./localhost`            | Directory served as static frontend |

---

## Project structure

```
/
├── websersocket_<uuid>.js    # Deno HTTP server, WebSocket handler, static file serving
├── database_functions.js     # SQLite CRUD operations
├── default_data.js           # Default data seeding (runs on startup)
├── runtimedata.js            # Runtime paths and OS info
├── functions.js              # Backend utility functions (add yours here)
├── deno.json                 # Task definitions
├── .env                      # Local config (gitignored)
├── .env.example              # Committed env template
└── localhost/                # Files served to the browser
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

1. Define it in [localhost/constructors.js](localhost/constructors.js) using `f_o_model(...)`.
2. Add it to the `a_o_model` array — the database table is created automatically on startup.
3. Add its data key to `o_state` in [localhost/index.js](localhost/index.js) so the frontend receives and stores it.

---

## Naming conventions

All code follows strict naming conventions documented in [CLAUDE.md](CLAUDE.md).
Key rules: type prefix on every variable (`n_`, `s_`, `b_`, `o_`, `a_`, `f_`), no plural words, double-underscore for grouping variants.
