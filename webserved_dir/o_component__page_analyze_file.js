import { o_state as o_state__ws, f_send, f_register_handler } from './o_service__websocket.js';
import { o_component__file_tree } from './o_component__file_tree.js';

// collect n_id of all currently expanded folders into a Set
let f_o_set__expanded = function(a_o_fsnode) {
    let o_set = new Set();
    for (let o_fsnode of a_o_fsnode) {
        if (o_fsnode.b_folder && o_fsnode.b_expanded) {
            o_set.add(o_fsnode.n_id);
        }
        if (o_fsnode.a_o_fsnode) {
            for (let n_id of f_o_set__expanded(o_fsnode.a_o_fsnode)) {
                o_set.add(n_id);
            }
        }
    }
    return o_set;
};

let f_add_b_expanded = function(a_o_fsnode, o_set__expanded) {
    for (let o_fsnode of a_o_fsnode) {
        if (o_fsnode.b_folder) {
            o_fsnode.b_expanded = o_set__expanded ? o_set__expanded.has(o_fsnode.n_id) : false;
            if (o_fsnode.a_o_fsnode) {
                f_add_b_expanded(o_fsnode.a_o_fsnode, o_set__expanded);
            }
        }
    }
};

// recursively collect all o_image__fromdb objects from the tree, including s_path_absolute from the fsnode
let f_a_o_image__from_a_o_fsnode = function(a_o_fsnode) {
    let a_o_image = [];
    for (let o_fsnode of a_o_fsnode) {
        if (o_fsnode.b_image && o_fsnode.o_image__fromdb) {
            let o_image = Object.assign({}, o_fsnode.o_image__fromdb);
            o_image.s_path_absolute = o_fsnode.s_path_absolute;
            a_o_image.push(o_image);
        }
        if (o_fsnode.a_o_fsnode) {
            a_o_image = a_o_image.concat(f_a_o_image__from_a_o_fsnode(o_fsnode.a_o_fsnode));
        }
    }
    return a_o_image;
};

let o_component__page_analyze_file = {
    name: 'page-analyze-file',
    components: {
        'file-tree': o_component__file_tree,
    },
    template: `
        <div class="page__content">
            <div class="controls">
                <input type="text" class="input" placeholder="/path/to/directory"
                    v-model="s_path" @keydown.enter="f_scan_directory" />
                <button class="btn" :disabled="!o_state__ws.b_connected || b_loading__tree"
                    @click="f_scan_directory">
                    {{ b_loading__tree ? 'scanning...' : 'Scan Directory' }}
                </button>
                <button class="btn" :disabled="!o_state__ws.b_connected || a_o_fsnode.length === 0 || b_loading__pose"
                    @click="f_run_pose_estimation">
                    {{ b_loading__pose ? 'estimating poses...' : 'Run Pose Estimation' }}
                </button>
            </div>
            <div v-if="s_error__pose" class="message error">{{ s_error__pose }}</div>
            <div v-if="s_result__pose" class="message">{{ s_result__pose }}</div>
            <div v-if="b_loading__pose && s_progress__pose" class="progress">{{ s_progress__pose }}</div>
            <div v-if="s_error__tree" class="message error">{{ s_error__tree }}</div>
            <div v-else-if="b_loading__tree" class="container__tree">
                <div>loading...</div>
                <div v-if="s_progress__tree" class="progress">{{ s_progress__tree }}</div>
            </div>
            <template v-else-if="a_o_fsnode.length > 0">
                <div v-for="o_fsnode in a_o_fsnode" :key="o_fsnode.n_id" class="container__tree" style="margin-bottom: 10px;">
                    <div class="container__tree_header">
                        <span style="color: #8a8a8a; font-size: 12px;">{{ o_fsnode.s_path_absolute }}</span>
                        <button class="btn__sm danger" @click="f_delete_fsnode(o_fsnode.n_id)">x</button>
                    </div>
                    <file-tree
                        :a_o_fsnode="o_fsnode.b_folder && o_fsnode.a_o_fsnode ? o_fsnode.a_o_fsnode : [o_fsnode]"
                        :n_depth="0"
                        @delete="f_delete_fsnode"></file-tree>
                </div>
            </template>
            <div v-else class="container__tree">
                <div class="message" style="color: #8a8a8a;">
                    No files in database. Enter a directory path and click 'Scan Directory' to analyze files.
                </div>
            </div>
        </div>
    `,
    data: function() {
        return {
            o_state__ws: o_state__ws,
            s_path: (o_state__dbdata.a_o_config[0]?.s_path_last_opened) || '',
            a_o_fsnode: [],
            s_error__tree: '',
            b_loading__tree: false,
            b_loading__pose: false,
            s_error__pose: '',
            s_result__pose: '',
            s_progress__tree: '',
            s_progress__pose: '',
        };
    },
    methods: {
        f_load_from_db: function() {
            f_send({ s_type: 'f_a_o_fsnode__from_db' });
        },
        f_scan_directory: function() {
            let s_path = this.s_path.trim();
            if (s_path.length === 0) return;
            this.b_loading__tree = true;
            this.s_error__tree = '';
            this.a_o_fsnode = [];
            f_send({ s_type: 'f_a_o_fsnode', s_path: s_path });
        },
        f_run_pose_estimation: function() {
            let a_o_image = f_a_o_image__from_a_o_fsnode(this.a_o_fsnode);
            if (a_o_image.length === 0) return;
            this.b_loading__pose = true;
            this.s_error__pose = '';
            this.s_result__pose = '';
            f_send({ s_type: 'f_a_o_pose_from_a_o_img', a_o_image: a_o_image });
        },
        f_delete_fsnode: function(n_id) {
            f_send({ s_type: 'f_delete_fsnode', n_id: n_id });
        },
        f_handle_message: function(o_data) {
            if (o_data.s_type === 'progress') {
                if (o_data.s_task === 'f_a_o_fsnode') {
                    this.s_progress__tree = o_data.s_message;
                }
                if (o_data.s_task === 'f_a_o_pose_from_a_o_img') {
                    this.s_progress__pose = o_data.s_message;
                }
                return;
            }
            if (o_data.s_type === 'f_a_o_fsnode__from_db') {
                if (o_data.s_error) {
                    this.s_error__tree = o_data.s_error;
                    return;
                }
                // preserve expanded state from current tree
                let o_set__expanded = f_o_set__expanded(this.a_o_fsnode);
                f_add_b_expanded(o_data.a_o_fsnode, o_set__expanded);
                this.a_o_fsnode = o_data.a_o_fsnode;
            }
            if (o_data.s_type === 'f_a_o_fsnode') {
                this.b_loading__tree = false;
                this.s_progress__tree = '';
                if (o_data.s_error) {
                    this.s_error__tree = o_data.s_error;
                    this.a_o_fsnode = [];
                    return;
                }
                this.s_error__tree = '';
                f_add_b_expanded(o_data.a_o_fsnode);
                this.a_o_fsnode = o_data.a_o_fsnode;
            }
            if (o_data.s_type === 'f_delete_fsnode') {
                if (o_data.s_error) {
                    this.s_error__tree = o_data.s_error;
                    return;
                }
                // reload tree from db after delete
                this.f_load_from_db();
            }
            if (o_data.s_type === 'f_a_o_pose_from_a_o_img') {
                this.b_loading__pose = false;
                this.s_progress__pose = '';
                if (o_data.s_error) {
                    this.s_error__pose = o_data.s_error;
                    return;
                }
                let n_pose = o_data.a_o_pose ? o_data.a_o_pose.length : 0;
                this.s_result__pose = 'Pose estimation done: ' + n_pose + ' pose(s) found';
            }
        },
    },
    created: function() {
        this.f_unregister = f_register_handler(this.f_handle_message);
        this.f_load_from_db();
    },
    beforeUnmount: function() {
        if (this.f_unregister) this.f_unregister();
    },
};

export { o_component__page_analyze_file };
