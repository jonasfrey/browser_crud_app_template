let f_s_filesize = function(n_bytes) {
    if (n_bytes < 1024) return n_bytes + ' B';
    if (n_bytes < 1024 * 1024) return (n_bytes / 1024).toFixed(1) + ' KB';
    if (n_bytes < 1024 * 1024 * 1024) return (n_bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (n_bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

let f_s_duration = function(n_ms) {
    let n_sec__total = Math.floor(n_ms / 1000);
    let n_min = Math.floor(n_sec__total / 60);
    let n_sec = n_sec__total % 60;
    let n_hr = Math.floor(n_min / 60);
    n_min = n_min % 60;
    let s_sec = String(n_sec).padStart(2, '0');
    let s_min = String(n_min).padStart(2, '0');
    if (n_hr > 0) return n_hr + ':' + s_min + ':' + s_sec;
    return s_min + ':' + s_sec;
};

let o_component__file_tree = {
    name: 'file-tree',
    props: ['a_o_fsnode', 'n_depth'],
    template: `
        <div>
            <div v-for="o_fsnode in a_o_fsnode" :key="o_fsnode.s_path_absolute">
                <div :style="{ paddingLeft: n_depth * 20 + 'px' }">
                    <div v-if="o_fsnode.b_folder" class="entry__directory"
                        @click="o_fsnode.b_expanded = !o_fsnode.b_expanded">
                        <span class="indicator">{{ o_fsnode.b_expanded ? 'v' : '>' }}</span>
                        <span>{{ o_fsnode.s_name }}</span>
                    </div>
                    <div v-else class="entry__file">
                        <span class="indicator">\u00a0</span>
                        <span>{{ o_fsnode.s_name }}</span>
                        <span v-if="o_fsnode.b_image && o_fsnode.o_image__fromdb" class="info__media">
                            {{ o_fsnode.o_image__fromdb.n_scl_x }}x{{ o_fsnode.o_image__fromdb.n_scl_y }}
                            {{ f_s_filesize(o_fsnode.n_bytes) }}
                        </span>
                        <span v-if="o_fsnode.b_video && o_fsnode.o_video__fromdb" class="info__media">
                            {{ f_s_duration(o_fsnode.o_video__fromdb.n_ms_duration) }}
                            {{ o_fsnode.o_video__fromdb.n_scl_x }}x{{ o_fsnode.o_video__fromdb.n_scl_y }}
                            {{ f_s_filesize(o_fsnode.n_bytes) }}
                        </span>
                    </div>
                </div>
                <file-tree v-if="o_fsnode.b_folder && o_fsnode.b_expanded"
                    :a_o_fsnode="o_fsnode.a_o_fsnode"
                    :n_depth="n_depth + 1">
                </file-tree>
            </div>
        </div>
    `,
    methods: {
        f_s_filesize: f_s_filesize,
        f_s_duration: f_s_duration,
    },
};

export { o_component__file_tree };
