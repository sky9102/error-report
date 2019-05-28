<template>
  <div class="error-test-wrapper">
    <h1>异常上报测试页面</h1>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      userInfo: {
        name: "sky",
        age: 18,
        id: "0X557"
      }
    };
  },
  methods: {
    test1Method() {
      throw new Error("这是一个错误");
    },
    test2Method(data) {
      axios
        .post("http://www.baidu.com/getNewsInfo", data)
        .then(res => {})
        .catch(e => {
          console.log("axios 请求方法的 catch！！");
        });
    },
    test3Method() {
      Promise.reject("promise error11");
      new Promise((resolve, reject) => {
        reject("promise error22");
      });
      new Promise((resolve, reject) => {
        resolve();
      }).then(() => {
        throw "promise error33";
      });
    },
    test4Method() {
      const xhr = new XMLHttpRequest();
      xhr.timeout = 3000;
      xhr.ontimeout = event => {
        alert("XMLHttpRequest  请求超时！");
      };
      xhr.open("POST", "http://localhost:10300/login");
      xhr.send("a=1&b=2");
      xhr.onreadystatechange = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
          alert(xhr.responseText);
        } else {
          alert(xhr.statusText);
        }
      };
    },
    async test5Method() {
      throw "test5 Method";
    }
  },
  mounted() {
    //
    // 取消其中任何一个注释，即可查看异常上报情况。
    //

    // 1、脚本抛出异常
    this.test1Method();

    // 2、axios 异常
    // this.test2Method({
    //   ID: 222222,
    //   net4: Date.now()
    // });

    // 3、Promise 异常
    this.test3Method();

    // 4、Ajax 异常
    // this.test4Method();

    // 5、Async 异常
    // this.test5Method();

    // 6、Script 异常
    // const scriptEle = document.createElement("script");
    // scriptEle.src = "https://www.baidu.com/index.js";
    // document.appendChild(scriptEle);

    // 7、Img 异常
    // const img = document.createElement("img");
    // img.src = "https://www.baidu.com/index.jpg";
    // document.appendChild(img);
  }
};
</script>

<style lang="scss" scoped>
.error-test-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;

  h1 {
    font-size: 28px;
    line-height: 38px;
  }
}
</style>
