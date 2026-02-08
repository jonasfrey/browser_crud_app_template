# manually written down first line as a test
2026-02-06 - renamed all DB table names from bare names (config, file, etc.) to o_ prefixed names (o_config, o_file, etc.) matching constructor naming convention
2026-02-06 - replaced hardcoded CREATE TABLE statements with dynamic loop over a_o_model, auto-detecting foreign keys from n_o_{model}_n_id pattern
2026-02-07 - added 'Data' page with phpMyAdmin-like table browser, generic CRUD (insert/read/update/delete) for all model tables via WebSocket
2026-02-07 - moved all database functions from functions.module.js to database_functions.module.js, updated webserver imports accordingly
2026-02-07 - implemented generic f_v_crud__indb (create/read/update/delete) with array serialization, unified websocket protocol to single 'crud' message type, updated frontend to use f_s_name_table__from_o_model
2026-02-07 - removed redundant f_o_model__from_s_name_table definitions from webserver_denojs.js and index.html, now imported from constructors.module.js
2026-02-07 - converted frontend to Vue.js 3 with Options API: created index.js with Vue app (reactive data, computed, methods), recursive file-tree component, importmap for Vue ESM, removed manual DOM manipulation
2026-02-07 - added Vue Router with hash-based routing, split monolithic Vue app into per-page components (analyze_file, data, configuration), extracted WebSocket into shared reactive service, added keep-alive for state preservation
2026-02-08 - replaced static o_state__config with dynamic o_state__dbdata built from a_o_model loop, handles all table data generically via WebSocket crud messages
2026-02-08 - added image/video metadata display in file tree: images show dimensions + file size, videos show duration + dimensions + file size
2026-02-08 - integrated vitpose batch processing: Python script accepts --model-dir/--download-models args, Deno calls Python via f_a_o_pose_from_a_o_img storing pose+keypoint data in DB, frontend button triggers estimation via WebSocket
2026-02-08 - fixed vitpose: removed local_files_only=True (causes HF repo_id validation error on absolute paths), added model dir existence check, resolve paths with Path.resolve()
2026-02-08 - added f_download_vitpose_model to auto-download models on webserver startup if not already present
2026-02-08 - added Pose Viewer page: /api/image endpoint for serving images, f_a_o_image__with_pose backend query, canvas skeleton overlay with COCO connections, k/l keyboard navigation, per-person color coding
2026-02-08 - added posekeypoint name text labels on canvas next to each keypoint dot in pose viewer
2026-02-08 - added pose viewer callback filters: b_active field on o_pose_filter model, Monaco editor per filter with collapsible panels, on/off toggle, create/delete via CRUD, active filters applied as new Function() callbacks to filter displayed images