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

    // ── 2. copy project files as-is ──

    let a_s_path__copy = [
        'localhost/index.html',
        'localhost/index.js',
        'localhost/index.css',
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

    // ── 3. Vue libraries ──

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

    // ── 4. generate config files ──

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
