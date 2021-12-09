// 默认搜集依赖是dep.depend方法，核心是让dep和watcher产生依赖
let id = 0;
class Dep{
    constructor() {
        this.id = id++;
        this.subs = []
    }
    depend () {
        // this.subs.push(Dep.target); // 直接让属性记住watcher，没有去重watcher，没有让watcher和dep产生关联
        Dep.target.addDep(this);// Dep.target是watcher，让watcher记住dep，同时去重
    }
    addSub (watcher) {
        this.subs.push(watcher); // 让dep记住watcher
    }
    notify () {
        this.subs.forEach(watcher => {
            watcher.update()
        })
    }
}
Dep.target = null; // 用于保存watch到全局中
let stack = []; // 存放Dep.target的watcher
export function pushTarget (watcher) {
    stack.push(watcher);
    Dep.target = watcher;
}
export function popTarget () {
    stack.pop();
    Dep.target = stack[stack.length - 1];
}
export default Dep; // 每个对象都加一个dep， 每个属性都增加一个dep
