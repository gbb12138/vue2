import Dep, {popTarget, pushTarget} from "./dep";
import {watch} from "rollup";

let id = 0;
class Watcher{
    /**
     * @param callback  用户的函数
     * @param exprOrFn 监控的属性name， 先去取vm.name作为一个老的值,当值变化了，再去取值
     * @param vm  当前的实例
     * @param options
     */
    constructor(vm, exprOrFn, callback, options) { // 渲染watcher exprOrFn是函数，watch 中是表达式即属性名
        this.id = id++;
        if (typeof exprOrFn == 'function') {
            this.getter = exprOrFn; // 将用户传入的fn，保存在getter上
        } else {
            this.getter = () => vm[exprOrFn]  // 取值的时候就会收集watcher
        }
        this.deps = []; // watcher对应存放的dep
        this.depsId = new Set(); // 用于去重watcher对应的deps的ID
        this.lazy = options.lazy; // lazy 是true，是计算属性watcher，不要立即调用get
        this.dirty = this.lazy; // 计算属性，默认dirty是true
        this.value = this.lazy ? undefined: this.get(); // this.value就是老的值， 这里调用了get就会执行getter，触发取值，将依赖收集起来，也就是把watcher和依赖的Dep映射
        this.callback = callback;
        this.options = options;
        this.vm = vm
    }
    addDep (dep) {
        let id = dep.id;
        if (!this.depsId.has(id)) { // 如果当前watcher中，没有保存对应的dep
            this.depsId.add(id)
            this.deps.push(dep); // 让watcher记住dep
            dep.addSub(this);// 同时将dep记住watcher，同时对应保存
        }
    }
    get () {
        // Dep.target = this; // 将watch暴露到全局变量上
        pushTarget(this);
        let value = this.getter.call(this.vm); // 第一次渲染就默认调用了getter， vm._update(vm._render())
        // 当调用_render的时候，就会取值get
        // Dep.target = null; // 更新完DOM后，将watch清空
        popTarget();
        return value;
    }
    update () {  // 每次调用完update，清空watcher队列
        console.log('watcher更新')
        if (this.lazy) { // 是计算属性watcher
            this.dirty = true;  // 如果依赖的属性变化了，dirty置为true，下次取计算属性的值的时候，进入evaluate， 重新执行get取值
        } else {
            // 批量更新，相同的watcher只收集一次，不同的watcher放入队列，待主程序走完后异步执行watcher队列执行run
            // this.get(); // 只要改变就更新，当连续更新几个属性时，性能不好
            queueWatcher(this);// 优化性能，将watcher放入到队列中，重复watcher只执行一次
        }
    }
    run () {
        let newVal = this.get();
        let oldVal = this.value;
        if (this.options.user) {
            this.callback(newVal, oldVal)
        }
    }
    evaluate () {
        this.value = this.get();
        this.dirty = false;
    }
    depend () {
        let l = this.deps.length;  // watcher依赖的属性对应的dep： name age
        while (l--) { // [渲染watcher， 计算属性watcher]
            this.deps[l].depend(); // 需要将所有属性都记住上一层的watcher Dep.target
        }
    }
}
let watchersId = new Set();
let queue = [];
let pending = false;
// 将watcher放入到队列里
function queueWatcher (watcher) {
    const id = watcher.id  // 拿到watcher的id
    if (!watchersId.has(id)) { // watcher是否已经存在
        watchersId.add(id) // 添加到队列里
        queue.push(watcher) // 保存watcher
        if (!pending) {
            // vue2考虑兼容性，优先考虑promise, 但ie不支持，
            // 再考虑使用mutationObserver h5提供的一个方法，
            // setImmediate
            // 如果都不支持，使用setTimeout
            setTimeout(flushShedulerQueue, 0)
            pending = true
        }
    }
}
function flushShedulerQueue () {
    for(let i = 0; i<queue.length; i++) {
        let watcher = queue[i]
        watcher.run()
    }
    queue = [];
    pending = false;
    watchersId.clear();
}
export default Watcher;
