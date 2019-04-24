import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

export default new VueRouter({
    routes: [
        {
            path: "/",
            name: "Index",
            redirect: '/errorTest',
            component: () =>
                import(/* webpackChunkName:'index' */ "@views/index")
        },
        {
            path: "/errorTest",
            name: "ErrorTest",
            component: () =>
                import(/* webpackChunkName:'errorTest' */ "@views/errorTest")
        }
    ]
});
