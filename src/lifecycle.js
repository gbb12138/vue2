import {createElement, createTextElement} from "./vnode/index";
import {patch} from "./vnode/patch";
import Watcher from "./observer/watcher";
import {callHook} from "./init";

export function lifeCycleMixin (Vue) {
    /**
     * 生成虚拟节点
     * @returns {*}
     * @private
     */
    Vue.prototype._render = function () { //调用编译后的render方法，生成虚拟DOM
        const vm = this
        let {render} = vm.$options
        let vnode = render.call(vm)  // 调用render, 进行取值操作，触发了get，进行取值（依赖收集）
        // console.log(vnode, '虚拟节点')
        return vnode;
    }
    /**
     * 创建元素的虚拟节点 _c('div', undefined, [])
     * @returns {{componentOptions: *, children: *, vm: *, tag: *, text: *, key: *, props: *}}
     * @private
     */
    Vue.prototype._c = function() {
        return createElement(this, ...arguments)
    }
    /**
     * 创建文本的虚拟节点, _v(字符串 + name + 'XXX')
     * @param text
     * @returns {{componentOptions: *, children: *, vm: *, tag: *, text: *, key: *, props: *}}
     * @private
     */
    Vue.prototype._v = function (text) {
        return createTextElement(this, text)
    }
    /**
     * 创建变量的虚拟节点，变量是对象，通过stringfy把对象转字符串， 不是对象直接返回值  _s(name)
     * @param val
     * @returns {string|*}
     * @private
     */
    Vue.prototype._s = function(val){
        if (typeof val === 'object') {
            return JSON.stringify(val)
        }
        // 不是对象，直接返回
        return val
    }
    /**
     * 创建真实节点
     * @param vnode
     * @private
     */
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

/**
 * 已经有完成编译，生成了render函数，接着走挂载流程
 * @param vm
 * @param el
 */
export function mountComponent(vm, el) {
    // console.log(vm.$options.render, el)
    // 1.产生虚拟节点vm.render() 2. 根据虚拟节点，生成真实DOM vm._update
    let updateComponent = () => {
        vm._update(vm._render())
    }
    // updateComponent()
    // 渲染是通过watcher
    new Watcher(vm, updateComponent, () => {}, {user: true}); // 初始化渲染，生成渲染watcher
    callHook(vm, 'mounted')
}
