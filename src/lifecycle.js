import {createElement, createTextElement} from "./vnode/index";
import {patch} from "./vnode/patch";
import Watcher from "./observer/watcher";
import {callHook} from "./init";

export function lifeCycleMixin (Vue) {
    Vue.prototype._render = function () { //调用编译后的render方法，生成虚拟DOM
        const vm = this
        let {render} = vm.$options
        let vnode = render.call(vm)  // 调用render, 进行取值操作，触发了get，进行取值（依赖收集）
        // console.log(vnode, '虚拟节点')
        return vnode;
    }
    // 创建元素的虚拟节点 _c('div', undefined, [])
    Vue.prototype._c = function() {
        return createElement(this, ...arguments)
    }
    // 创建文本的虚拟节点, _v(字符串 + name + 'XXX')
    Vue.prototype._v = function (text) {
        return createTextElement(this, text)
    }
    //stringfy对象转字符串 _s(name)
    Vue.prototype._s = function(val){
        if (typeof val === 'object') {
            return JSON.stringify(val)
        }
        // 不是对象，直接返回
        return val
    }
    Vue.prototype._update = function (vnode) { // 虚拟DOM变成真实DOM， 后续更新也调用这个方法
        const vm = this
        let preVnode = vm._vnode;  // 上一次的虚拟节点， 首次渲染没有preVnode
        vm._vnode = vnode;
        if (!preVnode) {
            // patch返回一个新创建的节点，旧节点删除，需要重新将新节点赋值到el中
            this.$el = patch(this.$el, vnode) // 首次渲染, 传入真实DOM和vnode节点
        } else {
            this.$el = patch(preVnode, vnode)   // 更新， 传入两个虚拟节点 diff算法
        }
    }
}

export function mountComponent(vm, el) {
    // console.log(vm.$options.render, el)
    // 1.产生虚拟节点vm.render() 2. 根据虚拟节点，生成真实DOM vm._update
    let updateComponent = () => {
        vm._update(vm._render())
    }
    // updateComponent()
    new Watcher(vm, updateComponent, () => {}, {user: true}); // 初始化渲染，生成渲染watcher
    callHook(vm, 'mounted')
}
