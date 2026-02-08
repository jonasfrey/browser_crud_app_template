import { o_state as o_state__ws, f_send, f_register_handler } from './o_service__websocket.js';
import { f_s_name_table__from_o_model, o_model__o_pose_filter } from './constructors.module.js';

let s_name_table__pose_filter = f_s_name_table__from_o_model(o_model__o_pose_filter);

let a_s_keypoint_name = [
    "nose", "left_eye", "right_eye", "left_ear", "right_ear",
    "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
    "left_wrist", "right_wrist", "left_hip", "right_hip",
    "left_knee", "right_knee", "left_ankle", "right_ankle"
];

// pairs of keypoint name connections for drawing skeleton lines
let a_a_s_skeleton_pair = [
    ["nose", "left_eye"], ["nose", "right_eye"],
    ["left_eye", "left_ear"], ["right_eye", "right_ear"],
    ["left_ear", "left_shoulder"], ["right_ear", "right_shoulder"],
    ["left_shoulder", "right_shoulder"],
    ["left_shoulder", "left_elbow"], ["left_elbow", "left_wrist"],
    ["right_shoulder", "right_elbow"], ["right_elbow", "right_wrist"],
    ["left_shoulder", "left_hip"], ["right_shoulder", "right_hip"],
    ["left_hip", "right_hip"],
    ["left_hip", "left_knee"], ["left_knee", "left_ankle"],
    ["right_hip", "right_knee"], ["right_knee", "right_ankle"],
];

let a_s_color__person = [
    '#e94560', '#4ecca3', '#f0c040', '#40a0f0', '#f070d0',
    '#70f0a0', '#a070f0', '#f0a070',
];

let o_component__page_pose_viewer = {
    name: 'page-pose-viewer',
    template: `
        <div class="page__content">
            <div class="pose_filter__panel">
                <div class="pose_filter__panel_header">
                    <strong>Filters</strong>
                    <button class="btn__sm" @click="f_create_filter">+ new</button>
                </div>
                <div v-for="o_filter in a_o_pose_filter" :key="o_filter.n_id" class="pose_filter__item">
                    <div class="pose_filter__header">
                        <span class="indicator" style="cursor: pointer;" @click="f_toggle_expand(o_filter)">
                            {{ o_filter.b_expanded ? 'v' : '>' }}
                        </span>
                        <input class="input pose_filter__name_input"
                            :value="o_filter.s_name"
                            @change="f_save_filter_name(o_filter, $event.target.value)" />
                        <button class="btn__sm"
                            :class="o_filter.b_active ? 'pose_filter__btn_active' : 'pose_filter__btn_inactive'"
                            @click="f_toggle_filter(o_filter)">
                            {{ o_filter.b_active ? 'on' : 'off' }}
                        </button>
                        <button class="btn__sm danger" @click="f_delete_filter(o_filter)">del</button>
                    </div>
                    <div v-show="o_filter.b_expanded" class="pose_filter__editor"
                        :ref="'el_editor_' + o_filter.n_id"></div>
                </div>
            </div>

            <div class="controls">
                <button class="btn" :disabled="!o_state__ws.b_connected || b_loading"
                    @click="f_load_data">
                    {{ b_loading ? 'loading...' : 'Load Images with Poses' }}
                </button>
                <span v-if="a_o_image_data__filtered.length > 0" style="color: #8a8a8a; align-self: center;">
                    {{ n_idx__current + 1 }} / {{ a_o_image_data__filtered.length }}
                    <span v-if="a_o_image_data__filtered.length !== a_o_image_data.length">
                        ({{ a_o_image_data.length }} total)
                    </span>
                    &nbsp; (k: prev / l: next)
                </span>
            </div>
            <div v-if="s_error" class="message error">{{ s_error }}</div>
            <div v-if="a_o_image_data__filtered.length > 0" class="pose_viewer__container">
                <div class="pose_viewer__image_wrap" ref="el_image_wrap">
                    <img ref="el_img"
                        :src="s_src__image"
                        @load="f_on_image_load"
                        style="display: block; max-width: 100%; max-height: 80vh;" />
                    <canvas ref="el_canvas"
                        style="position: absolute; top: 0; left: 0; pointer-events: none;"></canvas>
                </div>
                <div class="pose_viewer__info">
                    <div style="margin-bottom: 8px;">
                        <strong>{{ o_data__current.o_fsnode.s_name }}</strong>
                        &nbsp; {{ o_data__current.o_image.n_scl_x }}x{{ o_data__current.o_image.n_scl_y }}
                    </div>
                    <div style="margin-bottom: 8px;">
                        {{ o_data__current.a_o_pose.length }} person(s) detected
                    </div>
                    <div v-for="(o_pose, n_idx_pose) in o_data__current.a_o_pose" :key="o_pose.n_id"
                        style="margin-bottom: 12px; padding: 6px; background: #16213e; border-left: 3px solid;"
                        :style="{ borderColor: a_s_color__person[n_idx_pose % a_s_color__person.length] }">
                        <div style="margin-bottom: 4px;"><strong>Person {{ n_idx_pose }}</strong></div>
                        <div v-for="o_kp in o_pose.a_o_posekeypoint" :key="o_kp.n_id"
                            style="font-size: 11px; color: #8a8a8a;">
                            {{ o_kp.s_name }}: ({{ o_kp.n_trn_x.toFixed(1) }}, {{ o_kp.n_trn_y.toFixed(1) }}) conf: {{ o_kp.n_confidence.toFixed(2) }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data: function() {
        return {
            o_state__ws: o_state__ws,
            a_o_image_data: [],
            n_idx__current: 0,
            b_loading: false,
            s_error: '',
            a_s_color__person: a_s_color__person,
            a_o_pose_filter: [],
        };
    },
    computed: {
        a_o_image_data__filtered: function() {
            let a_f_b_show = this.a_o_pose_filter.filter(
                o=>{
                    return o.b_active
                }
            ).map(o=>{
                return new Function(`return ${o.s_f_b_show}`)();
                // return new Function('o_image', 'o_fsnode', 'a_o_pose', o.s_f_b_show);
            })
            let a_o_image_filtered = this.a_o_image_data.filter(o_image=>{
                for(let f_b_show of a_f_b_show){
                    let b = f_b_show(o_image.o_image, o_image.o_fsnode, o_image.a_o_pose);
                    if(!b) return false;
                }
                return true;
            })
            return a_o_image_filtered
        },
        o_data__current: function() {
            return this.a_o_image_data__filtered[this.n_idx__current] || null;
        },
        s_src__image: function() {
            if (!this.o_data__current) return '';
            return '/api/image?path=' + encodeURIComponent(this.o_data__current.o_fsnode.s_path_absolute);
        },
    },
    methods: {
        f_load_data: function() {
            this.b_loading = true;
            this.s_error = '';
            f_send({ s_type: 'f_a_o_image__with_pose' });
        },
        f_handle_message: function(o_data) {
            if (o_data.s_type === 'f_a_o_image__with_pose') {
                this.b_loading = false;
                if (o_data.s_error) {
                    this.s_error = o_data.s_error;
                    return;
                }
                this.a_o_image_data = o_data.a_o_image_data || [];
                this.n_idx__current = 0;
            }
            if (o_data.s_type === 'crud' && o_data.s_name_table === s_name_table__pose_filter) {
                if (o_data.s_name_crud === 'read') {
                    let a_o_filter = o_data.v_result || [];
                    for (let o_filter of a_o_filter) {
                        o_filter.b_expanded = false;
                        o_filter.o_editor = null;
                    }
                    this.a_o_pose_filter = a_o_filter;
                }
                if (o_data.s_name_crud === 'create' || o_data.s_name_crud === 'delete') {
                    this.f_load_filter();
                }
            }
        },
        f_on_image_load: function() {
            this.f_draw_skeleton();
        },
        f_navigate: function(n_direction) {
            if (this.a_o_image_data__filtered.length === 0) return;
            let n_next = this.n_idx__current + n_direction;
            if (n_next < 0) n_next = this.a_o_image_data__filtered.length - 1;
            if (n_next >= this.a_o_image_data__filtered.length) n_next = 0;
            this.n_idx__current = n_next;
        },
        f_draw_skeleton: function() {
            let el_canvas = this.$refs.el_canvas;
            let el_img = this.$refs.el_img;
            if (!el_canvas || !el_img) return;

            let n_scl_x__display = el_img.clientWidth;
            let n_scl_y__display = el_img.clientHeight;
            el_canvas.width = n_scl_x__display;
            el_canvas.height = n_scl_y__display;

            let o_data = this.o_data__current;
            if (!o_data) return;

            let n_scl_x__original = o_data.o_image.n_scl_x;
            let n_scl_y__original = o_data.o_image.n_scl_y;
            let n_ratio_x = n_scl_x__display / n_scl_x__original;
            let n_ratio_y = n_scl_y__display / n_scl_y__original;

            let o_ctx = el_canvas.getContext('2d');
            o_ctx.clearRect(0, 0, n_scl_x__display, n_scl_y__display);

            for (let n_idx_pose = 0; n_idx_pose < o_data.a_o_pose.length; n_idx_pose++) {
                let o_pose = o_data.a_o_pose[n_idx_pose];
                let s_color = a_s_color__person[n_idx_pose % a_s_color__person.length];

                // build lookup: keypoint name -> {x, y, confidence}
                let o_kp_by_name = {};
                for (let o_kp of o_pose.a_o_posekeypoint) {
                    o_kp_by_name[o_kp.s_name] = o_kp;
                }

                // draw lines
                o_ctx.strokeStyle = s_color;
                o_ctx.lineWidth = 2;
                for (let a_s_pair of a_a_s_skeleton_pair) {
                    let o_kp_a = o_kp_by_name[a_s_pair[0]];
                    let o_kp_b = o_kp_by_name[a_s_pair[1]];
                    if (!o_kp_a || !o_kp_b) continue;
                    if (o_kp_a.n_confidence < 0.3 || o_kp_b.n_confidence < 0.3) continue;
                    o_ctx.beginPath();
                    o_ctx.moveTo(o_kp_a.n_trn_x * n_ratio_x, o_kp_a.n_trn_y * n_ratio_y);
                    o_ctx.lineTo(o_kp_b.n_trn_x * n_ratio_x, o_kp_b.n_trn_y * n_ratio_y);
                    o_ctx.stroke();
                }

                // draw keypoint dots and names
                o_ctx.fillStyle = s_color;
                o_ctx.font = '11px monospace';
                for (let o_kp of o_pose.a_o_posekeypoint) {
                    if (o_kp.n_confidence < 0.3) continue;
                    let n_x = o_kp.n_trn_x * n_ratio_x;
                    let n_y = o_kp.n_trn_y * n_ratio_y;
                    o_ctx.beginPath();
                    o_ctx.arc(n_x, n_y, 4, 0, Math.PI * 2);
                    o_ctx.fill();
                    o_ctx.fillText(o_kp.s_name, n_x + 6, n_y + 4);
                }
            }
        },
        f_on_keydown: function(o_evt) {
            if (o_evt.key === 'l') this.f_navigate(1);
            if (o_evt.key === 'k') this.f_navigate(-1);
        },
        // filter methods
        f_load_filter: function() {
            f_send({
                s_type: 'crud',
                s_name_crud: 'read',
                s_name_table: s_name_table__pose_filter,
            });
        },
        f_create_filter: function() {
            f_send({
                s_type: 'crud',
                s_name_crud: 'create',
                s_name_table: s_name_table__pose_filter,
                v_o_data: {
                    s_name: 'new filter',
                    s_f_b_show: 'return true',
                    b_active: 0,
                },
            });
        },
        f_delete_filter: function(o_filter) {
            if (o_filter.o_editor) {
                o_filter.o_editor.dispose();
                o_filter.o_editor = null;
            }
            f_send({
                s_type: 'crud',
                s_name_crud: 'delete',
                s_name_table: s_name_table__pose_filter,
                v_o_data: { n_id: o_filter.n_id },
            });
        },
        f_toggle_filter: function(o_filter) {
            let n_b_active__new = o_filter.b_active ? 0 : 1;
            o_filter.b_active = n_b_active__new;
            f_send({
                s_type: 'crud',
                s_name_crud: 'update',
                s_name_table: s_name_table__pose_filter,
                v_o_data: { n_id: o_filter.n_id },
                v_o_data_update: { b_active: n_b_active__new },
            });
            this.n_idx__current = 0;
        },
        f_toggle_expand: async function(o_filter) {
            o_filter.b_expanded = !o_filter.b_expanded;
            if (o_filter.b_expanded && !o_filter.o_editor) {
                let o_monaco = await globalThis.o_promise__monaco;
                await this.$nextTick();
                let a_el = this.$refs['el_editor_' + o_filter.n_id];
                let el_container = Array.isArray(a_el) ? a_el[0] : a_el;
                if (!el_container) return;
                let o_editor = o_monaco.editor.create(el_container, {
                    value: o_filter.s_f_b_show || '',
                    language: 'javascript',
                    theme: 'vs-dark',
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    fontSize: 13,
                    fontFamily: 'monospace',
                    automaticLayout: true,
                });
                o_filter.o_editor = o_editor;
                let n_id__timeout = null;
                o_editor.onDidChangeModelContent(function() {
                    if (n_id__timeout) clearTimeout(n_id__timeout);
                    n_id__timeout = setTimeout(function() {
                        let s_f_b_show = o_editor.getValue();
                        o_filter.s_f_b_show = s_f_b_show;
                        f_send({
                            s_type: 'crud',
                            s_name_crud: 'update',
                            s_name_table: s_name_table__pose_filter,
                            v_o_data: { n_id: o_filter.n_id },
                            v_o_data_update: { s_f_b_show: s_f_b_show },
                        });
                    }, 500);
                });
            } else if (!o_filter.b_expanded && o_filter.o_editor) {
                o_filter.o_editor.dispose();
                o_filter.o_editor = null;
            }
        },
        f_save_filter_name: function(o_filter, s_name) {
            o_filter.s_name = s_name;
            f_send({
                s_type: 'crud',
                s_name_crud: 'update',
                s_name_table: s_name_table__pose_filter,
                v_o_data: { n_id: o_filter.n_id },
                v_o_data_update: { s_name: s_name },
            });
        },
    },
    watch: {
        n_idx__current: function() {
            // skeleton redrawn on image load via f_on_image_load
        },
    },
    created: function() {
        this.f_unregister = f_register_handler(this.f_handle_message);
        this.f_load_filter();
    },
    mounted: function() {
        window.addEventListener('keydown', this.f_on_keydown);
    },
    beforeUnmount: function() {
        if (this.f_unregister) this.f_unregister();
        window.removeEventListener('keydown', this.f_on_keydown);
        for (let o_filter of this.a_o_pose_filter) {
            if (o_filter.o_editor) {
                o_filter.o_editor.dispose();
                o_filter.o_editor = null;
            }
        }
    },
};

export { o_component__page_pose_viewer };
