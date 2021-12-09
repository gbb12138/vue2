import {observe} from "./observer/index";
import Watcher from "./observer/watcher";
import Dep from "./observer/dep"; //rollup-plugin-resolve

export function initState(vm) { // 当前实例
    const options = vm.$options
    if (options.data) {
        // 初始化data
        initData(vm)
    }
    if(options.computed) {
        // 初始化计算属性
        initComputed(vm)
    }
    if(options.watch) {
        // 初始化watch
        // debugger
        initWatch(vm)
    }
}

function initData (vm) {
    let data = vm.$options.data
    // 需要对data属性重写，添加get，set， 只能拦截寻在的属性
    // data可能是方法，也可能是对象
    data = vm._data = typeof data === 'function' ? data.call(vm) : data
    // 这里使用vm._data获取数据麻烦，想通过vm.XXX来代替vm._data.XXX
    for(let key in vm._data) {  // 循环代理属性
        proxy(vm, '_data', key)
    }
    observe(data) // 数据进行观测，vm._data和data是同一个对象，观测data，vm._data也被观测
}
function proxy (target, key, property) { // vm.XXXX  ---> vm._data.XXX
    Object.defineProperty(target, property, {
        get () {
            return target[key][property]
        },
        set(n) {
            target[key][property] = n
        }
    })
}
function defineComputed (target, key, fn) {
    Object.defineProperty(target,key,{
        get () {
            const watcher = target._computedWatchers[key];
            if(watcher && watcher.dirty) { // 默认计算属性watcher里的dirty是true
                watcher.evaluate();  // 调用get，得到value， 同时将watcher的dirty置为false
            }
            if (Dep.target) { // 让name和age收集上一层的依赖， 这样使渲染watcher触发更新
                watcher.depend();
            }
            return watcher.value;  // 如果dirty为false， 后续的取值操作，返回之前的value
        }
    })
}
function initComputed(vm) {
    const computed = vm.$options.computed;
    // 每一个计算属性就是一个watcher
    const watchers = vm._computedWatchers = {}
    for(let key in computed) {
        let userDef = computed[key];
        watchers[key] = new Watcher(vm, userDef, () => {}, {lazy: true});
        // 使用computed时vm.xxx
        defineComputed(vm, key, userDef); // Object.defineProperty
    }

}
function initWatch (vm) {
    const watch = vm.$options.watch;
    // 给每一个属性都创建一个watcher（渲染watcher）（用户watcher）（computed watcher）
    for(let key in watch) {
        createWatcher(vm, key, watch[key])
    }
}

export function createWatcher (vm, key, value) {
    return vm.$watch(key, value); // 监控某个属性和处理函数
}
