# manually written down first line as a test
2026-02-13 - replaced all string concatenation with template literals in database_functions.module.js
2026-02-13 - implemented recursive f_ensure_default_data that creates db records from nested data structure with many-to-many junction table support
2026-02-13 - stripped all project-specific frontend components and backend code to create a clean starter project (kept only o_component__page_data)
2026-02-15 - added create-new-instance form to data component with inputs for editable properties, API call to f_v_crud__indb, and auto-refresh
2026-02-15 - fixed white page: f_send_wsmsg_with_response wrapped msg in {o_wsmsg} but server expected s_type at top level, so handshake promise never resolved
2026-02-15 - fixed ws onmessage handler using o_request.json() (closed HTTP request) instead of already-parsed websocket o_data
2026-02-15 - fixed sfunexposed: replaced new Function('return '+s_f) with AsyncFunction using named params and injected scope (f_v_crud__indb, Deno)
2026-02-15 - refactored sfunexposed to use ...a_v_arg rest param pattern: s_f bodies use a_v_arg array, client sends v_data as array, server injects scope deps as named params
2026-02-15 - updated all f_v_crud__indb callers to pass s_name_table strings instead of o_model objects (webserver_denojs.js, default_data.module.js)
2026-02-15 - added toast CSS: fixed bottom-right position, dark background, slide-in animation, fade-out on expired class
2026-02-15 - added reactive n_ts_ms_now with setInterval to make toast expired class reactive in Vue
2026-02-16 - implemented delete-all-table-data feature: wired f_delete_table_data sfunexposed to backend, added GUI button with confirm dialog
2026-02-16 - added colored toast types (info/success/warning/error) and server-side error toasts sent to client on sfunexposed failures
2026-02-16 - fixed f_delete_instance: defined s_name_table from o_model, passed o_instance instead of undefined o_data, splice from array instead of push
2026-02-16 - disabled FK constraints around deletes (PRAGMA foreign_keys OFF/ON) in both f_db_delete_table_data and CRUD delete
2026-02-18 - explored project and wrote 15 improvement suggestions to improvements.md
2026-02-18 - implemented all improvements: .env/.env.example, renamed *.module.js files and webserver_denojs.js, deno.json task runner, local lib imports, exponential WS backoff, full CRUD edit UI, fixed update logic, table validation, auth placeholder, README expansion, deno.lock
2026-02-19 - added first-run UUID init in websersocket.js: generates crypto UUID, appends S_UUID to .env and .env.example, renames websersocket.js to websersocket_<uuid>.js, then exits with 'initialization done'
2026-02-19 - rewrote bgshader.js to follow coding conventions: const→let, function declarations→variable assignments, renamed all vars with type prefixes and __ qualifier pattern, fixed canvas id 'c'→'background'
2026-02-19 - init now rewrites deno.json start task with B_DENO_TASK=1 prefix; guard at top of server file errors 'run with deno task' when UUID filename detected but B_DENO_TASK not set; added deno task init entry
2026-02-19 - reduced deno.json tasks to only 'run' and 'test'; init now writes tasks.run (not tasks.start) and preserves tasks.test
2026-02-19 - fixed typo in .env and .env.example: STATIC_DIR=./localohst → ./localhost
2026-02-19 - fixed @vue/devtools-api bare specifier error: added stub lib file and import map entry in index.html
2026-02-19 - added --allow-ffi to deno task run and test (SQLite library requires FFI); updated init code to write --allow-ffi into generated run task
2026-02-19 - canvas #background fixed full-screen z-index -1; full dark theme CSS with semi-transparent backdrop-blur panels over shader background
2026-02-19 - fixed shader mouse alignment: transform u_mouse from [0,1] into centered aspect-corrected uv space; fixed ambient drift and vignette for same space
2026-02-19 - added file browser page: sfunexposed f_a_o_fsnode__from_path in constructors.js, o_component__filebrowser.js with path persistence in a_o_keyvalpair db, /filebrowser route, compact dark list CSS
2026-02-19 - wired f_a_o_fsnode__from_path from functions.js: added imports to functions.js (s_ds, f_o_model_instance, o_model__o_fsnode), imported in server, injected into both AsyncFunction call sites
2026-02-19 - revised o_component__filebrowser: moved f_s_path_parent(s_path, s_ds) to localhost/functions.js, added s_ds to server init message and o_state, rewrote template with f_o_html_from_o_js, renamed s_path→s_path_absolute with s_ds as data property
2026-02-20 - created uninitialize.js and deno task uninitialize: removes S_UUID from .env, renames websersocket_<uuid>.js back to websersocket.js, resets deno.json run task
2026-02-20 - renamed all o_sfunexposed/a_o_sfunexposed to o_wsmsg/a_o_wsmsg across 6 files; fixed server onmessage matching s_type→s_name and added missing await on async f_v_result_from_o_wsmsg
2026-02-20 - completed o_wsmsg implementation: split f_o_wsmsg into f_o_wsmsg_def (definition) + f_o_wsmsg (wire instance), fixed duplicate let declaration in f_v_result_from_o_wsmsg, fixed client dispatch to use o_wsmsg__existing instead of parsed JSON, moved UUID handler loop before definition lookup, replaced o_wsmsg__server_error/hello_from_client with o_wsmsg__logmsg, fixed annoying interval and error handler in websersocket.js
