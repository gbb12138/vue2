import {createWatcher, initState} from "./state";
import {compileToFunction} from "./compile/index";
import {mountComponent} from "./lifecycle";
import {mergeOptions} from "./utils";
import Watcher from "./observer/watcher";

export function callHook (vm, hook) {  // 找到对应的钩子函数，依次执行
    const handlers = vm.$options[hook];
    if (handlers) {
        for(let i = 0; i< handlers.length; i++) {
            handlers[i].call(vm)
        }
    }
}
export function initMixin(Vue) {
    Vue.prototype._init = function (options) {
        const vm = this // this代表的是当前的实例
        // 这里的options是用户的，需要将用户的与全局的合并
        //this.constructor 即Vue方法， 拿到mixin中的全局方法
        vm.$options = mergeOptions(this.constructor.options, options) // 保存options， 在其他原型方法中可以通过vm.$options拿到用户传入的参数
        // console.log(vm.$options, 6666);
        callHook(vm, 'beforeCreate');
        initState(vm) // 状态的初始化， 目的是初始化用户传入的props，data, computed, watch
        // 判断是否有el，如果有，实现挂载
        if(options.el) {
            vm.$mount(options.el)
        }
    }

    Vue.prototype.$mount = function (el) {
        // render -> template -> outerHTML

        el = document.querySelector(el)
        const vm = this
        vm.$el = el
        const options = this.$options
        let render
        if (!options.render) {
            // 没有render，找是否有template
            let template = options.template
            if (!template) {
                // 没有template， 使用outerHTML
                template = el.outerHTML
            }
            options.render = compileToFunction(template) //模版编译
        }
        // 有render, 直接使用render函数，渲染
        // render = options.render // 拿到编译后的render
        // console.log(render, 123)
        // 根据render方法产生虚拟节点， 再将虚拟节点变成真实节点， 插入到页面中el
        mountComponent(vm, el) // 组件挂载
    }


    Vue.prototype.$watch = function (key, handler) {
        const watcher = new Watcher(this, key, handler, {user: true}); // 监听key属性的变化，变化了，调用handler方法
    }
}
