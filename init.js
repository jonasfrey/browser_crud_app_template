// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

// This script initializes a new empty boilerplate project.
// Usage from JSR:
//   import { f_init_project } from '@apn/websersocketgui/init';
//   await f_init_project('./my_new_app');
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

// ─── file transformations ───────────────────────────────────────────────────────

let f_s_transform__constructors = function(s) {
    // replace author placeholder
    s = s.replace('[Jonas Immanuel Frey]', '[Your Name]');

    // remove app-specific model definitions (student, course, course_student)
    s = s.replace(/let o_model__o_course_o_student = f_o_model\(\{[\s\S]*?\}\)\n/g, '');
    s = s.replace(/let o_model__o_course = f_o_model\(\{[\s\S]*?\}\)\n\n?/g, '');
    s = s.replace(/let o_model__o_student = f_o_model\(\{[\s\S]*?\}\)\n\n?/g, '');

    // insert example model before a_o_model
    let s_example_model =
        '// ─── app-specific models (add your own here) ───────────────────────────────────\n\n' +
        'let o_model__o_item = f_o_model({\n' +
        "    s_name: 'o_item',\n" +
        '    a_o_property: [\n' +
        '        f_o_model_prop__default_id(s_name_prop_id),\n' +
        "        f_o_property('s_name', 'string', (s)=>{return s!==''}),\n" +
        "        f_o_property('s_description', 'string'),\n" +
        '        f_o_model_prop__timestamp_default(s_name_prop_ts_created),\n' +
        '        f_o_model_prop__timestamp_default(s_name_prop_ts_updated),\n' +
        '    ]\n' +
        '});\n\n';

    s = s.replace(
        '\nlet a_o_model = [',
        '\n' + s_example_model + 'let a_o_model = ['
    );

    // replace a_o_model array content
    s = s.replace(
        'let a_o_model = [\n' +
        '    o_model__o_student,\n' +
        '    o_model__o_course,\n' +
        '    o_model__o_course_o_student,\n' +
        '    o_model__o_wsclient,\n' +
        '    o_model__o_fsnode,\n' +
        '    o_model__o_keyvalpair\n' +
        '];',
        'let a_o_model = [\n' +
        '    o_model__o_item,\n' +
        '    o_model__o_wsclient,\n' +
        '    o_model__o_fsnode,\n' +
        '    o_model__o_keyvalpair\n' +
        '];'
    );

    // replace exports: remove student/course/course_student, add o_item
    s = s.replace(
        '    o_model__o_student,\n' +
        '    o_model__o_course,\n' +
        '    o_model__o_course_o_student,\n',
        '    o_model__o_item,\n'
    );

    return s;
};

let f_s_transform__default_data = function(s) {
    s = s.replace('[Jonas Immanuel Frey]', '[Your Name]');

    // remove unused o_model__o_keyvalpair import
    s = s.replace('    o_model__o_keyvalpair,\n', '');

    // replace entire a_o_data_default array and comment block after it
    let s_old_data =
        'let a_o_data_default = [\n' +
        '    {\n' +
        '        o_student: {\n' +
        "            name: 'Alice',\n" +
        "            o_course: {name: 'Math 101'}\n" +
        '        },\n' +
        '    },\n' +
        '    {\n' +
        '        o_student: {\n' +
        "            name: 'Bob',\n" +
        "            o_course: {name: 'Math 101'}\n" +
        '        }\n' +
        '    }, \n' +
        '    {\n' +
        '        o_keyvalpair: {\n' +
        "            s_key: 's_path_absolute__filebrowser',\n" +
        "            s_value: '/home'\n" +
        '        }\n' +
        '    }\n' +
        ']\n' +
        '// expected result in db:\n' +
        "// o_student1 = {n_id: 1, name: 'Alice'}\n" +
        "// o_student2 = {n_id: 2, name: 'Bob'}\n" +
        "// o_course1 = {n_id: 1, name: 'Math 101'}\n" +
        '// o_course_o_student1 = {n_id: 1, n_o_student_n_id: 1, n_o_course_n_id: 1}\n' +
        '// o_course_o_student2 = {n_id: 2, n_o_student_n_id: 2, n_o_course_n_id: 1}';

    let s_new_data =
        'let a_o_data_default = [\n' +
        '    {\n' +
        '        o_keyvalpair: {\n' +
        "            s_key: 's_path_absolute__filebrowser',\n" +
        "            s_value: '/home'\n" +
        '        }\n' +
        '    },\n' +
        '    {\n' +
        '        o_item: {\n' +
        "            s_name: 'Example Item',\n" +
        "            s_description: 'This is an example item'\n" +
        '        }\n' +
        '    }\n' +
        ']';

    s = s.replace(s_old_data, s_new_data);

    return s;
};

let f_s_transform__websersocket = function(s) {
    s = s.replace('[Jonas Immanuel Frey]', '[Your Name]');

    // remove unused o_model__o_course import
    s = s.replace('    o_model__o_course,\n', '');

    // remove debug console.log(o_request)
    s = s.replace('        console.log(o_request)\n', '');

    // replace annoying toast interval with a simple welcome toast
    let n_idx__interval_start = s.indexOf('            // annoyning interval');
    let n_idx__interval_end = s.indexOf('             }, 5000);');
    if (n_idx__interval_start !== -1 && n_idx__interval_end !== -1) {
        n_idx__interval_end += '             }, 5000);'.length;
        // also consume the newline after
        if (s[n_idx__interval_end] === '\n') n_idx__interval_end++;
        s = s.slice(0, n_idx__interval_start) + s.slice(n_idx__interval_end);
    }

    return s;
};

let f_s_transform__index_js = function(s) {
    s = s.replace('[Jonas Immanuel Frey]', '[Your Name]');

    // replace app-specific state arrays with example model
    s = s.replace(
        '    a_o_course: [],\n' +
        '    a_o_student: [],\n' +
        '    o_course_o_student: [],\n',
        '    a_o_item: [],\n'
    );

    return s;
};

// ─── file generators ────────────────────────────────────────────────────────────

let f_s_generate__deno_json = function() {
    return JSON.stringify({
        "imports": {
            "@apn/websersocketgui": "jsr:@apn/websersocketgui@^0.1.0"
        },
        "tasks": {
            "run": "B_DENO_TASK=1 deno run --allow-net --allow-read --allow-write --allow-env --allow-ffi --env websersocket.js",
            "test": "deno test --allow-net --allow-read --allow-write --allow-env --allow-ffi function_testings.js"
        }
    }, null, 4) + '\n';
};

let f_s_generate__env_example = function() {
    return 'PORT=8000\n' +
        'DB_PATH=./.gitignored/app.db\n' +
        'STATIC_DIR=./localhost\n';
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

    // create directory structure
    await Deno.mkdir(`${s_path__target}/localhost/lib`, { recursive: true });
    await Deno.mkdir(`${s_path__target}/.gitignored`, { recursive: true });

    // ── 1. read, transform, and write key files ──

    // constructors.js
    let s_constructors = await f_s_read_package_file('localhost/constructors.js');
    s_constructors = f_s_transform__constructors(s_constructors);
    await f_write(`${s_path__target}/localhost/constructors.js`, s_constructors);
    console.log('  created: localhost/constructors.js');

    // default_data.js
    let s_default_data = await f_s_read_package_file('default_data.js');
    s_default_data = f_s_transform__default_data(s_default_data);
    await f_write(`${s_path__target}/default_data.js`, s_default_data);
    console.log('  created: default_data.js');

    // websersocket.js — find the file (may have UUID in name)
    let s_deno_json__package = await f_s_read_package_file('deno.json');
    let o_deno_json__package = JSON.parse(s_deno_json__package);
    let a_s_match = o_deno_json__package.tasks?.run?.match(/websersocket[_0-9a-f-]*\.js/);
    let s_filename__ws = a_s_match ? a_s_match[0] : 'websersocket.js';
    let s_websersocket = await f_s_read_package_file(s_filename__ws);
    s_websersocket = f_s_transform__websersocket(s_websersocket);
    await f_write(`${s_path__target}/websersocket.js`, s_websersocket);
    console.log('  created: websersocket.js');

    // index.js (client main)
    let s_index_js = await f_s_read_package_file('localhost/index.js');
    s_index_js = f_s_transform__index_js(s_index_js);
    await f_write(`${s_path__target}/localhost/index.js`, s_index_js);
    console.log('  created: localhost/index.js');

    // ── 2. copy infrastructure files as-is ──

    let a_s_path__copy = [
        'localhost/index.html',
        'localhost/index.css',
        'localhost/bgshader.js',
        'localhost/functions.js',
        'localhost/o_component__data.js',
        'localhost/o_component__filebrowser.js',
        'runtimedata.js',
        'database_functions.js',
        'functions.js',
        'uninit.js',
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

    // ── 3. generate config files ──

    await f_write(`${s_path__target}/deno.json`, f_s_generate__deno_json());
    console.log('  created: deno.json');

    await f_write(`${s_path__target}/.env.example`, f_s_generate__env_example());
    console.log('  created: .env.example');

    // copy .env.example as .env for first run
    await Deno.copyFile(
        `${s_path__target}/.env.example`,
        `${s_path__target}/.env`
    );
    console.log('  created: .env (from .env.example)');

    await f_write(`${s_path__target}/.gitignore`, f_s_generate__gitignore());
    console.log('  created: .gitignore');

    // ── 4. Vue libraries ──

    // try to copy from package first, fall back to CDN download
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
        // try package first
        try {
            s_content = await f_s_read_package_file(o_lib.s_path);
        } catch {
            // fall back to CDN
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

    // vue devtools stub (tiny)
    await f_write(
        `${s_path__target}/localhost/lib/vue-devtools-api-stub.js`,
        'export let setupDevtoolsPlugin = function() {};\n'
    );
    console.log('  created: localhost/lib/vue-devtools-api-stub.js');

    // ── done ──

    console.log('');
    console.log('project initialized successfully!');
    console.log('');
    console.log('next steps:');
    console.log(`  cd ${s_path__target}`);
    console.log('  deno task run    # first run generates UUID and renames websersocket.js');
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
    // resolve relative path to absolute
    if (!s_path.startsWith('/')) {
        s_path = `${Deno.cwd()}/${s_path}`;
    }
    await f_init_project(s_path);
}

export { f_init_project };
