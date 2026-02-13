import { createRouter, createWebHashHistory } from 'vue-router';
import { o_component__page_data } from './o_component__page_data.js';

let a_o_route = [
    {
        path: '/',
        redirect: '/data',
    },
    {
        path: '/data',
        name: 'data',
        component: o_component__page_data,
    },
];

let o_router = createRouter({
    history: createWebHashHistory(),
    routes: a_o_route,
});

export { o_router };
