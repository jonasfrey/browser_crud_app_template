
import { Database } from "jsr:@db/sqlite@0.11";
import {
    a_o_model,
    f_s_name_table__from_o_model,
    f_s_name_foreign_key__from_o_model,
    o_model__o_config,
    f_o_model_instance,
    o_model__o_pose_filter,
} from "./webserved_dir/constructors.module.js";
import { s_root_dir } from "./runtimedata.module.js";

let o_db = null;

let s_path_database = './.gitignored/media_analyser.db';

let o_config__default = f_o_model_instance(o_model__o_config, {
    n_id: 1,
    s_path_last_opened: `${s_root_dir}/.gitignored/COCO`,
    a_s_filter_extension: ['mp4', 'jpg', 'jpeg', 'png', 'gif'],
});
let o_pose_filter__default = f_o_model_instance(o_model__o_pose_filter, {
    n_id: 1,
    s_name: 'arms_in_the_air',
    s_f_b_show: (
    (o_image, o_fsnode, a_o_pose)=>{
        // we can filter poses here
        let op1 = a_o_pose?.[0];
        let a_s_name_keypoint = [
            'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
            'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
            'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
            'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
        ];
        console.log(op1)

        for(let s of a_s_name_keypoint){
            let o_keypoint = a_o_pose?.a_o_posekeypoint?.find(function(o){return o?.s_name === s});
            if(o_keypoint){op1['o_' + s] = o_keypoint}
        };

        if(
            op1?.o_left_wrist?.n_trn_y > op1?.o_left_shoulder?.n_trn_y
            ||
            op1?.o_right_wrist?.n_trn_y > op1?.o_right_shoulder?.n_trn_y
        ){
            return true
        };
        return false;
    }).toString()
});

let f_init_db = async function(s_path_db = s_path_database) {
    o_db = new Database(s_path_db);

    for (let o_model of a_o_model) {
        let s_name_table = f_s_name_table__from_o_model(o_model);
        let a_s_column = [];
        let a_s_fk = [];

        for (let o_prop of o_model.a_o_property) {
            if (o_prop.s_name === 'n_id') {
                a_s_column.push('n_id INTEGER PRIMARY KEY');
                continue;
            }

            let s_sql_type = 'TEXT';
            if (o_prop.s_type === 'number') s_sql_type = 'REAL';
            if (o_prop.s_type === 'boolean') s_sql_type = 'INTEGER';

            a_s_column.push(o_prop.s_name + ' ' + s_sql_type);

            // detect foreign key
            let o_model__foreign = a_o_model.find(function(o) {
                return f_s_name_foreign_key__from_o_model(o) === o_prop.s_name;
            });
            if (o_model__foreign) {
                let s_name_table_ref = f_s_name_table__from_o_model(o_model__foreign);
                a_s_fk.push('FOREIGN KEY (' + o_prop.s_name + ') REFERENCES ' + s_name_table_ref + '(n_id)');
            }
        }

        let s_sql = 'CREATE TABLE IF NOT EXISTS ' + s_name_table
            + ' (\n' + a_s_column.concat(a_s_fk).join(',\n') + '\n)';
        o_db.exec(s_sql);
    }

    // ensure a default config row exists
    let o_config__default_fromdb = (await f_v_crud__indb(
        'read', 
        o_model__o_config,
         { n_id: o_config__default.n_id })
    )?.at(0);

    if(!o_config__default_fromdb){
        await f_v_crud__indb(
            'create', 
            o_model__o_config, 
            o_config__default
    );
    }
    let o_pose_filter__default_fromdb = (await f_v_crud__indb(
        'read', 
        o_model__o_pose_filter,
            { n_id: o_pose_filter__default.n_id })
    )?.at(0);
    if(!o_pose_filter__default_fromdb){
        await f_v_crud__indb(
            'create',
            o_model__o_pose_filter,
            o_pose_filter__default
        );
    }

    console.log(o_config__default_fromdb);
    return o_db;
};



// helper: serialize array-type values to JSON strings for storage
let f_v_value__serialized = function(o_prop, v_val) {
    if (o_prop.s_type === 'array' && v_val !== null && v_val !== undefined && typeof v_val !== 'string') {
        return JSON.stringify(v_val);
    }
    return v_val;
};

// generic db CRUD

let f_db_delete_table_data = function(s_name_table){
    return o_db.prepare(`DELETE FROM ${s_name_table}`).run();
}
let f_v_crud__indb = function(
    s_name_crud_function,
    o_model,
    v_o_data,
    v_o_data_update
){
    let s_name_table = f_s_name_table__from_o_model(o_model);
    let v_return = null;

    if (s_name_crud_function === 'create') {
        // v_o_data should be an instance of o_model
        let a_s_column = [];
        let a_v_value = [];

        for (let o_prop of o_model.a_o_property) {
            if (o_prop.s_name === 'n_id' && (v_o_data.n_id === undefined || v_o_data.n_id === null || v_o_data.n_id === '')) continue;
            if (v_o_data[o_prop.s_name] === undefined) continue;
            a_s_column.push(o_prop.s_name);
            a_v_value.push(f_v_value__serialized(o_prop, v_o_data[o_prop.s_name]));
        }

        let s_sql = 'INSERT INTO ' + s_name_table
            + ' (' + a_s_column.join(', ') + ') VALUES ('
            + a_s_column.map(function() { return '?'; }).join(', ') + ')';
        o_db.prepare(s_sql).run(...a_v_value);

        let o_last = o_db.prepare('SELECT last_insert_rowid() as n_id').get();
        v_return = o_db.prepare('SELECT * FROM ' + s_name_table + ' WHERE n_id = ?').get(o_last.n_id)
    }

    if (s_name_crud_function === 'read') {
        // v_o_data is not null we use the specified properties as filters for the query
        let s_query = `SELECT * FROM ${s_name_table}`;
        if (v_o_data) {
            let a_s_filter = [];
            for (let s_key in v_o_data) {
                a_s_filter.push(s_key + ' = ?');
            }
            if (a_s_filter.length > 0) {
                s_query += ' WHERE ' + a_s_filter.join(' AND ');
            }
        }
        // console.log(s_query);
        // console.log(v_o_data);
        let a_o_row = o_db.prepare(s_query).all(...(v_o_data ? Object.values(v_o_data) : []));
        v_return = a_o_row
        
        // v_return = a_o_row.map(function(o_row) { return f_o_row__deserialized(o_model, o_row); });
    }

    if (s_name_crud_function === 'update') {
        // v_o_data should be an instance of o_model, with n_id property set to the id of the row to update
        // v_o_data_update should be an object with the properties to update
        if (!v_o_data || v_o_data.n_id === undefined || v_o_data.n_id === null) return null;

        let a_s_set = [];
        let a_v_value = [];

        for (let o_prop of o_model.a_o_property) {
            if (o_prop.s_name === 'n_id') continue;
            if (v_o_data_update[o_prop.s_name] === undefined) continue;
            a_s_set.push(o_prop.s_name + ' = ?');
            a_v_value.push(f_v_value__serialized(o_prop, v_o_data_update[o_prop.s_name]));
        }

        if (a_s_set.length === 0) return null;

        a_v_value.push(v_o_data.n_id);
        let s_sql = 'UPDATE ' + s_name_table + ' SET ' + a_s_set.join(', ') + ' WHERE n_id = ?';
        o_db.prepare(s_sql).run(...a_v_value);

        v_return = o_db.prepare('SELECT * FROM ' + s_name_table + ' WHERE n_id = ?').get(v_o_data.n_id)
    }

    if (s_name_crud_function === 'delete') {
        // v_o_data should be an instance of o_model, with n_id property set to the id of the row to delete
        if (!v_o_data || v_o_data.n_id === undefined || v_o_data.n_id === null) return false;
        o_db.prepare('DELETE FROM ' + s_name_table + ' WHERE n_id = ?').run(v_o_data.n_id);
        v_return = true;
    }

    return v_return;
};


export {
    f_init_db,
    f_v_crud__indb,
    f_db_delete_table_data
};
