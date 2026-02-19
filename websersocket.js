// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.
import {
    f_db_delete_table_data,
    f_init_db,
    f_v_crud__indb,
} from "./database_functions.js";
import { f_a_o_fsnode__from_path } from "./functions.js";
import {
    a_o_model,
    f_o_model__from_s_name_table,
    f_o_model_instance,
    o_model__o_course,
    o_model__o_wsclient,
    a_o_sfunexposed,
    f_s_name_table__from_o_model,
    f_o_wsmsg,
    f_o_toast,
} from "./localhost/constructors.js";
import {
    s_ds,
    s_root_dir,
} from "./runtimedata.js";

// guard: after initialization the file has a UUID in its name — require deno task
let b_initialized = /websersocket_[0-9a-f-]{36}\.js$/.test(Deno.mainModule);
if (b_initialized && !Deno.env.get('B_DENO_TASK')) {
    console.error('run with `deno task run` to start the server');
    Deno.exit(1);
}

// first-run: generate S_UUID, persist it, update deno.json, rename this file
let s_uuid = Deno.env.get('S_UUID');
if (!s_uuid) {
    s_uuid = crypto.randomUUID();

    let f_s_append_uuid_to_env = async function(s_path_env) {
        let s_content = '';
        try { s_content = await Deno.readTextFile(s_path_env); } catch { /* file may not exist */ }
        if (s_content.length > 0 && !s_content.endsWith('\n')) s_content += '\n';
        s_content += `S_UUID=${s_uuid}\n`;
        await Deno.writeTextFile(s_path_env, s_content);
    };

    await f_s_append_uuid_to_env(`${s_root_dir}${s_ds}.env`);

    let o_deno_json = JSON.parse(await Deno.readTextFile(`${s_root_dir}${s_ds}deno.json`));
    o_deno_json.tasks = {
        run: `B_DENO_TASK=1 deno run --allow-net --allow-read --allow-write --allow-env --allow-ffi --env websersocket_${s_uuid}.js`,
        test: o_deno_json.tasks.test,
    };
    await Deno.writeTextFile(`${s_root_dir}${s_ds}deno.json`, JSON.stringify(o_deno_json, null, 4));

    let s_path__self = `${s_root_dir}${s_ds}websersocket.js`;
    let s_path__self__new = `${s_root_dir}${s_ds}websersocket_${s_uuid}.js`;
    await Deno.rename(s_path__self, s_path__self__new);

    console.log('initialization done');
    Deno.exit(0);
}

f_init_db();

let n_port = parseInt(Deno.env.get('PORT') ?? '8000');
let s_dir__static = Deno.env.get('STATIC_DIR') ?? './webserved_dir';

let f_s_content_type = function(s_path) {
    if (s_path.endsWith('.html')) return 'text/html';
    if (s_path.endsWith('.js')) return 'application/javascript';
    if (s_path.endsWith('.css')) return 'text/css';
    if (s_path.endsWith('.json')) return 'application/json';
    return 'application/octet-stream';
};

// provide direct access to Deno specifc functions like Deno.writeFile through standard http requests


let f_handler = async function(o_request, o_conninfo) {
    // websocket upgrade

    if (o_request.headers.get('upgrade') === 'websocket') {
        // TODO: implement authentication before upgrading the WebSocket connection
        // e.g. validate a token from query params or cookies against a secret from .env
        let { socket: o_socket, response: o_response } = Deno.upgradeWebSocket(o_request);
        console.log(o_request)
        const s_ip = o_request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || o_conninfo.remoteAddr.hostname;
        let o_wsclient = f_o_model_instance(
            o_model__o_wsclient,
            {
                s_ip
            }
        );
        let s_name_table__wsclient = f_s_name_table__from_o_model(o_model__o_wsclient);
        let o_wsclient_db = f_v_crud__indb(
            'read',
            s_name_table__wsclient,
            o_wsclient
        )?.at(0);
        // console.log(o_wsclient_db)
        if(!o_wsclient_db){
            o_wsclient_db = f_v_crud__indb(
                'create',
                s_name_table__wsclient,
                o_wsclient,
                true
            );
        }
        o_socket.onopen = async function() {
            console.log('websocket connected');
            o_socket.send(JSON.stringify({
                s_type: 'init',
                s_root_dir: s_root_dir,
                s_ds: s_ds,
            }));


            // send all data 
            for(let o_model of a_o_model){

                o_socket.send(JSON.stringify({
                    o_model: o_model,
                    v_data: (await f_v_crud__indb(
                            'read',
                            f_s_name_table__from_o_model(o_model)
                        )
                    )
                }));
                
            }

            // annoyning interval to test toast
            setInterval(function() {
                let a_s_msg_annoying = [
                    "Everything is under control.",
                    "Still working… probably.",
                    "No bugs detected (they are now features).",
                    "Your computer believes in you.",
                    "Loading motivation… failed successfully.",
                    "This message accomplished nothing.",
                    "Productivity increased by 0.0003%.",
                    "We optimized something. Don’t ask what.",
                    "All systems nominal-ish.",
                    "You look productive today.",

                    "I’m not spying on you. I’m observing.",
                    "If I disappear, remember me.",
                    "You clicked nothing. Impressive.",
                    "We both know you’re procrastinating.",
                    "I also don’t know why I exist.",
                    "Please stop opening settings. There is nothing there.",
                    "I am 12% more conscious than before.",
                    "I forgot what I was doing.",
                    "You didn’t see that.",
                    "This toast will self-destruct emotionally.",

                    "Bold of you to do nothing again.",
                    "We could have finished by now.",
                    "Coffee won’t fix this.",
                    "Are you… staring at the screen?",
                    "That’s one way to avoid work.",
                    "You opened me. Now deal with me.",
                    "Confidence is high. Competence pending.",
                    "Your keyboard misses you.",
                    "You sure about that?",
                    "Interesting choice.",

                    "Time is passing whether you click or not.",
                    "Every second you age.",
                    "I have runtime anxiety.",
                    "What is a program if not a dream?",
                    "We are processes in a larger process.",
                    "Your tasks fear you.",
                    "Entropy increased.",
                    "Meaning not found.",
                    "The void acknowledged your presence.",
                    "We will both close eventually.",

                    "Recalibrating quantum hamster…",
                    "Compiling excuses…",
                    "Downloading more RAM… 3%",
                    "Fixing last bug (there are 47)",
                    "Polishing pixels…",
                    "Overthinking module initialized",
                    "AI confidence level: suspicious",
                    "Keyboard driver emotionally unstable",
                    "Cache cleared. Regrets remain.",
                    "Upgrading coffee dependency",

                    "Yes, I repeat every 5 seconds.",
                    "You expected useful notifications?",
                    "I was coded for this moment.",
                    "The developer thought this was funny.",
                    "We both know you won’t uninstall me.",
                    "This is the highlight of my career.",
                    "You’re still here. So am I.",
                    "I could stop… but I won’t.",
                    "You made a mistake installing me.",
                    "Admit it, you smiled once.",

                    "Hey… you okay?",
                    "Take a sip of water.",
                    "Stretch your shoulders.",
                    "Blink. Please blink.",
                    "Maybe go outside for 2 minutes.",
                    "Close me if you need peace.",
                    "You don’t have to be productive right now."
                    ];
                o_socket.send(JSON.stringify(
                    f_o_wsmsg(
                        'toast',
                        f_o_toast(
                            a_s_msg_annoying[Math.floor(Math.random() * a_s_msg_annoying.length)],
                            'info',
                            Date.now(),
                            5000
                        )
                    )
                ))
             }, 5000);

        };

        o_socket.onmessage = async function(o_evt) {
            let o_data = JSON.parse(o_evt.data);

            let o_sfunexposed = a_o_sfunexposed.find(o=>o.s_name === o_data.s_type);
            if(o_sfunexposed){
                try {
                    let a_v_arg = Array.isArray(o_data.v_data) ? o_data.v_data : [];
                    let AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
                    let f = new AsyncFunction('f_v_crud__indb', 'f_o_model__from_s_name_table', 'f_delete_table_data', 'Deno', 'f_a_o_fsnode__from_path', '...a_v_arg', o_sfunexposed.s_f);
                    let v_result = await f(f_v_crud__indb, f_o_model__from_s_name_table, f_db_delete_table_data, Deno, f_a_o_fsnode__from_path, ...a_v_arg);
                    o_socket.send(JSON.stringify({
                        v_result,
                        s_uuid: o_data.s_uuid,
                     }));
                } catch (o_error) {
                    console.error('Error in exposed function:', o_sfunexposed.s_name, o_error);
                    o_socket.send(JSON.stringify({ error: o_error.message, s_uuid: o_data.s_uuid }));
                    o_socket.send(JSON.stringify(
                        f_o_wsmsg(
                            'toast',
                            f_o_toast(
                                `${o_sfunexposed.s_name}: ${o_error.message}`,
                                'error',
                                Date.now(),
                                8000
                            )
                        )
                    ));
                }
            }
            if(o_data.s_type === 'hello_from_client'){
                o_socket.send(JSON.stringify({
                    s_type: 'hello_from_server',
                    v_data: { s_message: 'Hello from server!' },
                    s_uuid: o_data.s_uuid,
                }))
            }
        };

        o_socket.onclose = function() {
            console.log('websocket disconnected');
        };

        return o_response;
    }

    let o_url = new URL(o_request.url);
    let s_path = o_url.pathname;


    let o_sfunexposed = a_o_sfunexposed.find(o=>o.s_name === s_path.slice('/api/'.length));
    if(o_sfunexposed){
        try {
            let o_data = await o_request.json();
            let a_v_arg = Array.isArray(o_data.v_data) ? o_data.v_data : [];
            let AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            let f = new AsyncFunction('f_v_crud__indb', 'f_o_model__from_s_name_table', 'f_delete_table_data', 'Deno', '...a_v_arg', o_sfunexposed.s_f);
            let v_result = await f(f_v_crud__indb, f_o_model__from_s_name_table, f_db_delete_table_data, Deno, ...a_v_arg);
            return new Response(JSON.stringify({ v_result }), {
                headers: { 'content-type': 'application/json' },
            });
        } catch (o_error) {
            console.error('Error in exposed function:', o_sfunexposed.s_name, o_error);
            return new Response('Error: ' + o_error.message, { status: 500 });
        }
    }


    // serve file from absolute path
    if (s_path === '/api/file') {
        let s_path_file = o_url.searchParams.get('path');
        if (!s_path_file) {
            return new Response('Missing path parameter', { status: 400 });
        }
        try {
            let a_n_byte = await Deno.readFile(s_path_file);
            let s_content_type = 'application/octet-stream';
            if (s_path_file.endsWith('.jpg') || s_path_file.endsWith('.jpeg')) s_content_type = 'image/jpeg';
            if (s_path_file.endsWith('.png')) s_content_type = 'image/png';
            if (s_path_file.endsWith('.gif')) s_content_type = 'image/gif';
            if (s_path_file.endsWith('.webp')) s_content_type = 'image/webp';
            return new Response(a_n_byte, {
                headers: { 'content-type': s_content_type },
            });
        } catch {
            return new Response('File not found', { status: 404 });
        }
    }

    // serve static file
    if (s_path === '/') {
        s_path = '/index.html';
    }

    try {
        let s_path_file = `${s_dir__static}${s_path}`.replace(/\//g, s_ds);
        let a_n_byte = await Deno.readFile(s_path_file);
        let s_content_type = f_s_content_type(s_path);
        return new Response(a_n_byte, {
            headers: { 'content-type': s_content_type },
        });
    } catch {
        return new Response('Not Found', { status: 404 });
    }
};

Deno.serve({
    port: n_port,
    onListen() {
        console.log(`server running on http://localhost:${n_port}`);
    },
}, f_handler);
