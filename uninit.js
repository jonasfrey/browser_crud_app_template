// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.
import { s_ds, s_root_dir } from "./runtimedata.js";

let s_path__env = `${s_root_dir}${s_ds}.env`;
let s_path__deno_json = `${s_root_dir}${s_ds}deno.json`;

// read S_UUID from .env
let s_env = '';
try { s_env = await Deno.readTextFile(s_path__env); } catch {
    console.error('.env file not found — nothing to uninitialize');
    Deno.exit(1);
}

let s_uuid = '';
let a_s_line = s_env.split('\n');
for (let s_line of a_s_line) {
    let a_s_part = s_line.split('=');
    if (a_s_part[0].trim() === 'S_UUID') {
        s_uuid = a_s_part.slice(1).join('=').trim();
        break;
    }
}

if (!s_uuid) {
    console.error('S_UUID not found in .env — nothing to uninitialize');
    Deno.exit(1);
}

// 1. remove S_UUID line from .env
let a_s_line__filtered = a_s_line.filter(function(s_line) {
    return s_line.split('=')[0].trim() !== 'S_UUID';
});
// remove trailing empty lines then add single newline at end
let s_env__new = a_s_line__filtered.join('\n').replace(/\n+$/, '') + '\n';
await Deno.writeTextFile(s_path__env, s_env__new);
console.log('removed S_UUID from .env');

// 2. rename websersocket_<uuid>.js back to websersocket.js
let s_path__ws_uuid = `${s_root_dir}${s_ds}websersocket_${s_uuid}.js`;
let s_path__ws = `${s_root_dir}${s_ds}websersocket.js`;
try {
    await Deno.rename(s_path__ws_uuid, s_path__ws);
    console.log(`renamed websersocket_${s_uuid}.js -> websersocket.js`);
} catch (o_error) {
    console.error(`failed to rename: ${o_error.message}`);
    Deno.exit(1);
}

// 3. update deno.json run task to use websersocket.js (without uuid)
let o_deno_json = JSON.parse(await Deno.readTextFile(s_path__deno_json));
o_deno_json.tasks.run = 'B_DENO_TASK=1 deno run --allow-net --allow-read --allow-write --allow-env --allow-ffi --env websersocket.js';
await Deno.writeTextFile(s_path__deno_json, JSON.stringify(o_deno_json, null, 4));
console.log('updated deno.json run task');

console.log('uninitialization done');
