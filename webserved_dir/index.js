import { createApp, reactive } from 'vue';
import { o_router } from './o_router.js';
import { o_state as o_state__ws, f_connect, f_register_handler } from './o_service__websocket.js';
import { a_o_model, f_s_name_table__from_o_model } from './constructors.module.js';

let o_state__dbdata = reactive({
    b_loaded: false,
});
for (let o_model of a_o_model) {
    let s_name_table = f_s_name_table__from_o_model(o_model);
    o_state__dbdata[s_name_table] = [];
}

f_register_handler(function(o_data) {
    if (o_data.s_type === 'crud' && o_data.s_name_table in o_state__dbdata) {
        o_state__dbdata[o_data.s_name_table] = o_data.v_result || [];
        if (o_data.s_name_table === 'a_o_config') {
            o_state__dbdata.b_loaded = true;
        }
    }
});

globalThis.o_state__dbdata = o_state__dbdata;

let o_app = createApp({
    data: function() {
        return {
            o_state__ws: o_state__ws,
            o_state__dbdata: o_state__dbdata,
            a_o_page: [
                { s_key: 'analyze_file', s_label: 'Analyze Files' },
                { s_key: 'data', s_label: 'Data' },
                { s_key: 'configuration', s_label: 'Configuration' },
                { s_key: 'pose_viewer', s_label: 'Pose Viewer' },
            ],

        };
    },
    template: `
        <nav>
            <router-link v-for="o_page in a_o_page" :key="o_page.s_key"
                :to="'/' + o_page.s_key"
                custom
                v-slot="{ navigate, isActive }">
                <button class="nav_item" :class="{ active: isActive }"
                    @click="navigate">
                    {{ o_page.s_label }}
                </button>
            </router-link>
        </nav>

        <router-view v-if="o_state__dbdata.b_loaded" v-slot="{ Component }">
            <keep-alive>
                <component :is="Component"></component>
            </keep-alive>
        </router-view>
        <div v-else>loading config...</div>

        <div id="el_status">{{ o_state__ws.s_status }}</div>
    `,
    mounted: function() {
        f_connect();
    },
});
globalThis.o_app = o_app;
o_app.use(o_router);
o_app.mount('#app');
