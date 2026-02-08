
import {
    f_db_delete_table_data,
    f_init_db,
    f_v_crud__indb,
} from "./database_functions.module.js";
import {
    f_o_model__from_s_name_table,
    o_model__o_config,
} from "./webserved_dir/constructors.module.js";
import {
    f_a_o_fsnode__from_path_recursive,
    f_create_test_data,
    f_a_o_image__with_pose,
} from "./functions.module.js";
import {
    f_a_o_pose_from_a_o_img,
    f_download_vitpose_model,
} from "./command_api.module.js";
import {
    s_ds
} from "./runtimedata.module.js";

f_init_db();

let n_port = 8000;


let f_s_content_type = function(s_path) {
    if (s_path.endsWith('.html')) return 'text/html';
    if (s_path.endsWith('.js')) return 'application/javascript';
    if (s_path.endsWith('.css')) return 'text/css';
    if (s_path.endsWith('.json')) return 'application/json';
    return 'application/octet-stream';
};

await f_create_test_data();
await f_download_vitpose_model();

let f_handler = async function(o_request) {
    // websocket upgrade
    if (o_request.headers.get('upgrade') === 'websocket') {
        let { socket: o_socket, response: o_response } = Deno.upgradeWebSocket(o_request);

        o_socket.onopen = function() {
            console.log('websocket connected');

            // read data and send to client 
            let a_o_config = f_v_crud__indb(
                'read',
                o_model__o_config,
                {}
            );
            console.log(a_o_config)
            o_socket.send(JSON.stringify({
                s_type: 'crud',
                s_name_table: 'a_o_config',
                v_result: a_o_config
            }));
        };

        o_socket.onmessage = async function(o_evt) {
            let o_data = JSON.parse(o_evt.data);

            if (o_data.s_type === 'f_a_o_fsnode') {
                try {
                    let o_stat = await Deno.stat(o_data.s_path);
                    if (!o_stat.isDirectory) {
                        o_socket.send(JSON.stringify({
                            s_type: 'f_a_o_fsnode',
                            s_error: 'path is not a directory',
                        }));
                        return;
                    }
                    let a_o_fsnode = await f_a_o_fsnode__from_path_recursive(o_data.s_path);

                    o_socket.send(JSON.stringify({
                        s_type: 'f_a_o_fsnode',
                        a_o_fsnode,
                    }));
                } catch (o_error) {
                    o_socket.send(JSON.stringify({
                        s_type: 'f_a_o_fsnode',
                        s_error: o_error.message,
                    }));
                }
            }

            if (o_data.s_type === 'crud') {
                try {
                    let o_model = f_o_model__from_s_name_table(o_data.s_name_table);
                    if (!o_model) {
                        o_socket.send(JSON.stringify({
                            s_type: 'crud',
                            s_name_crud: o_data.s_name_crud,
                            s_name_table: o_data.s_name_table,
                            s_error: 'unknown table: ' + o_data.s_name_table,
                        }));
                        return;
                    }
                    let v_result = f_v_crud__indb(o_data.s_name_crud, o_model, o_data.v_o_data, o_data.v_o_data_update);
                    o_socket.send(JSON.stringify({
                        s_type: 'crud',
                        s_name_crud: o_data.s_name_crud,
                        s_name_table: o_data.s_name_table,
                        v_result,
                    }));
                } catch (o_error) {
                    o_socket.send(JSON.stringify({
                        s_type: 'crud',
                        s_name_crud: o_data.s_name_crud,
                        s_name_table: o_data.s_name_table,
                        s_error: o_error.message,
                    }));
                }
            }
            if(o_data.s_type === 'f_a_o_pose_from_a_o_img'){
                try {
                    let a_o_pose = await f_a_o_pose_from_a_o_img(o_data.a_o_image);
                    o_socket.send(JSON.stringify({
                        s_type: 'f_a_o_pose_from_a_o_img',
                        a_o_pose,
                    }));
                } catch (o_error) {
                    o_socket.send(JSON.stringify({
                        s_type: 'f_a_o_pose_from_a_o_img',
                        s_error: o_error.message,
                    }));
                }
            }
            if(o_data.s_type === 'f_a_o_image__with_pose'){
                try {
                    let a_o_image_data = f_a_o_image__with_pose();
                    o_socket.send(JSON.stringify({
                        s_type: 'f_a_o_image__with_pose',
                        a_o_image_data,
                    }));
                } catch (o_error) {
                    o_socket.send(JSON.stringify({
                        s_type: 'f_a_o_image__with_pose',
                        s_error: o_error.message,
                    }));
                }
            }
            if(o_data.s_type === 'delete_table_data'){
                try {
                    let v_ret = await f_db_delete_table_data(o_data.s_name_table);
                    o_socket.send(JSON.stringify({
                        s_type: 'delete_table_data',
                        s_name_table: o_data.s_name_table,
                        v_result: v_ret,
                    }));
                } catch (o_error) {
                    o_socket.send(JSON.stringify({
                        s_type: 'delete_table_data',
                        s_name_table: o_data.s_name_table,
                        s_error: o_error.message,
                    }));
                }
            }
        };

        o_socket.onclose = function() {
            console.log('websocket disconnected');
        };

        return o_response;
    }

    let o_url = new URL(o_request.url);
    let s_path = o_url.pathname;

    // serve image from absolute path
    if (s_path === '/api/image') {
        let s_path_image = o_url.searchParams.get('path');
        if (!s_path_image) {
            return new Response('Missing path parameter', { status: 400 });
        }
        try {
            let a_n_byte = await Deno.readFile(s_path_image);
            let s_content_type = 'application/octet-stream';
            if (s_path_image.endsWith('.jpg') || s_path_image.endsWith('.jpeg')) s_content_type = 'image/jpeg';
            if (s_path_image.endsWith('.png')) s_content_type = 'image/png';
            if (s_path_image.endsWith('.gif')) s_content_type = 'image/gif';
            if (s_path_image.endsWith('.webp')) s_content_type = 'image/webp';
            return new Response(a_n_byte, {
                headers: { 'content-type': s_content_type },
            });
        } catch {
            return new Response('Image not found', { status: 404 });
        }
    }

    // serve static file
    if (s_path === '/') {
        s_path = '/index.html';
    }

    try {
        let s_path_file = `./webserved_dir${s_path}`.replace(/\//g, s_ds);
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
