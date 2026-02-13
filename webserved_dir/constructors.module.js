let s_name_prop_ts_created = 'n_ts_ms_created';
let s_name_prop_ts_updated = 'n_ts_ms_updated';
let s_name_prop_id = 'n_id';

let f_s_name_table__from_o_model = function(o_model) {
    return 'a_' + o_model.s_name;
}
let f_s_name_foreign_key__from_o_model = function(o_model) {
    return 'n_' + o_model.s_name + '_' + s_name_prop_id;
}
let f_o_property = function(
    s_name, 
    s_type, 
    f_b_val_valid = function(){return true},
){
    return {
        s_name,
        s_type,
        f_b_val_valid
    }
}
let f_o_model = function({
    s_name,
    a_o_property
}){
    return {
        s_name,
        a_o_property
    }
}
let f_a_s_error__invalid_model_instance = function(
    o_model,
    o_instance
){
    let a_s_error = [];
    for(let o_model_prop of o_model.a_o_property){
        let value = o_instance[o_model_prop.s_name];
        let b_valid = o_model_prop.f_b_val_valid(value);
        if(!b_valid){
            let s_error = `Invalid value for property ${o_model_prop.s_name}: ${value}
            validator function is: ${o_model_prop.f_b_val_valid.toString()}
            got value : ${value} of type ${typeof value}`;
            a_s_error.push(s_error);
        }
    }
    // check if instance has property that is not in model
    for(let s_prop in o_instance){
        let o_model_prop = o_model.a_o_property.find(function(o_prop){
            return o_prop.s_name === s_prop;
        });
        if(!o_model_prop){
            let s_error = `Instance has property ${s_prop} that is not defined in model ${o_model.s_name}`;
            a_s_error.push(s_error);
        }
    }

    return a_s_error;
}
let f_o_model_prop__default_id = function(s_name){
    return f_o_property(s_name, 'number', (n_id)=>{
        // id will be undefined or null if the object does not exist in the database, but it will be set to a number if it does exist in the database
        if (n_id === undefined || n_id === null) return true;
        return Number.isInteger(n_id);
    });
}
let f_o_model_prop__timestamp_default = function(s_name){
    return f_o_property(s_name, 'number', (n_timestamp)=>{
        // created timestamp will be undefined or null if the object does not exist in the database, but it will be set to a number if it does exist in the database
        if (n_timestamp === undefined || n_timestamp === null) return true;
        return Number.isInteger(n_timestamp);
    });
}
let f_o_model__from_s_name_table = function(s_name_table) {
    return a_o_model.find(function(o_model) {
        return f_s_name_table__from_o_model(o_model) === s_name_table;
    });
};



let f_o_model_instance = function(
    o_model, 
    o_data
){
    // check if the data is valid for the model properties
    let a_s_error = f_a_s_error__invalid_model_instance(o_model, o_data);
    if(a_s_error.length > 0){
        throw new Error('Invalid model instance: ' + a_s_error.join('; '));
    }
    return o_data;
}
let o_model__o_student = f_o_model({
    s_name: 'o_student',
    a_o_property: [
        f_o_model_prop__default_id(s_name_prop_id),
        f_o_property('name', 'string', (s)=>{return s!==''}),
        f_o_model_prop__timestamp_default(s_name_prop_ts_created),
        f_o_model_prop__timestamp_default(s_name_prop_ts_updated),
    ]
})

let o_model__o_course = f_o_model({
    s_name: 'o_course',
    a_o_property: [
        f_o_model_prop__default_id(s_name_prop_id),
        f_o_property('name', 'string', (s)=>{return s!==''}),
        f_o_model_prop__timestamp_default(s_name_prop_ts_created),
        f_o_model_prop__timestamp_default(s_name_prop_ts_updated),
    ]
})

let o_model__o_course_o_student = f_o_model({
    s_name: 'o_course_o_student', //'enrolment' table to link students and courses in a many-to-many relationship
    a_o_property: [
        f_o_model_prop__default_id(s_name_prop_id),
        f_o_model_prop__default_id(f_s_name_foreign_key__from_o_model(o_model__o_course)),
        f_o_model_prop__default_id(f_s_name_foreign_key__from_o_model(o_model__o_student)),
        f_o_model_prop__timestamp_default(s_name_prop_ts_created),
        f_o_model_prop__timestamp_default(s_name_prop_ts_updated),
    ]
})


let o_model__o_wsclient = f_o_model({
    s_name: 'o_wsclient',
    a_o_property: [
        f_o_model_prop__default_id(s_name_prop_id),
        f_o_property('ip', 'string', (s)=>{return s!==''}),
        f_o_model_prop__timestamp_default(s_name_prop_ts_created),
        f_o_model_prop__timestamp_default(s_name_prop_ts_updated),
    ]
})

let a_o_model = [
    o_model__o_student,
    o_model__o_course,
    o_model__o_course_o_student, 
    o_model__o_wsclient
];

export {
    o_model__o_student,
    o_model__o_course,
    o_model__o_course_o_student,
    o_model__o_wsclient,
    a_o_model,
    f_s_name_table__from_o_model,
    f_s_name_foreign_key__from_o_model,
    f_o_model_instance,
    f_o_model__from_s_name_table,
    s_name_prop_ts_created,
    s_name_prop_ts_updated,
    f_a_s_error__invalid_model_instance,
    s_name_prop_id
}