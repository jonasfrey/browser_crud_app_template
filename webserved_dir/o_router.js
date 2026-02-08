import { createRouter, createWebHashHistory } from 'vue-router';
import { o_component__page_analyze_file } from './o_component__page_analyze_file.js';
import { o_component__page_data } from './o_component__page_data.js';
import { o_component__page_configuration } from './o_component__page_configuration.js';
import { o_component__page_pose_viewer } from './o_component__page_pose_viewer.js';

let a_o_route = [
    {
        path: '/',
        redirect: '/analyze_file',
    },
    {
        path: '/analyze_file',
        name: 'analyze_file',
        component: o_component__page_analyze_file,
    },
    {
        path: '/data',
        name: 'data',
        component: o_component__page_data,
    },
    {
        path: '/configuration',
        name: 'configuration',
        component: o_component__page_configuration,
    },
    {
        path: '/pose_viewer',
        name: 'pose_viewer',
        component: o_component__page_pose_viewer,
    },
];

let o_router = createRouter({
    history: createWebHashHistory(),
    routes: a_o_route,
});

export { o_router };
