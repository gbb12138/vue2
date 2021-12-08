// 实例化出监测过的对象
import {proto} from "./array";
import Dep from "./dep";

class Observer{
    constructor(value) { // 将用户传入的数据循环，进行重写
        this.dep = new Dep(); // 给对象类型（array, object）的数据增加了dep属性
        // value.__ob__ = this //this Observer的实例
        // 将__ob__设置成不可枚举的，递归的时候，陷入死循环
        Object.defineProperty(value, '__ob__', {
            enumerable: false,
            value: this
        })
        // 需要让数组进行依赖收集，数组在页面使用了，应该让数组收集watcher，当数组调用了重写的7个方法时，应该触发数组对应的watcher来进行更新
        if(Array.isArray(value)) {
            value.__proto__ = proto// 原型链上重写数组方法，保留其他数组方法
            // 如果数组中是对象，对象再次代理
            this.observeArray(value)
        } else {
            this.walk(value)
        }
    }
    walk(target) {
        // 循环对象
        Object.keys(target).forEach(key => {
            defineReactive(target, key, target[key])
        })
    }
    observeArray (arr) {
        for(let i = 0; i< arr.length; i++) {
            observe(arr[i])  // 数组中是对象，继续代理
        }
    }
}

function dependArray(value) {
    for(let i = 0; i< value.length; i++) {
        let c = value[i]
        c.__ob__ && c.__ob__.dep.depend(); // 让数组中的对象或者数组再次依赖收集
        if(Array.isArray(c)) {
            dependArray(c); // [[[[1]]]], 可能嵌套了多层数组，让数组中的对象和数组都能有依赖收集
        }
    }
}
function defineReactive(target,key,value) { // 定义响应式
    let dep = new Dep(); // 这个dep是为key服务的， 属性的dep
    // 不存在的属性不会被 defineProperty
    let childOb = observe(value) // 递归监测，性能差，全部属性都监测
    Object.defineProperty(target, key, { // 将属性重新定义在target， 增加了get和set（性能差）
        get() {
            // 数组在页面中访问vm.arr, {{}}, 也会触发数组的get，需要让数组本身对应的dep去收集watcher
            if(Dep.target) {
                dep.depend(); // 让属性对应的dep，记住当前的watcher， 还需要让watcher机制dep，还需要去重
                if (childOb && childOb.dep) { // 是Observer的实例
                    childOb.dep.depend(); // 让对象和数组本身进行依赖收集
                    // 还需要对数组内部的对象进行收集
                    if (Array.isArray(value)) { // 数组里面可能有对象，也可能是数组，需要将里面的数组也进行依赖收集
                        dependArray(value)
                    }
                }
            }
            return value // 这里不能写target[key]， 这样又会触发get，陷入死循环
        },
        set(newValue) {
            // console.log('属性设置')
            observe(newValue) // 设置的值如果是对象，再次调用observe，把对象变成响应式的
            if (newValue === value) return
            value = newValue
            dep.notify()
        }
    })
}

export function observe (data) {
// data是用户传入的数据，对其进行观测
    if (typeof data !== 'object' || data === null) {//如果data不是对象，不在进行观测
        return data
    }
    // 如果数据中有__ob__说明已经被劫持过了
    if(data.__ob__) {
        return
    }
    // 如果是对象，进行观测
    // 这里用一个类进行观测，因为如果是类，判断对象是否观测过，可以通过XX instanceof Observer 为true，则观测过
    return new Observer(data)
}
