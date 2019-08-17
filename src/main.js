// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import "./common/scss/index.scss";
import "lib-flexible";
import Vue from "vue";
import App from "./App";
import ErrorReport from "./plugins/errorReport";
import router from "./router";

Vue.config.productionTip = false;

Vue.use(ErrorReport, {
    reportUrl: "http://localhost:10300/errorReport",
    env: "dev",
    appId: "error-report-5c6pz3e4il59k2f3b6",
    appName: "error-report"
});

/* eslint-disable no-new */
new Vue({
    el: "#app",
    components: {
        App
    },
    template: "<App/>",
    router
});
