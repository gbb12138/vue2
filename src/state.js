import {observe} from "./observer/index"; //rollup-plugin-resolve

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
function initComputed(vm) {

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
