// index.js主要用来扩展Vue的原型方法和静态方法
// 原型方法：通过实例调用，静态方法：通过类调用Vue.directive
import {initMixin} from "./init";
import {lifeCycleMixin} from "./lifecycle";
import {initGlobalAPI} from "./initGlobalAPI/index";
import {compileToFunction} from "./compile/index";
import {createElm, patch} from "./vnode/patch";
function Vue(options){  // 使用构造函数
    this._init(options)
}
initGlobalAPI(Vue)
initMixin(Vue)
lifeCycleMixin(Vue)
export default Vue
/*
// 1. new Vue的时候发生了什么，默认进行初始化操作，_init, 后面组件的初始化也会调用_init
// vue中是options， optionsApi， 不知道options中哪些选项会用到，所以会全部打包，无法实现tree-shaking

const template1 = `<ul a="1">
<li key="A" style="background-color: red">A</li>
<li key="B" style="background-color: yellow">B</li>
<li key="C" style="background-color: green">C</li>
<li key="D" style="background-color: purple">D</li>
</ul>`
// 手动渲染， 将模版渲染成render函数
const render1 = compileToFunction(template1); //生成render函数
const vm1 = new Vue({
    data: {}
})
let oldVnode = render1.call(vm1);  // 产生虚拟节点
const el1 = createElm(oldVnode);  // 创建真实节点
document.body.appendChild(el1);  // 加入DOM


// 更新DOM会再次生成ast吗？ ast只会生成一次，产生一个render函数
// render函数根据不同的节点渲染内容
// render函数返回的前后节点可能是不一样的，所以我们需要做一个diff算法
// const template2 = `<!--<ul b="2"><li key="D" style="background-color: purple">D</li><li key="C" style="background-color: green">C</li><li key="B" style="background-color: yellow">B</li><li key="A" style="background-color: red">A</li></ul>-->`
// const template2 = `<!--<ul b="2"><li key="E" style="background-color: orange">E</li><li key="A" style="background-color: red">A</li><li key="B" style="background-color: yellow">B</li><li key="C" style="background-color: green">C</li><li key="D" style="background-color: purple">D</li></ul>-->`
// const template2 = `<!--<ul b="2"><li key="D" style="background-color: purple">D</li><li key="C" style="background-color: green">C</li><li key="B" style="background-color: yellow">B</li><li key="A" style="background-color: red">A</li></ul>-->`
// const template2 = `<ul b="2"> <li key="D" style="background-color: purple">D</li><li key="A" style="background-color: red">A</li><li key="B" style="background-color: yellow">B</li><li key="C" style="background-color: green">C</li></ul>`;
const template2 = `<ul b="2">
<li key="M" style="background-color: purple">M</li>
<li key="A" style="background-color: red">A</li>
<li key="C" style="background-color: green">C</li>
<li key="P" style="background-color: yellow">P</li>
</ul>`;
const render2 = compileToFunction(template2)
let newVnode = render2.call(vm1)

setTimeout(() => {
    // 产生了新的真实节点
    // const el2 = createElm(newVnode)
    // document.body.removeChild(el1)
    // document.body.appendChild(el2)
    patch(oldVnode, newVnode)
}, 2000)

*/


