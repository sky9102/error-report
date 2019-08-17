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

function getErrorReportCommonParams() {
    return {
        options: {
            browser: getBrowser(),
            device: getDevices(),
            level: "error",
            userAgent: navigator.userAgent, // userAgent
            pageUrl: window.location.href, // 上报页面地址
            localStorageKey: "error_report_data"
        }
    };
}
