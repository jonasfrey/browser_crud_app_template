// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPLv2. See LICENSE file for details.

// Initializes a new project by downloading all files from the GitHub repo
// and replacing the template UUID with a fresh one.
//
// Usage:
//   deno run -A serverside/init.js [target_directory]
//   deno eval "import { f_init_project } from 'jsr:@apn/websersocketgui/init'; await f_init_project();"

let s_url__github_raw = 'https://raw.githubusercontent.com/jonasfrey/browser_crud_app_template/main';
let s_url__github_api_tree = 'https://api.github.com/repos/jonasfrey/browser_crud_app_template/git/trees/main?recursive=1';

// ─── helpers ────────────────────────────────────────────────────────────────────

let f_write = async function(s_path, s_content) {
    let n_idx = Math.max(s_path.lastIndexOf('/'), s_path.lastIndexOf('\\'));
    if (n_idx > 0) {
        await Deno.mkdir(s_path.slice(0, n_idx), { recursive: true });
    }
    await Deno.writeTextFile(s_path, s_content);
};

let f_s_fetch__github = async function(s_relative_path) {
    let s_url = `${s_url__github_raw}/${s_relative_path}`;
    let o_response = await fetch(s_url);
    if (!o_response.ok) {
        throw new Error(`failed to fetch: ${s_relative_path} (${o_response.status})`);
    }
    return await o_response.text();
};

// ─── file list from GitHub API ──────────────────────────────────────────────────

let f_a_s_path__from_github = async function() {
    console.log('  fetching repo file tree from github...');
    let o_response = await fetch(s_url__github_api_tree);
    if (!o_response.ok) {
        throw new Error(`failed to fetch github tree (${o_response.status})`);
    }
    let o_tree = await o_response.json();
    return o_tree.tree
        .filter(o => o.type === 'blob')
        .map(o => o.path);
};

// ─── skip logic ─────────────────────────────────────────────────────────────────

let o_set__skip = new Set([
    'serverside/init.js',
    'exports.js',
    'deno.lock',
    // 'CLAUDE.md',
    'AI_responses_summaries.md',
    'prompts.md',
    'todo.md',
    'terminal_interfaces.md',
]);

let f_b_should_skip = function(s_path) {
    if (o_set__skip.has(s_path)) return true;
    if (s_path.startsWith('.vscode/')) return true;
    return false;
};

// ─── UUID extraction ────────────────────────────────────────────────────────────

let f_s_uuid__from_env = function(s_env_content) {
    let o_match = s_env_content.match(/S_UUID=([0-9a-f-]+)/);
    if (!o_match) {
        throw new Error('could not find S_UUID in .env.example');
    }
    return o_match[1];
};

// ─── main init function ─────────────────────────────────────────────────────────

let f_init_project = async function(s_path__target) {
    if (!s_path__target) {
        s_path__target = Deno.cwd();
    }

    // guard: refuse to init inside the template source repo
    try {
        let s_deno_json = await Deno.readTextFile(`${s_path__target}/deno.json`);
        let o_deno_json = JSON.parse(s_deno_json);
        if (o_deno_json.name === '@apn/websersocketgui') {
            console.error('ERROR: refusing to initialize — this directory is the template source repo.');
            console.error('       run init in a new empty directory instead.');
            Deno.exit(1);
        }
    } catch (_) {
        // no deno.json or not parseable — proceed
    }

    console.log(`initializing project in: ${s_path__target}`);

    // ── 1. get file list from github ──

    let a_s_path = await f_a_s_path__from_github();
    console.log(`  found ${a_s_path.length} files in repo`);

    // ── 2. fetch .env.example to extract the old UUID ──

    let s_env_example = await f_s_fetch__github('.env.example');
    let s_uuid__old = f_s_uuid__from_env(s_env_example);
    let s_uuid__new = crypto.randomUUID();
    console.log(`  old uuid: ${s_uuid__old}`);
    console.log(`  new uuid: ${s_uuid__new}`);

    // ── 3. download all files, replace UUID in content and filenames ──

    await Deno.mkdir(`${s_path__target}/.gitignored`, { recursive: true });

    for (let s_path__file of a_s_path) {
        if (f_b_should_skip(s_path__file)) {
            continue;
        }

        try {
            let s_content = await f_s_fetch__github(s_path__file);

            // replace old UUID with new UUID in file content
            s_content = s_content.replaceAll(s_uuid__old, s_uuid__new);

            // replace old UUID with new UUID in filename
            let s_path__dest = s_path__file.replaceAll(s_uuid__old, s_uuid__new);

            await f_write(`${s_path__target}/${s_path__dest}`, s_content);
            console.log(`  wrote: ${s_path__dest}`);
        } catch (o_error) {
            console.warn(`  skipped: ${s_path__file} (${o_error.message})`);
        }
    }

    // ── 4. post-processing ──

    // copy .env.example → .env
    await Deno.copyFile(
        `${s_path__target}/.env.example`,
        `${s_path__target}/.env`
    );
    console.log('  created: .env (from .env.example)');

    // make start.sh executable
    try {
        await Deno.chmod(`${s_path__target}/start.sh`, 0o755);
    } catch (_) {
        // start.sh may not exist
    }

    // generate start.desktop (needs absolute path, not in repo)
    let s_desktop = `[Desktop Entry]
Type=Application
Name=Web App
Comment=Start the web application and open browser
Exec=${s_path__target}/start.sh
Path=${s_path__target}
Icon=web-browser
Terminal=false
Categories=Development;
StartupNotify=true
`;
    await f_write(`${s_path__target}/start.desktop`, s_desktop);
    await Deno.chmod(`${s_path__target}/start.desktop`, 0o755);
    console.log('  created: start.desktop');

    // ── done ──

    console.log('');
    console.log('project initialized successfully!');
    console.log('');
    console.log('next steps:');
    console.log(`  cd ${s_path__target}`);
    console.log('  deno task run');
};

// CLI entry point
if (import.meta.main) {
    let s_path = Deno.args[0];
    if (s_path && !s_path.startsWith('/')) {
        s_path = `${Deno.cwd()}/${s_path}`;
    }
    await f_init_project(s_path);
}

export { f_init_project };
