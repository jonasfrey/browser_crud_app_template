// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

let s_root_dir = Deno.cwd();
// directory separator
let s_ds = '/';
// if windows is detected as platform, change to backslash
if (Deno.build.os === 'windows') {
    s_ds = '\\';
}

// all .env variables gathered here, each script imports what it needs from this file
let n_port = parseInt(Deno.env.get('PORT') ?? '8000');
let s_dir__static = Deno.env.get('STATIC_DIR') ?? './localhost';
let s_path__database = Deno.env.get('DB_PATH') ?? './.gitignored/app.db';
let s_path__model_constructor_cli_language = Deno.env.get('MODEL_CONSTRUCTORS_CLI_LANGUAGES_PATH') ?? './.gitignored/model_constructors/';
let s_uuid = Deno.env.get('S_UUID') ?? '';

export {
    s_root_dir,
    s_ds,
    n_port,
    s_dir__static,
    s_path__database,
    s_path__model_constructor_cli_language,
    s_uuid
}