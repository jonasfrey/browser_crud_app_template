import { o_state as o_state__ws, f_send, f_register_handler } from './o_service__websocket.js';
import { f_s_name_table__from_o_model, o_model__o_image_postprocessor } from './constructors.module.js';

let s_name_table__image_postprocessor = f_s_name_table__from_o_model(o_model__o_image_postprocessor);

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

let o_component__page_image_viewer = {
    name: 'page-image-viewer',
    template: `
        <div class="page__content">
            <div class="image_filter__panel">
                <div class="image_filter__panel_header">
                    <strong>Filters</strong>
                    <button class="btn__sm" @click="f_create_filter">+ new</button>
                </div>
                <div v-for="o_filter in a_o_image_postprocessor__filter" :key="o_filter.n_id" class="image_filter__item">
                    <div class="image_filter__header">
                        <span class="indicator" style="cursor: pointer;" @click="f_toggle_expand(o_filter)">
                            {{ o_filter.b_expanded ? 'v' : '>' }}
                        </span>
                        <input class="input image_filter__name_input"
                            :value="o_filter.s_name"
                            @change="f_save_filter_name(o_filter, $event.target.value)" />
                        <button class="btn__sm"
                            :class="o_filter.b_active ? 'image_filter__btn_active' : 'image_filter__btn_inactive'"
                            @click="f_toggle_filter(o_filter)">
                            {{ o_filter.b_active ? 'on' : 'off' }}
                        </button>
                        <button class="btn__sm danger" @click="f_delete_postprocessor(o_filter)">del</button>
                    </div>
                    <div v-show="o_filter.b_expanded" class="image_filter__editor"
                        :ref="'el_editor_' + o_filter.n_id"></div>
                </div>
            </div>

            <div class="image_filter__panel">
                <div class="image_filter__panel_header">
                    <strong>Postprocessors</strong>
                    <button class="btn__sm" @click="f_create_postprocessor">+ new</button>
                </div>
                <div v-for="o_pp in a_o_image_postprocessor__postprocessor" :key="o_pp.n_id" class="image_filter__item">
                    <div class="image_filter__header">
                        <span class="indicator" style="cursor: pointer;" @click="f_toggle_expand(o_pp)">
                            {{ o_pp.b_expanded ? 'v' : '>' }}
                        </span>
                        <input class="input image_filter__name_input"
                            :value="o_pp.s_name"
                            @change="f_save_filter_name(o_pp, $event.target.value)" />
                        <button class="btn__sm" @click="f_execute_postprocessor(o_pp)"
                            :disabled="b_executing">
                            {{ b_executing ? 'running...' : 'execute' }}
                        </button>
                        <button class="btn__sm danger" @click="f_delete_postprocessor(o_pp)">del</button>
                    </div>
                    <div v-show="o_pp.b_expanded" class="image_filter__editor"
                        :ref="'el_editor_' + o_pp.n_id"></div>
                </div>
                <div v-if="s_result__postprocessor" class="message">{{ s_result__postprocessor }}</div>
            </div>

            <div class="controls">
                <button class="btn" :disabled="!o_state__ws.b_connected || b_loading"
                    @click="f_load_data">
                    {{ b_loading ? 'loading...' : 'Load Images with Poses' }}
                </button>
                <span v-if="a_o_image__filtered.length > 0" style="color: #8a8a8a; align-self: center;">
                    {{ n_idx__current + 1 }} / {{ a_o_image__filtered.length }}
                    <span v-if="a_o_image__filtered.length !== a_o_image.length">
                        ({{ a_o_image.length }} total)
                    </span>
                    &nbsp; (k: prev / l: next)
                </span>
                <button class="btn__sm"
                    :class="b_show__pose_line ? 'image_filter__btn_active' : 'image_filter__btn_inactive'"
                    @click="b_show__pose_line = !b_show__pose_line">pose lines</button>
                <button class="btn__sm"
                    :class="b_show__pose_keypoint_label ? 'image_filter__btn_active' : 'image_filter__btn_inactive'"
                    @click="b_show__pose_keypoint_label = !b_show__pose_keypoint_label">keypoint labels</button>
                <button class="btn__sm"
                    :class="b_show__image_area ? 'image_filter__btn_active' : 'image_filter__btn_inactive'"
                    @click="b_show__image_area = !b_show__image_area">image areas</button>
            </div>
            <div v-if="s_error" class="message error">{{ s_error }}</div>
            <div v-if="b_loaded_once && a_o_image.length === 0" class="message" style="margin-bottom: 12px;">
                No analyzed images found. Go to 'Analyze Files' to scan a directory and run pose estimation first.
            </div>
            <div v-if="b_loaded_once && a_o_image.length > 0" style="color: #8a8a8a; font-size: 12px; margin-bottom: 8px;">
                {{ a_o_image.length }} analyzed image(s) in database
            </div>
            <div v-if="a_o_image.length > n_sz__range" class="image_viewer__range_selector">
                <span style="color: #8a8a8a; font-size: 12px; margin-right: 8px;">Range:</span>
                <button v-for="n_idx in n_cnt__range" :key="n_idx"
                    class="btn__sm"
                    :class="(n_idx - 1) === n_idx__range ? 'image_filter__btn_active' : 'image_filter__btn_inactive'"
                    @click="n_idx__range = n_idx - 1; n_idx__current = 0;"
                    style="margin-right: 4px;">
                    {{ (n_idx - 1) * n_sz__range }}-{{ Math.min(n_idx * n_sz__range, a_o_image.length) - 1 }}
                </button>
            </div>
            <div v-if="a_o_image__filtered.length > 0" class="image_viewer__container">
                <div class="image_viewer__image_wrap" ref="el_image_wrap">
                    <img ref="el_img"
                        :src="s_src__image"
                        @load="f_on_image_load"
                        style="display: block; max-width: 100%; max-height: 80vh;" />
                    <canvas ref="el_canvas"
                        style="position: absolute; top: 0; left: 0; pointer-events: none;"></canvas>
                </div>
                <div class="image_viewer__info">
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
            a_o_image: [],
            n_sz__range: 100,
            n_idx__range: 0,
            n_idx__current: 0,
            b_loading: false,
            b_loaded_once: false,
            s_error: '',
            a_s_color__person: a_s_color__person,
            a_o_image_postprocessor: [],
            b_show__pose_line: true,
            b_show__pose_keypoint_label: true,
            b_show__image_area: false,
            b_executing: false,
            s_result__postprocessor: '',
        };
    },
    computed: {
        a_o_image_postprocessor__filter: function() {
            return this.a_o_image_postprocessor.filter(function(o){ return o.b_filter; });
        },
        a_o_image_postprocessor__postprocessor: function() {
            return this.a_o_image_postprocessor.filter(function(o){ return !o.b_filter; });
        },
        n_cnt__range: function() {
            return Math.ceil(this.a_o_image.length / this.n_sz__range) || 1;
        },
        a_o_image__ranged: function() {
            let n_idx__start = this.n_idx__range * this.n_sz__range;
            let n_idx__end = n_idx__start + this.n_sz__range;
            return this.a_o_image.slice(n_idx__start, n_idx__end);
        },
        a_o_image__filtered: function() {
            let a_f_b_show = this.a_o_image_postprocessor.filter(function(o){
                return o.b_active && o.b_filter;
            }).map(function(o){
                return new Function('return ' + o.s_f_b_show)();
            });
            let s_root_dir = globalThis.s_root_dir || '';
            let a_o_image__filtered = this.a_o_image__ranged.filter(function(o_image){
                for(let f_b_show of a_f_b_show){
                    let b = f_b_show(o_image.o_image, o_image.o_fsnode, o_image.a_o_pose, s_root_dir);
                    if(!b) return false;
                }
                return true;
            });
            return a_o_image__filtered;
        },
        o_data__current: function() {
            return this.a_o_image__filtered[this.n_idx__current] || null;
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
                this.a_o_image = o_data.a_o_image || [];
                this.n_idx__range = 0;
                this.n_idx__current = 0;
                this.b_loaded_once = true;
            }
            if (o_data.s_type === 'crud' && o_data.s_name_table === s_name_table__image_postprocessor) {
                if (o_data.s_name_crud === 'read') {
                    let a_o_pp = o_data.v_result || [];
                    for (let o_pp of a_o_pp) {
                        o_pp.b_expanded = false;
                        o_pp.o_editor = null;
                    }
                    this.a_o_image_postprocessor = a_o_pp;
                }
                if (o_data.s_name_crud === 'create' || o_data.s_name_crud === 'delete') {
                    this.f_load_postprocessor();
                }
            }
        },
        f_on_image_load: function() {
            this.f_draw_overlay();
        },
        f_navigate: function(n_direction) {
            if (this.a_o_image__filtered.length === 0) return;
            let n_next = this.n_idx__current + n_direction;
            if (n_next < 0) n_next = this.a_o_image__filtered.length - 1;
            if (n_next >= this.a_o_image__filtered.length) n_next = 0;
            this.n_idx__current = n_next;
        },
        f_draw_overlay: function() {
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

            // draw pose skeleton
            for (let n_idx_pose = 0; n_idx_pose < o_data.a_o_pose.length; n_idx_pose++) {
                let o_pose = o_data.a_o_pose[n_idx_pose];
                let s_color = a_s_color__person[n_idx_pose % a_s_color__person.length];

                // build lookup: keypoint name -> {x, y, confidence}
                let o_kp_by_name = {};
                for (let o_kp of o_pose.a_o_posekeypoint) {
                    o_kp_by_name[o_kp.s_name] = o_kp;
                }

                // draw lines
                if (this.b_show__pose_line) {
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
                }

                // draw keypoint dots and names
                if (this.b_show__pose_line || this.b_show__pose_keypoint_label) {
                    o_ctx.fillStyle = s_color;
                    o_ctx.font = '11px monospace';
                    for (let o_kp of o_pose.a_o_posekeypoint) {
                        if (o_kp.n_confidence < 0.3) continue;
                        let n_x = o_kp.n_trn_x * n_ratio_x;
                        let n_y = o_kp.n_trn_y * n_ratio_y;
                        if (this.b_show__pose_line) {
                            o_ctx.beginPath();
                            o_ctx.arc(n_x, n_y, 4, 0, Math.PI * 2);
                            o_ctx.fill();
                        }
                        if (this.b_show__pose_keypoint_label) {
                            o_ctx.fillText(o_kp.s_name, n_x + 6, n_y + 4);
                        }
                    }
                }
            }

            // draw image areas (placeholder for YOLO)
            if (this.b_show__image_area && o_data.a_o_image_area) {
                o_ctx.strokeStyle = '#f0c040';
                o_ctx.lineWidth = 2;
                o_ctx.font = '12px monospace';
                o_ctx.fillStyle = '#f0c040';
                for (let o_area of o_data.a_o_image_area) {
                    let n_x = o_area.n_trn_x * n_ratio_x;
                    let n_y = o_area.n_trn_y * n_ratio_y;
                    let n_w = o_area.n_scl_x * n_ratio_x;
                    let n_h = o_area.n_scl_y * n_ratio_y;
                    o_ctx.strokeRect(n_x, n_y, n_w, n_h);
                    let s_label = (o_area.a_s_label || []).join(', ');
                    if (s_label) {
                        o_ctx.fillText(s_label, n_x, n_y - 4);
                    }
                }
            }
        },
        f_on_keydown: function(o_evt) {
            if (o_evt.key === 'l') this.f_navigate(1);
            if (o_evt.key === 'k') this.f_navigate(-1);
        },
        // postprocessor/filter CRUD methods
        f_load_postprocessor: function() {
            f_send({
                s_type: 'crud',
                s_name_crud: 'read',
                s_name_table: s_name_table__image_postprocessor,
            });
        },
        f_create_filter: function() {
            f_send({
                s_type: 'crud',
                s_name_crud: 'create',
                s_name_table: s_name_table__image_postprocessor,
                v_o_data: {
                    s_name: 'new filter',
                    s_f_b_show: '(o_image, o_fsnode, a_o_pose, s_root_dir)=>{ return true }',
                    b_active: 0,
                    b_filter: 1,
                },
            });
        },
        f_create_postprocessor: function() {
            f_send({
                s_type: 'crud',
                s_name_crud: 'create',
                s_name_table: s_name_table__image_postprocessor,
                v_o_data: {
                    s_name: 'new postprocessor',
                    s_f_b_show: 'async (o_image, o_fsnode, a_o_pose, s_root_dir)=>{\n    \n}',
                    b_active: 0,
                    b_filter: 0,
                },
            });
        },
        f_delete_postprocessor: function(o_pp) {
            if (o_pp.o_editor) {
                o_pp.o_editor.dispose();
                o_pp.o_editor = null;
            }
            f_send({
                s_type: 'crud',
                s_name_crud: 'delete',
                s_name_table: s_name_table__image_postprocessor,
                v_o_data: { n_id: o_pp.n_id },
            });
        },
        f_toggle_filter: function(o_filter) {
            let n_b_active__new = o_filter.b_active ? 0 : 1;
            o_filter.b_active = n_b_active__new;
            f_send({
                s_type: 'crud',
                s_name_crud: 'update',
                s_name_table: s_name_table__image_postprocessor,
                v_o_data: { n_id: o_filter.n_id },
                v_o_data_update: { b_active: n_b_active__new },
            });
            this.n_idx__current = 0;
        },
        f_toggle_expand: async function(o_pp) {
            o_pp.b_expanded = !o_pp.b_expanded;
            if (o_pp.b_expanded && !o_pp.o_editor) {
                let o_monaco = await globalThis.o_promise__monaco;
                await this.$nextTick();
                let a_el = this.$refs['el_editor_' + o_pp.n_id];
                let el_container = Array.isArray(a_el) ? a_el[0] : a_el;
                if (!el_container) return;
                let o_editor = o_monaco.editor.create(el_container, {
                    value: o_pp.s_f_b_show || '',
                    language: 'javascript',
                    theme: 'vs-dark',
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    fontSize: 13,
                    fontFamily: 'monospace',
                    automaticLayout: true,
                });
                o_pp.o_editor = o_editor;
                let n_id__timeout = null;
                o_editor.onDidChangeModelContent(function() {
                    if (n_id__timeout) clearTimeout(n_id__timeout);
                    n_id__timeout = setTimeout(function() {
                        let s_f_b_show = o_editor.getValue();
                        o_pp.s_f_b_show = s_f_b_show;
                        f_send({
                            s_type: 'crud',
                            s_name_crud: 'update',
                            s_name_table: s_name_table__image_postprocessor,
                            v_o_data: { n_id: o_pp.n_id },
                            v_o_data_update: { s_f_b_show: s_f_b_show },
                        });
                    }, 500);
                });
            } else if (!o_pp.b_expanded && o_pp.o_editor) {
                o_pp.o_editor.dispose();
                o_pp.o_editor = null;
            }
        },
        f_save_filter_name: function(o_pp, s_name) {
            o_pp.s_name = s_name;
            f_send({
                s_type: 'crud',
                s_name_crud: 'update',
                s_name_table: s_name_table__image_postprocessor,
                v_o_data: { n_id: o_pp.n_id },
                v_o_data_update: { s_name: s_name },
            });
        },
        f_execute_postprocessor: async function(o_pp) {
            this.b_executing = true;
            this.s_result__postprocessor = '';
            let a_o = this.a_o_image__filtered;
            let n_len = a_o.length;
            let n_done = 0;
            let n_error = 0;
            let s_root_dir = globalThis.s_root_dir || '';
            try {
                let f_pp = new Function('return ' + o_pp.s_f_b_show)();
                for (let n_idx = 0; n_idx < n_len; n_idx++) {
                    let o = a_o[n_idx];
                    this.s_result__postprocessor = 'executing: ' + (n_idx + 1) + '/' + n_len;
                    try {
                        await f_pp(o.o_image, o.o_fsnode, o.a_o_pose, s_root_dir);
                        n_done++;
                    } catch (o_err) {
                        n_error++;
                        console.error('postprocessor error on image ' + (n_idx + 1) + ':', o_err);
                    }
                }
                this.s_result__postprocessor = 'done: ' + n_done + ' processed, ' + n_error + ' error(s)';
            } catch (o_err) {
                this.s_result__postprocessor = 'error: ' + o_err.message;
            }
            this.b_executing = false;
        },
    },
    watch: {
        b_show__pose_line: function() { this.f_draw_overlay(); },
        b_show__pose_keypoint_label: function() { this.f_draw_overlay(); },
        b_show__image_area: function() { this.f_draw_overlay(); },
        n_idx__current: function() {
            // overlay redrawn on image load via f_on_image_load
        },
    },
    created: function() {
        this.f_unregister = f_register_handler(this.f_handle_message);
        this.f_load_postprocessor();
    },
    mounted: function() {
        window.addEventListener('keydown', this.f_on_keydown);
    },
    beforeUnmount: function() {
        if (this.f_unregister) this.f_unregister();
        window.removeEventListener('keydown', this.f_on_keydown);
        for (let o_pp of this.a_o_image_postprocessor) {
            if (o_pp.o_editor) {
                o_pp.o_editor.dispose();
                o_pp.o_editor = null;
            }
        }
    },
};

export { o_component__page_image_viewer };
