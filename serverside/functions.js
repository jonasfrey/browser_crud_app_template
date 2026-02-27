// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

// backend utility functions
// add shared server-side helper functions here and import them where needed

import { s_ds, s_root_dir, s_uuid } from './runtimedata.js';
import { a_o_wsmsg, f_o_model_instance, f_s_name_table__from_o_model, o_model__o_fsnode, o_model__o_utterance, o_wsmsg__deno_copy_file, o_wsmsg__deno_mkdir, o_wsmsg__deno_stat, o_wsmsg__f_a_o_fsnode, o_wsmsg__f_delete_table_data, o_wsmsg__f_v_crud__indb, o_wsmsg__logmsg, o_wsmsg__set_state_data } from '../localhost/constructors.js';
import { f_v_crud__indb, f_db_delete_table_data } from './database_functions.js';

let f_a_o_fsnode = async function(
    s_path,
    b_recursive = false,
    b_store_in_db = false
) {
    let a_o = [];

    if (!s_path) {
        console.error('Invalid path:', s_path);
        return a_o;
    }
    if (!s_path.startsWith(s_ds)) {
        console.error('Path is not absolute:', s_path);
        return a_o;
    }

    try {
        for await (let o_dir_entry of Deno.readDir(s_path)) {
            let s_path_absolute = `${s_path}${s_ds}${o_dir_entry.name}`;

            let o_fsnode = f_o_model_instance(
                o_model__o_fsnode,
                {
                    s_path_absolute,
                    s_name: s_path_absolute.split(s_ds).at(-1),
                    b_folder: o_dir_entry.isDirectory,
                }
            );
            if(b_store_in_db){
                let o_fsnode__fromdb = (f_v_crud__indb('read', f_s_name_table__from_o_model(o_model__o_fsnode), { s_path_absolute }))?.at(0);
                if (o_fsnode__fromdb) {
                    o_fsnode.n_id = o_fsnode__fromdb.n_id;
                } else {
                    let o_fsnode__created = f_v_crud__indb('create', f_s_name_table__from_o_model(o_model__o_fsnode), { s_path_absolute, b_folder: o_dir_entry.isDirectory });
                    o_fsnode.n_id = o_fsnode__created.n_id;
                }
                if (o_dir_entry.isDirectory && b_recursive) {
                    o_fsnode.a_o_fsnode = await f_a_o_fsnode(s_path_absolute, b_recursive);
                }
            }

            a_o.push(o_fsnode);
        }
    } catch (o_error) {
        console.error(`Error reading directory: ${s_path}`, o_error.message);
        console.error(o_error.stack);
    }

    a_o.sort(function(o_a, o_b) {
        if (o_a.b_folder === o_b.b_folder) return (o_a.s_name || '').localeCompare(o_b.s_name || '');
        return o_a.b_folder ? -1 : 1;
    });

    return a_o;
};



// WARNING: the following deno_copy_file, deno_stat, deno_mkdir handlers expose raw Deno APIs
// to any connected WebSocket client with arbitrary arguments. Fine for local dev use,
// but must be restricted or removed before any network-exposed deployment.
o_wsmsg__deno_copy_file.f_v_server_implementation = function(o_wsmsg){
    let a_v_arg = Array.isArray(o_wsmsg.v_data) ? o_wsmsg.v_data : [];
    return Deno.copyFile(...a_v_arg);
}
o_wsmsg__deno_stat.f_v_server_implementation = function(o_wsmsg){
    let a_v_arg = Array.isArray(o_wsmsg.v_data) ? o_wsmsg.v_data : [];
    return Deno.stat(...a_v_arg);
}
o_wsmsg__deno_mkdir.f_v_server_implementation = function(o_wsmsg){
    let a_v_arg = Array.isArray(o_wsmsg.v_data) ? o_wsmsg.v_data : [];
    return Deno.mkdir(...a_v_arg);
}
o_wsmsg__f_v_crud__indb.f_v_server_implementation = function(o_wsmsg){
    let a_v_arg = Array.isArray(o_wsmsg.v_data) ? o_wsmsg.v_data : [];
    return f_v_crud__indb(...a_v_arg);
}
o_wsmsg__f_delete_table_data.f_v_server_implementation = function(o_wsmsg){
    let a_v_arg = Array.isArray(o_wsmsg.v_data) ? o_wsmsg.v_data : [];
    return f_db_delete_table_data(...a_v_arg);
}
o_wsmsg__f_a_o_fsnode.f_v_server_implementation = function(o_wsmsg){
    let a_v_arg = Array.isArray(o_wsmsg.v_data) ? o_wsmsg.v_data : [];
    return f_a_o_fsnode(...a_v_arg);
}
o_wsmsg__logmsg.f_v_server_implementation = function(o_wsmsg){
    let o_logmsg = o_wsmsg.v_data;
    if(o_logmsg.b_consolelog){
        console[o_logmsg.s_type](o_logmsg.s_message);
    }
    return null;
}
o_wsmsg__set_state_data.f_v_server_implementation = function(o_wsmsg, o_wsmsg__existing, o_state){
    o_state[o_wsmsg.v_data.s_property] = o_wsmsg.v_data.value;
    return null;
}
let f_o_uttdatainfo = async function(s_text){
    let s_name_script = 'f_o_uttdatainfo.py';
    let s_path__script = `${s_root_dir}${s_ds}serverside${s_ds}${s_name_script}`;
    // prefer venv python if it exists, fall back to system python3
    let s_path__python = `${s_root_dir}${s_ds}venv${s_ds}bin${s_ds}python3`;
    try { await Deno.stat(s_path__python); } catch { s_path__python = 'python3'; }
    let a_s_cmd = [s_path__python, s_path__script, s_text, '--s-uuid', s_uuid];

    let o_process = new Deno.Command(a_s_cmd[0], {
        args: a_s_cmd.slice(1),
        cwd: s_root_dir,
        stdout: 'piped',
        stderr: 'piped',
    });
    let o_output = await o_process.output();
    let s_stdout = new TextDecoder().decode(o_output.stdout);
    let s_stderr = new TextDecoder().decode(o_output.stderr);

    if(o_output.code !== 0){
        console.error(`${s_name_script} python script failed:`, s_stderr);
        throw new Error(`${s_name_script} exited with code ${o_output.code}: ${s_stderr}`);
    }

    // parse IPC block from stdout
    let s_tag__start = `${s_uuid}_start_json`;
    let s_tag__end = `${s_uuid}_end_json`;
    let n_idx__start = s_stdout.indexOf(s_tag__start);
    let n_idx__end = s_stdout.indexOf(s_tag__end);

    if(n_idx__start === -1 || n_idx__end === -1){
        console.error(`${s_name_script}: no IPC block found in stdout:\n`, s_stdout);
        throw new Error(`${s_name_script} did not emit IPC json block`);
    }

    let s_json = s_stdout.slice(n_idx__start + s_tag__start.length, n_idx__end).trim();
    let o_ipc = JSON.parse(s_json);
    // o_ipc: { o_utterance: { s_text, ... }, o_fsnode: { s_path_absolute, s_name, n_bytes, ... } }

    // create o_fsnode in db for the audio file
    let s_name_table__fsnode = f_s_name_table__from_o_model(o_model__o_fsnode);
    let o_fsnode = f_v_crud__indb('create', s_name_table__fsnode, {
        s_path_absolute: o_ipc.o_fsnode.s_path_absolute,
        s_name: o_ipc.o_fsnode.s_name,
        n_bytes: o_ipc.o_fsnode.n_bytes,
        b_folder: false,
    });

    // create o_utterance in db linked to o_fsnode
    let s_name_table__utterance = f_s_name_table__from_o_model(o_model__o_utterance);
    let o_utterance = f_v_crud__indb('create', s_name_table__utterance, {
        s_text: o_ipc.o_utterance.s_text,
        n_o_fsnode_n_id: o_fsnode.n_id,
    });

    return {
        o_utterance,
        o_fsnode,
    };
};

let f_o_uttdatainfo__read_or_create = async function(s_text){
    let s_name_table__utterance = f_s_name_table__from_o_model(o_model__o_utterance);
    let s_name_table__fsnode = f_s_name_table__from_o_model(o_model__o_fsnode);
    let a_o_existing = f_v_crud__indb('read', s_name_table__utterance, { s_text }) || [];
    if(a_o_existing.length > 0){
        let o_utterance = a_o_existing[0];
        let o_fsnode = o_utterance.n_o_fsnode_n_id
            ? (f_v_crud__indb('read', s_name_table__fsnode, { n_id: o_utterance.n_o_fsnode_n_id }) || []).at(0)
            : null;
        return { o_utterance, o_fsnode };
    }
    // not found in db, generate new utterance audio
    return await f_o_uttdatainfo(s_text);
};

let f_v_result_from_o_wsmsg = async function(
    o_wsmsg,
    o_state
){
    let o_wsmsg__existing = a_o_wsmsg.find(o=>o.s_name === o_wsmsg.s_name);
    if(!o_wsmsg__existing){
        console.error('No such wsmsg:', o_wsmsg.s_name);
        return null;
    }
    if(!o_wsmsg__existing.f_v_server_implementation) {
        console.error('No server implementation for wsmsg:', o_wsmsg.s_name);
        return null;
    }
    return o_wsmsg__existing.f_v_server_implementation(
        o_wsmsg,
        o_wsmsg__existing, 
        o_state
    );

}

export {
    f_a_o_fsnode,
    f_o_uttdatainfo,
    f_o_uttdatainfo__read_or_create,
    f_v_result_from_o_wsmsg
};
