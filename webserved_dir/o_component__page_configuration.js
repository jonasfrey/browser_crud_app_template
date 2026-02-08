import { o_state as o_state__ws, f_send, f_register_handler } from './o_service__websocket.js';
import {
    o_model__o_config,
    f_s_name_table__from_o_model,
} from './constructors.module.js';

let s_name_table__config = f_s_name_table__from_o_model(o_model__o_config);

let o_component__page_configuration = {
    name: 'page-configuration',
    template: `
        <div class="page__content">
            <div class="form_group">
                <label>s_path_last_opened</label>
                <input type="text" class="input" placeholder="/path/to/last/opened"
                    v-model="s_path_last_opened" />
            </div>
            <button class="btn" :disabled="!o_state__ws.b_connected"
                @click="f_config_save">save</button>
            <div class="message"
                :class="{ success: !b_message_config_error, error: b_message_config_error }"
                v-if="s_message__config">
                {{ s_message__config }}
            </div>
        </div>
    `,
    data: function() {
        return {
            o_state__ws: o_state__ws,
            s_path_last_opened: '',
            s_message__config: '',
            b_message_config_error: false,
        };
    },
    methods: {
        f_config_read: function() {
            f_send({
                s_type: 'crud',
                s_name_crud: 'read',
                s_name_table: s_name_table__config,
            });
        },

        f_config_populate: function(o_config) {
            if (!o_config) return;
            this.s_path_last_opened = o_config.s_path_last_opened || '';
        },

        f_config_save: function() {
            f_send({
                s_type: 'crud',
                s_name_crud: 'update',
                s_name_table: s_name_table__config,
                v_o_data: { n_id: 1 },
                v_o_data_update: {
                    s_path_last_opened: this.s_path_last_opened.trim(),
                },
            });
        },

        f_config_message: function(s_text, b_error) {
            this.s_message__config = s_text;
            this.b_message_config_error = b_error;
            let self = this;
            setTimeout(function() { self.s_message__config = ''; }, 3000);
        },

        f_handle_message: function(o_data) {
            if (o_data.s_type !== 'crud') return;
            if (o_data.s_name_table !== s_name_table__config) return;

            if (o_data.s_error) {
                this.f_config_message(o_data.s_error, true);
                return;
            }

            if (o_data.s_name_crud === 'read') {
                this.f_config_populate(o_data.v_result[0] || null);
            }
            if (o_data.s_name_crud === 'update') {
                this.f_config_populate(o_data.v_result);
                this.f_config_message('configuration saved', false);
            }
        },
    },
    created: function() {
        this.f_unregister = f_register_handler(this.f_handle_message);
    },
    activated: function() {
        this.f_config_read();
    },
    beforeUnmount: function() {
        if (this.f_unregister) this.f_unregister();
    },
};

export { o_component__page_configuration };
