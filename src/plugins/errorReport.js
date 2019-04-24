import Vue from "vue";
import axios from "axios";
/*
 * 格式化参数
 */
function formatParams(data = {}) {
    const arr = [];
    for (const name in data) {
        arr.push(
            encodeURIComponent(name) + "=" + encodeURIComponent(data[name])
        );
    }
    return arr.join("&");
}

/**
 * 获取浏览器类型
 */
function getBrowser() {
    // 取得浏览器的userAgent字符串
    const userAgent = navigator.userAgent;
    let isOpera = false;

    // 判断是否Opera浏览器
    if (userAgent.indexOf("Opera") > -1) {
        isOpera = true;
        return "Opera";
    }
    // 判断是否Firefox浏览器
    if (userAgent.indexOf("Firefox") > -1) {
        return "Firefox";
    }
    // 判断是否Chrome浏览器
    if (userAgent.indexOf("Chrome") > -1) {
        return "Chrome";
    }
    // 判断是否Safari浏览器
    if (userAgent.indexOf("Safari") > -1) {
        return "Safari";
    }
    // 判断是否IE浏览器
    if (
        userAgent.indexOf("compatible") > -1 &&
        userAgent.indexOf("MSIE") > -1 &&
        !isOpera
    ) {
        return "IE";
    }
    // 判断是否QQ浏览器
    if (userAgent.match(/MQQBrowser\/([\d.]+)/i)) {
        return "QQBrower";
    }
    return "Other";
}

/**
 * 获取设备是安卓、 IOS 还是PC端
 */
function getDevices() {
    const ua = navigator.userAgent;
    let isIPad = false;
    let isIPod = false;

    if (ua.match(/(Android)\s+([\d.]+)/i)) {
        return "Android";
    }
    if (ua.match(/(iPad).*OS\s([\d_]+)/i)) {
        isIPad = true;
        return "iPad";
    }
    if (ua.match(/(iPod).*OS\s([\d_]+)/i)) {
        isIPod = true;
        return "iPod";
    }
    if (!isIPad && !isIPod && ua.match(/(iPhone\sOS)\s([\d_]+)/i)) {
        return "iPhone";
    }
    return "PC";
}

class ErrerReport {
    constructor(ops = {}) {
        // 上报Error地址
        this.reportUrl = ops.reportUrl || "";
        // 延时上报Error时间
        this.delayTime = ops.delayTime || 1000;
        // localStorage 存放的时间戳
        this.localStorageTime = Date.now();
        // 断网标记, 默认不断网
        this.offLineFlg = false;
        this.options = {
            appId: "", // 项目ID
            appName: "", // 项目名称
            browser: getBrowser(),
            device: getDevices(),
            userId: "",
            token: "",
            timeSpan: "", // 发送数据时的时间戳
            level: "error", // js 日志错误级别，如warning, error, info, debug
            msg: "", // 错误的具体信息,
            userAgent: navigator.userAgent, // userAgent
            pageUrl: window.location.href, // 上报页面地址
            stack: "", // 错误堆栈信息
            data: {} // 更多错误信息
        };

        // 任务列表，存放所有任务
        this.reqDataList = [];

        Object.assign(this.options, ops);

        this.init();
        this.asyncSendReport();
    }

    init() {
        const self = this;
        // Ajax监控
        const ajaxListener = {};
        // 复制send方法
        ajaxListener.tempSend = XMLHttpRequest.prototype.send;
        // 复制open方法
        ajaxListener.tempOpen = XMLHttpRequest.prototype.open;
        // 重写open方法,记录请求的url
        XMLHttpRequest.prototype.open = function(method, url, boolen) {
            ajaxListener.tempOpen.apply(this, [method, url, boolen]);
            self.ajaxUrl = url;
        };
        // 发送
        XMLHttpRequest.prototype.send = function(data) {
            const tempReadystate = this.onreadystatechange;
            this.onreadystatechange = function() {
                if (this.readyState === 4) {
                    if (this.status >= 200 && this.status < 300) {
                        tempReadystate && tempReadystate.apply(this, [data]);
                        return;
                    }

                    self.options.msg = "AJAX 请求错误";
                    self.options.stack = `错误码：${this.status}`;
                    self.options.data = JSON.stringify({
                        requestUrl: self.ajaxUrl,
                        category: "XMLHttpRequest AJAX",
                        text: this.statusText,
                        status: this.status
                    });
                    // 合并上报的数据，包括默认上报的数据和自定义上报的数据
                    const reportData = Object.assign({}, self.options);
                    // 把错误信息发送给后台
                    self.saveReport(reportData);
                }
            };

            ajaxListener.tempSend.apply(this, [data]);
        };

        /**
         * 监控资源加载错误(img,script,css,以及jsonp)
         *
         * 其中包括行列号，Error对象中存在错误的堆栈信息等。
         */
        window.addEventListener(
            "error",
            e => {
                const target = e.target ? e.target : e.srcElement;
                this.options.msg = e.target.localName + " is load error";
                this.options.stack = "resouce is not found";
                this.options.data = JSON.stringify({
                    tagName: e.target.localName,
                    html: target.outerHTML,
                    type: e.type,
                    fileName: e.target.currentSrc,
                    category: "Resource"
                });
                if (e.target !== window) {
                    // 抛去js语法错误
                    // 合并上报的数据，包括默认上报的数据和自定义上报的数据
                    const reportData = Object.assign({}, this.options);
                    this.saveReport(reportData);
                }
            },
            true
        );

        /**
         * 监控 JS 错误，加载第三方JS出现
         *
         * 其中包括行列号，Error对象中存在错误的堆栈信息等。
         */
        window.onerror = (msg, url, line, col, error) => {
            if (msg === "Script error." && !url) {
                return false;
            }
            // 采用异步的方式,避免阻塞
            setTimeout(() => {
                // 不一定所有浏览器都支持col参数，如果不支持就用window.event来兼容
                const newCol =
                    col || (window.event && window.event.errorCharacter) || 0;
                if (error && error.stack) {
                    // msg信息较少,如果浏览器有追溯栈信息,使用追溯栈信息
                    this.options.msg = msg;
                    this.options.stack = error.stack;
                } else {
                    this.options.msg = msg;
                    this.options.stack = "";
                }
                this.options.data = JSON.stringify({
                    pageUrl: this.ajaxUrl,
                    fileName: url,
                    category: "JavaScript",
                    line: line,
                    col: newCol
                });
                // 合并上报的数据，包括默认上报的数据和自定义上报的数据
                const reportData = Object.assign({}, this.options);
                // 把错误信息发送给后台
                this.saveReport(reportData);
            }, 0);

            // 错误不会console浏览器上,如需要，可将这样注释
            return true;
        };

        // 监控 promise 异常
        window.addEventListener(
            "unhandledrejection",
            event => {
                // 错误信息
                this.options.msg = event.reason || "";
                this.options.data = JSON.stringify({
                    pageUrl: window.location.href,
                    category: "Promise"
                });
                this.options.stack = "Promise is Error";
                const reportData = Object.assign({}, this.options);
                this.saveReport(reportData);
                // 如果想要阻止继续抛出，即会在控制台显示 `Uncaught(in promise) Error` 的话，调用以下函数
                event.preventDefault();
            },
            true
        );

        // Vue 异常监控
        Vue.config.errorHandler = (error, vm, info) => {
            const componentName = this.formatComponentName(vm);
            // const propsData = vm.$options && vm.$options.propsData;

            this.options.msg = error.message;
            this.options.stack = this.processStackMsg(error);
            this.options.data = JSON.stringify({
                category: "Vue",
                componentName,
                // propsData,
                info
            });

            // 合并上报的数据，包括默认上报的数据和自定义上报的数据
            const reportData = Object.assign({}, this.options);
            this.saveReport(reportData);
        };

        // Axios 异常监控
        axios.interceptors.response.use(null, error => {
            this.options.msg = error.message;
            this.options.stack = this.processStackMsg(error);
            this.options.data = JSON.stringify({
                category: "Axios"
            });

            // 合并上报的数据，包括默认上报的数据和自定义上报的数据
            const reportData = Object.assign({}, this.options);
            this.saveReport(reportData);

            return Promise.reject(error);
        });
    }

    /* eslint-disable class-methods-use-this */
    processStackMsg(error) {
        let stack = error.stack
            .replace(/\n/gi, "") // 去掉换行，节省传输内容大小
            .replace(/\bat\b/gi, "@") // chrome中是at，ff中是@
            .split("@") // 以@分割信息
            .slice(0, 9) // 最大堆栈长度（Error.stackTraceLimit = 10），所以只取前10条
            .map(v => v.replace(/^\s*|\s*$/g, "")) // 去除多余空格
            .join("~") // 手动添加分隔符，便于后期展示
            .replace(/\?[^:]+/gi, ""); // 去除js文件链接的多余参数(?x=1之类)
        const msg = error.toString();
        if (stack.indexOf(msg) < 0) {
            stack = msg + "@" + stack;
        }
        return stack;
    }

    /* eslint-disable class-methods-use-this */
    formatComponentName(vm) {
        if (vm.$root === vm) {
            return "root";
        }
        const name = vm._isVue
            ? (vm.$options && vm.$options.name) ||
              (vm.$options && vm.$options._componentTag)
            : vm.name;
        return (
            (name ? "component <" + name + ">" : "anonymous component") +
            (vm._isVue && vm.$options && vm.$options.__file
                ? " at " + (vm.$options && vm.$options.__file)
                : "")
        );
    }

    stop() {
        this.sendReport = function() {};
    }

    saveReport(data) {
        const reqData = Object.assign({}, data, {
            timeSpan: Date.now(),
            pageUrl: window.location.href
        });

        this.reqDataList.push(reqData);

        // 断网
        if (navigator.onLine === false) {
            localStorage.setItem(
                `errorReport_${this.localStorageTime}`,
                JSON.stringify(this.reqDataList)
            );
        }
    }

    /**
     * 异步上报异常信息
     */
    asyncSendReport() {
        // 在线
        if (navigator.onLine) {
            // 之前离线
            if (this.offLineFlg) {
                this.getLocalStorageErrorData();
            }

            if (this.reqDataList.length > 0) {
                while (this.reqDataList.length > 0) {
                    const img = new Image();
                    const reqData = this.reqDataList.shift();
                    // 延时处理
                    setTimeout(() => {
                        img.src = `${this.reportUrl}?${formatParams(reqData)}`;
                    });
                }
            } else {
                this.executeDelayFunction();
            }
        } else {
            // 断网
            this.offLineFlg = true;
            this.executeDelayFunction();
        }
    }

    /**
     * 执行延时方法
     */
    executeDelayFunction() {
        setTimeout(() => {
            this.asyncSendReport();
        }, this.delayTime);
    }

    /**
     * 获取LocalStorage 存入的错误信息
     */
    getLocalStorageErrorData() {
        const key = `errorReport_${this.localStorageTime}`;
        const errorReportStr = localStorage.getItem(key);
        if (errorReportStr === null || errorReportStr === "") {
            return;
        }
        this.reqDataList = JSON.parse(errorReportStr);
        localStorage.removeItem(key);
        this.offLineFlg = false;
        this.localStorageTime = Date.now();
    }
}

export default {
    install(Vue, options) {
        /* eslint-disable no-new */
        new ErrerReport(options);
    }
};
