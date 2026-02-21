// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

// This script initializes a new project by copying the boilerplate as-is.
// Usage from JSR:
//   deno eval "import { f_init_project } from 'jsr:@apn/websersocketgui@0.1.1/init'; await f_init_project('project_name');"
// Usage direct:
//   deno run -A init.js <target_directory>

let s_url__package = new URL('.', import.meta.url);

let f_s_read_package_file = async function(s_relative_path) {
    let o_url = new URL(s_relative_path, s_url__package);
    let o_response = await fetch(o_url);
    if (!o_response.ok) {
        throw new Error(`failed to read: ${s_relative_path} (${o_response.status})`);
    }
    return await o_response.text();
};

let f_write = async function(s_path, s_content) {
    let n_idx = Math.max(s_path.lastIndexOf('/'), s_path.lastIndexOf('\\'));
    if (n_idx > 0) {
        await Deno.mkdir(s_path.slice(0, n_idx), { recursive: true });
    }
    await Deno.writeTextFile(s_path, s_content);
};

let f_s_download = async function(s_url) {
    console.log(`  downloading: ${s_url}`);
    let o_response = await fetch(s_url);
    if (!o_response.ok) {
        throw new Error(`download failed: ${s_url} (${o_response.status})`);
    }
    return await o_response.text();
};

// ─── file generators ────────────────────────────────────────────────────────────

let f_s_generate__deno_json = function(s_uuid) {
    return JSON.stringify({
        "imports": {
            "@apn/websersocketgui": "jsr:@apn/websersocketgui@^0.1.0"
        },
        "tasks": {
            "run": `B_DENO_TASK=1 deno run --allow-net --allow-read --allow-write --allow-env --allow-ffi --env websersocket_${s_uuid}.js`,
            "test": "deno test --allow-net --allow-read --allow-write --allow-env --allow-ffi function_testings.js"
        }
    }, null, 4) + '\n';
};

let f_s_generate__env_example = function(s_uuid) {
    return 'PORT=8000\n' +
        'DB_PATH=./.gitignored/app.db\n' +
        'STATIC_DIR=./localhost\n' +
        `S_UUID=${s_uuid}\n`;
};

let f_s_generate__gitignore = function() {
    return '.env\n' +
        '.gitignored/\n' +
        'AI_responses_summaries.md\n' +
        'planning/\n';
};

// JSR only serves .js/.ts files — HTML and CSS must be generated inline

let f_s_generate__index_html = function() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>App</title>
    <link rel="stylesheet" href="index.css">
    <script type="importmap">
    {
        "imports": {
            "vue": "./lib/vue.esm-browser.js",
            "vue-router": "./lib/vue-router.esm-browser.js",
            "@vue/devtools-api": "./lib/vue-devtools-api-stub.js"
        }
    }
    </script>
</head>
<body>
    <div id="app"></div>
    <script type="module" src="index.js"></script>
</body>
</html>
`;
};

let f_s_generate__index_css = function() {
    return `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

#background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #e2e8f0;
    background: transparent;
}

#app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

/* Navigation Styles */
.nav {
    background: rgba(10, 10, 18, 0.6);
    backdrop-filter: blur(12px);
    padding: 1rem 2rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
    display: flex;
    gap: 0.5rem;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.nav a {
    color: #cbd5e0;
    text-decoration: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    text-transform: capitalize;
}

.nav a:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    transform: translateY(-2px);
}

.nav a.router-link-active {
    background: rgba(139, 116, 234, 0.3);
    color: #c4b5fd;
    border-color: rgba(139, 116, 234, 0.4);
}

/* Main content area */
main, .content {
    flex: 1;
    padding: 2rem;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
}

/* Data table styles */
.a_o_model_data_table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    background: rgba(10, 10, 18, 0.55);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.07);
    margin-top: 1.5rem;
}

.a_o_model_data_table th,
.a_o_model_data_table td {
    padding: 0.9rem 1rem;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    font-size: 0.95rem;
}

.a_o_model_data_table th {
    background: rgba(255, 255, 255, 0.04);
    color: #a0aec0;
    font-weight: 600;
    text-transform: capitalize;
    letter-spacing: 0.02em;
    position: sticky;
    top: 0;
    z-index: 1;
}

.a_o_model_data_table tr.o_instance:nth-child(even) {
    background: rgba(255, 255, 255, 0.02);
}

.a_o_model_data_table tr.o_instance:hover {
    background: rgba(139, 116, 234, 0.1);
}

.a_o_model_data_table td {
    color: #cbd5e0;
}

.a_o_model_data_table tr:last-child td {
    border-bottom: none;
}

/* Model selection styles */
.a_o_model {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin: 1.5rem 0 1rem;
}

.a_o_model .o_model {
    padding: 0.6rem 1.1rem;
    border-radius: 999px;
    background: rgba(10, 10, 18, 0.55);
    backdrop-filter: blur(8px);
    color: #a0aec0;
    border: 1px solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
    user-select: none;
    text-transform: capitalize;
}

.a_o_model .o_model:hover {
    transform: translateY(-1px);
    color: #e2e8f0;
    border-color: rgba(255, 255, 255, 0.2);
}

.a_o_model .o_model.active {
    background: rgba(139, 116, 234, 0.25);
    color: #c4b5fd;
    border-color: rgba(139, 116, 234, 0.5);
}

/* Create form styles */
.o_form__create {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
    padding: 1rem 1.25rem;
    background: rgba(10, 10, 18, 0.55);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.07);
    flex-wrap: wrap;
}

.o_form__create .s_label__create {
    font-weight: 600;
    color: #a0aec0;
    white-space: nowrap;
    text-transform: capitalize;
}

.o_form__create .a_o_input {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    flex: 1;
}

.o_form__create .o_input_group {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    flex: 1;
    min-width: 120px;
}

.o_form__create .o_input_group span {
    font-size: 0.75rem;
    color: #718096;
    font-weight: 500;
}

.o_form__create .o_input_group input {
    padding: 0.5rem 0.75rem;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    color: #e2e8f0;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s;
}

.o_form__create .o_input_group input::placeholder {
    color: #4a5568;
}

.o_form__create .o_input_group input:focus {
    border-color: rgba(139, 116, 234, 0.6);
    box-shadow: 0 0 0 3px rgba(139, 116, 234, 0.15);
}

.o_form__create .btn__create {
    padding: 0.55rem 1.5rem;
    background: rgba(139, 116, 234, 0.25);
    color: #c4b5fd;
    border: 1px solid rgba(139, 116, 234, 0.4);
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
}

.o_form__create .btn__create:hover {
    transform: translateY(-1px);
    background: rgba(139, 116, 234, 0.4);
    box-shadow: 0 4px 12px rgba(139, 116, 234, 0.25);
}

/* Toast styles */
.a_o_toast {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    display: flex;
    flex-direction: column-reverse;
    gap: 0.6rem;
    z-index: 9999;
    pointer-events: none;
    max-width: 360px;
}

.a_o_toast .o_toast {
    padding: 0.8rem 1.25rem;
    background: rgba(10, 10, 18, 0.85);
    backdrop-filter: blur(12px);
    color: #e2e8f0;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 500;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.08);
    pointer-events: auto;
    animation: toast_slide_in 0.3s ease forwards;
    transition: opacity 0.4s ease, transform 0.4s ease;
}

.a_o_toast .o_toast.info {
    border-color: rgba(66, 153, 225, 0.4);
    background: rgba(43, 108, 176, 0.6);
}

.a_o_toast .o_toast.success {
    border-color: rgba(72, 187, 120, 0.4);
    background: rgba(39, 103, 73, 0.6);
}

.a_o_toast .o_toast.warning {
    border-color: rgba(237, 137, 54, 0.4);
    background: rgba(151, 90, 22, 0.6);
}

.a_o_toast .o_toast.error {
    border-color: rgba(252, 129, 129, 0.4);
    background: rgba(155, 44, 44, 0.6);
}

.a_o_toast .o_toast.expired {
    opacity: 0;
    display: none;
    transform: translateX(100%);
    pointer-events: none;
}

@keyframes toast_slide_in {
    from {
        opacity: 0;
        transform: translateX(100%);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

/* File browser */
.o_filebrowser {
    padding: 1rem 2rem;
    max-width: 800px;
}

.o_filebrowser__path_bar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    background: rgba(10, 10, 18, 0.55);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 8px;
    margin-bottom: 0.5rem;
}

.o_filebrowser__path_bar .btn__up {
    padding: 0.2rem 0.6rem;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 5px;
    color: #a0aec0;
    cursor: pointer;
    font-size: 0.8rem;
    transition: background 0.15s;
    flex-shrink: 0;
}

.o_filebrowser__path_bar .btn__up:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.12);
    color: #e2e8f0;
}

.o_filebrowser__path_bar .btn__up:disabled {
    opacity: 0.3;
    cursor: default;
}

.o_filebrowser__path {
    font-size: 0.85rem;
    color: #718096;
    word-break: break-all;
}

.o_filebrowser__list {
    background: rgba(10, 10, 18, 0.55);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 8px;
    overflow: hidden;
}

.o_fsnode {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.3rem 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    font-size: 0.85rem;
    transition: background 0.1s;
}

.o_fsnode:last-child {
    border-bottom: none;
}

.o_fsnode.folder {
    cursor: pointer;
    color: #cbd5e0;
}

.o_fsnode.folder:hover {
    background: rgba(139, 116, 234, 0.12);
    color: #e2e8f0;
}

.o_fsnode.file {
    color: #4a5568;
    cursor: default;
}

.o_fsnode__type {
    font-size: 0.72rem;
    color: #4a5568;
    min-width: 2.5rem;
    font-family: monospace;
}
`;
};

// ─── main init function ─────────────────────────────────────────────────────────

let f_init_project = async function(s_path__target) {
    console.log(`initializing project in: ${s_path__target}`);

    // generate UUID for this project instance
    let s_uuid = crypto.randomUUID();

    // create directory structure
    await Deno.mkdir(`${s_path__target}/localhost/lib`, { recursive: true });
    await Deno.mkdir(`${s_path__target}/.gitignored`, { recursive: true });

    // ── 1. copy websersocket with new UUID filename ──

    let s_deno_json__package = await f_s_read_package_file('deno.json');
    let o_deno_json__package = JSON.parse(s_deno_json__package);
    let a_s_match = o_deno_json__package.tasks?.run?.match(/websersocket[_0-9a-f-]*\.js/);
    let s_filename__ws = a_s_match ? a_s_match[0] : 'websersocket.js';
    let s_websersocket = await f_s_read_package_file(s_filename__ws);
    await f_write(`${s_path__target}/websersocket_${s_uuid}.js`, s_websersocket);
    console.log(`  created: websersocket_${s_uuid}.js`);

    // ── 2. generate files that JSR cannot serve (html, css) ──

    await f_write(`${s_path__target}/localhost/index.html`, f_s_generate__index_html());
    console.log('  created: localhost/index.html');

    await f_write(`${s_path__target}/localhost/index.css`, f_s_generate__index_css());
    console.log('  created: localhost/index.css');

    // ── 3. copy project files as-is ──

    let a_s_path__copy = [
        'localhost/index.js',
        'localhost/constructors.js',
        'localhost/functions.js',
        'localhost/bgshader.js',
        'localhost/o_component__data.js',
        'localhost/o_component__filebrowser.js',
        'default_data.js',
        'database_functions.js',
        'runtimedata.js',
        'functions.js',
        'command_api.js',
        'function_testings.js',
    ];

    for (let s_path of a_s_path__copy) {
        try {
            let s_content = await f_s_read_package_file(s_path);
            await f_write(`${s_path__target}/${s_path}`, s_content);
            console.log(`  copied:  ${s_path}`);
        } catch (o_error) {
            console.warn(`  skipped: ${s_path} (${o_error.message})`);
        }
    }

    // ── 4. Vue libraries ──

    let a_o_lib = [
        {
            s_path: 'localhost/lib/vue.esm-browser.js',
            s_url__cdn: 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
        },
        {
            s_path: 'localhost/lib/vue-router.esm-browser.js',
            s_url__cdn: 'https://unpkg.com/vue-router@4/dist/vue-router.esm-browser.js'
        },
    ];

    for (let o_lib of a_o_lib) {
        let s_content = null;
        try {
            s_content = await f_s_read_package_file(o_lib.s_path);
        } catch {
            try {
                s_content = await f_s_download(o_lib.s_url__cdn);
            } catch (o_error) {
                console.error(`  ERROR: could not get ${o_lib.s_path}: ${o_error.message}`);
                console.error(`  please download manually from ${o_lib.s_url__cdn}`);
                continue;
            }
        }
        await f_write(`${s_path__target}/${o_lib.s_path}`, s_content);
        console.log(`  created: ${o_lib.s_path}`);
    }

    await f_write(
        `${s_path__target}/localhost/lib/vue-devtools-api-stub.js`,
        'export let setupDevtoolsPlugin = function() {};\n'
    );
    console.log('  created: localhost/lib/vue-devtools-api-stub.js');

    // ── 5. generate config files ──

    await f_write(`${s_path__target}/deno.json`, f_s_generate__deno_json(s_uuid));
    console.log('  created: deno.json');

    await f_write(`${s_path__target}/.env.example`, f_s_generate__env_example(s_uuid));
    console.log('  created: .env.example');

    await Deno.copyFile(
        `${s_path__target}/.env.example`,
        `${s_path__target}/.env`
    );
    console.log('  created: .env (from .env.example)');

    await f_write(`${s_path__target}/.gitignore`, f_s_generate__gitignore());
    console.log('  created: .gitignore');

    // ── done ──

    console.log('');
    console.log('project initialized successfully!');
    console.log('');
    console.log('next steps:');
    console.log(`  cd ${s_path__target}`);
    console.log('  deno task run');
    console.log('');
    console.log('to customize:');
    console.log('  edit localhost/constructors.js to add your own models');
    console.log('  edit default_data.js to seed initial data');
};

// CLI entry point
if (import.meta.main) {
    let s_path = Deno.args[0];
    if (!s_path) {
        console.error('usage: deno run -A init.js <target_directory>');
        console.error('   or: deno run -A jsr:@apn/websersocketgui/init <target_directory>');
        Deno.exit(1);
    }
    if (!s_path.startsWith('/')) {
        s_path = `${Deno.cwd()}/${s_path}`;
    }
    await f_init_project(s_path);
}

export { f_init_project };
