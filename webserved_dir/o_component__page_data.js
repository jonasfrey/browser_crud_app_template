import { o_state as o_state__ws, f_send, f_register_handler } from './o_service__websocket.js';
import {
    a_o_model,
    f_s_name_table__from_o_model,
    f_o_model__from_s_name_table,
} from './constructors.module.js';

let o_component__page_data = {
    name: 'page-data',
    template: `
        <div class="page__content">
            <div class="db_table_selector">
                <button v-for="o_model in a_o_model" :key="o_model.s_name"
                    class="btn__table"
                    :class="{ active: s_name_table__active === f_s_name_table__from_o_model(o_model) }"
                    @click="f_db_load_table(f_s_name_table__from_o_model(o_model))">
                    {{ f_s_name_table__from_o_model(o_model) }}
                </button>
            </div>

            <div class="container__db_table" v-if="o_model__active && (a_o_row__data.length > 0 || b_inserting)">
                <table class="db_table">
                    <thead>
                        <tr>
                            <th v-for="o_prop in o_model__active.a_o_property" :key="o_prop.s_name">
                                {{ o_prop.s_name }}
                            </th>
                            <th>actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="o_row in a_o_row__data" :key="o_row.n_id">
                            <template v-if="n_id__editing !== o_row.n_id">
                                <td v-for="o_prop in o_model__active.a_o_property" :key="o_prop.s_name"
                                    :title="f_s_display_value(o_prop, o_row[o_prop.s_name])">
                                    {{ f_s_display_value(o_prop, o_row[o_prop.s_name]) }}
                                </td>
                                <td class="db_actions">
                                    <button class="btn__sm" @click="f_db_start_edit(o_row)">edit</button>
                                    <button class="btn__sm danger" @click="f_db_delete_row(o_row)">del</button>
                                </td>
                            </template>
                            <template v-else>
                                <td v-for="o_prop in o_model__active.a_o_property" :key="o_prop.s_name">
                                    <input v-if="o_prop.s_name === 'n_id'" class="cell_input"
                                        :value="o_row.n_id" readonly style="opacity: 0.5" />
                                    <input v-else class="cell_input"
                                        v-model="o_row__editing[o_prop.s_name]" />
                                </td>
                                <td class="db_actions">
                                    <button class="btn__sm confirm" @click="f_db_save_edit">save</button>
                                    <button class="btn__sm" @click="f_db_cancel_edit">cancel</button>
                                </td>
                            </template>
                        </tr>
                        <tr v-if="b_inserting">
                            <td v-for="o_prop in o_model__active.a_o_property" :key="o_prop.s_name">
                                <input v-if="o_prop.s_name === 'n_id'" class="cell_input"
                                    placeholder="auto" style="opacity: 0.5" disabled />
                                <input v-else class="cell_input"
                                    v-model="o_row__insert[o_prop.s_name]" />
                            </td>
                            <td class="db_actions">
                                <button class="btn__sm confirm" @click="f_db_confirm_insert">insert</button>
                                <button class="btn__sm" @click="b_inserting = false">cancel</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="container__db_table" v-else-if="s_name_table__active && !o_model__active">loading...</div>

            <div class="db_toolbar">
                <button v-if="s_name_table__active" class="btn" @click="f_db_start_insert">+ insert row</button>
                <span class="message message__db"
                    :class="{ success: !b_message_db_error, error: b_message_db_error }"
                    v-if="s_message__db">
                    {{ s_message__db }}
                </span>
            </div>
            <div class="db_toolbar">
                <button v-if="s_name_table__active" class="btn" @click="f_db_delete_table_data">delete table data</button>
                <span class="message message__db"
                    :class="{ success: !b_message_db_error, error: b_message_db_error }"
                    v-if="s_message__db">
                    {{ s_message__db }}
                </span>
            </div>
        </div>
    `,
    data: function() {
        return {
            o_state__ws: o_state__ws,
            a_o_model: a_o_model,
            s_name_table__active: null,
            a_o_row__data: [],
            n_id__editing: null,
            o_row__editing: {},
            b_inserting: false,
            o_row__insert: {},
            s_message__db: '',
            b_message_db_error: false,
        };
    },
    computed: {
        o_model__active: function() {
            if (!this.s_name_table__active) return null;
            return f_o_model__from_s_name_table(this.s_name_table__active);
        },
    },
    methods: {
        f_s_name_table__from_o_model: f_s_name_table__from_o_model,

        f_db_load_table: function(s_name_table) {
            this.s_name_table__active = s_name_table;
            this.a_o_row__data = [];
            this.n_id__editing = null;
            this.b_inserting = false;
            f_send({
                s_type: 'crud',
                s_name_crud: 'read',
                s_name_table: s_name_table,
            });
        },

        f_s_display_value: function(o_prop, v_val) {
            if (o_prop.s_type === 'array' && Array.isArray(v_val)) {
                return JSON.stringify(v_val);
            }
            return v_val !== null && v_val !== undefined ? String(v_val) : '';
        },

        f_db_start_edit: function(o_row) {
            this.n_id__editing = o_row.n_id;
            let o_editing = {};
            for (let o_prop of this.o_model__active.a_o_property) {
                if (o_prop.s_name === 'n_id') continue;
                let v_val = o_row[o_prop.s_name];
                if (o_prop.s_type === 'array' && Array.isArray(v_val)) {
                    o_editing[o_prop.s_name] = JSON.stringify(v_val);
                } else {
                    o_editing[o_prop.s_name] = v_val !== null && v_val !== undefined ? String(v_val) : '';
                }
            }
            this.o_row__editing = o_editing;
        },

        f_db_save_edit: function() {
            let v_o_data_update = this.f_o_row__from_input(this.o_row__editing);
            f_send({
                s_type: 'crud',
                s_name_crud: 'update',
                s_name_table: this.s_name_table__active,
                v_o_data: { n_id: this.n_id__editing },
                v_o_data_update: v_o_data_update,
            });
        },

        f_db_cancel_edit: function() {
            this.n_id__editing = null;
        },

        f_db_delete_row: function(o_row) {
            if (!confirm('Delete row n_id=' + o_row.n_id + '?')) return;
            f_send({
                s_type: 'crud',
                s_name_crud: 'delete',
                s_name_table: this.s_name_table__active,
                v_o_data: { n_id: o_row.n_id },
            });
        },

        f_db_delete_table_data: function() {
            f_send({
                s_type: 'delete_table_data',
                s_name_table: this.s_name_table__active,
            });
        },
        f_db_start_insert: function() {
            if (this.b_inserting) return;
            this.b_inserting = true;
            let o_insert = {};
            for (let o_prop of this.o_model__active.a_o_property) {
                if (o_prop.s_name === 'n_id') continue;
                o_insert[o_prop.s_name] = '';
            }
            this.o_row__insert = o_insert;
        },

        f_db_confirm_insert: function() {
            let v_o_data = this.f_o_row__from_input(this.o_row__insert);
            f_send({
                s_type: 'crud',
                s_name_crud: 'create',
                s_name_table: this.s_name_table__active,
                v_o_data: v_o_data,
            });
        },

        f_o_row__from_input: function(o_input) {
            let o_row = {};
            for (let o_prop of this.o_model__active.a_o_property) {
                if (o_prop.s_name === 'n_id') continue;
                let s_val = o_input[o_prop.s_name];
                if (s_val === undefined) continue;
                if (o_prop.s_type === 'number') {
                    o_row[o_prop.s_name] = s_val === '' ? null : Number(s_val);
                } else if (o_prop.s_type === 'boolean') {
                    o_row[o_prop.s_name] = s_val === '' ? 0 : Number(s_val);
                } else if (o_prop.s_type === 'array') {
                    try {
                        o_row[o_prop.s_name] = JSON.parse(s_val);
                    } catch {
                        o_row[o_prop.s_name] = s_val;
                    }
                } else {
                    o_row[o_prop.s_name] = s_val;
                }
            }
            return o_row;
        },

        f_db_message: function(s_text, b_error) {
            this.s_message__db = s_text;
            this.b_message_db_error = b_error;
            let self = this;
            setTimeout(function() { self.s_message__db = ''; }, 3000);
        },

        f_handle_message: function(o_data) {
            if(o_data.s_type === 'delete_table_data'){
                if (o_data.s_error) {
                    this.f_db_message(o_data.s_error, true);
                    return;
                }
                if (o_data.s_name_table === this.s_name_table__active) {
                    this.f_db_message('table data deleted', false);
                    this.f_db_load_table(o_data.s_name_table);
                }
                return;
            }

            if (o_data.s_error) {
                this.f_db_message(o_data.s_error, true);
                return;
            }

            if (o_data.s_name_crud === 'read') {
                if (o_data.s_name_table === this.s_name_table__active) {
                    this.a_o_row__data = o_data.v_result;
                    this.n_id__editing = null;
                    this.b_inserting = false;
                }
            }
            if (o_data.s_name_crud === 'create') {
                this.f_db_message('row inserted', false);
                if (o_data.s_name_table === this.s_name_table__active) {
                    this.b_inserting = false;
                    this.f_db_load_table(o_data.s_name_table);
                }
            }
            if (o_data.s_name_crud === 'update') {
                if (o_data.s_name_table === this.s_name_table__active) {
                    this.f_db_message('row updated', false);
                    this.n_id__editing = null;
                    this.f_db_load_table(o_data.s_name_table);
                }
            }
            if (o_data.s_name_crud === 'delete') {
                this.f_db_message('row deleted', false);
                if (o_data.s_name_table === this.s_name_table__active) {
                    this.f_db_load_table(o_data.s_name_table);
                }
            }
        },
    },
    created: function() {
        this.f_unregister = f_register_handler(this.f_handle_message);
    },
    beforeUnmount: function() {
        if (this.f_unregister) this.f_unregister();
    },
};

export { o_component__page_data };
