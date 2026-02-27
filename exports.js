// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

// shared (client + server)
export {
    // model factories
    f_o_property,
    f_o_model,
    f_o_model_prop__default_id,
    f_o_model_prop__timestamp_default,
    f_o_model_instance,
    f_a_s_error__invalid_model_instance,

    // model name helpers
    f_s_name_table__from_o_model,
    f_s_name_foreign_key__from_o_model,
    f_o_model__from_s_name_table,

    // model property name constants
    s_name_prop_ts_created,
    s_name_prop_ts_updated,
    s_name_prop_id,

    // infrastructure models
    o_model__o_wsclient,
    o_model__o_keyvalpair,
    o_model__o_fsnode,

    // logging
    f_o_logmsg,
    s_o_logmsg_s_type__log,
    s_o_logmsg_s_type__error,
    s_o_logmsg_s_type__warn,
    s_o_logmsg_s_type__info,
    s_o_logmsg_s_type__debug,
    s_o_logmsg_s_type__table,

    // wsmsg factories
    f_o_wsmsg_def,
    f_o_wsmsg,

    // wsmsg definitions
    o_wsmsg__deno_copy_file,
    o_wsmsg__deno_stat,
    o_wsmsg__deno_mkdir,
    o_wsmsg__f_v_crud__indb,
    o_wsmsg__f_delete_table_data,
    o_wsmsg__f_a_o_fsnode,
    o_wsmsg__logmsg,
    o_wsmsg__set_state_data,
    a_o_wsmsg,
} from './localhost/constructors.js';

// server only — database
export {
    f_init_db,
    f_v_crud__indb,
    f_db_delete_table_data,
} from './serverside/database_functions.js';

// server only — wsmsg server implementations + filesystem scanner
// importing this file attaches f_v_server_implementation to all o_wsmsg definitions
export {
    f_a_o_fsnode,
    f_v_result_from_o_wsmsg,
} from './serverside/functions.js';

// server only — runtime environment
export {
    s_root_dir,
    s_ds,
    n_port,
    s_dir__static,
    s_path__database,
    s_path__model_constructor_cli_language,
    s_uuid,
} from './serverside/runtimedata.js';

// client utility
export {
    f_s_path_parent,
} from './localhost/functions.js';
