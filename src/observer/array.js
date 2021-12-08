let oldArrayPrototype = Array.prototype
export const proto = Object.create(oldArrayPrototype)  // proto.__proto__ = oldArrayPrototype
// 函数劫持， 让vue中的数组，可以拿到重写后的原型，如果找不到调用数组本身的方法
let arr = ['push', 'pop','unshift', 'shift','reverse','sort', 'splice']
arr.forEach(method => {
    proto[method] = function (...args) { // args可能是对象，需要对新增的对象增加get，set方法
        // 调用老的方法
        let result = oldArrayPrototype[method].call(this,...args)
        // 需要对新增的功能再次拦截，将新增的属性进行代理
        let inserted;
        let ob = this.__ob__
        switch(method) {
            case 'push':
            case 'unshift':
                inserted = args // 拿到新增的数组值
                break;
            case 'splice':
                inserted = args.slice(2) // splice(index, length, ...新增的)， 参数的从第二个开始
            default:
                break;
        }
        // console.log('用户调用了数组方法', method)
        ob.dep.notify(); // 告诉用户该更新页面了
        if(inserted) {
            // 如果新增的有值，循环判断是否是对象，是对象，进行劫持 observeArray
            // this -> data中的数组
            ob.observeArray(inserted)
        }
        return result // 数组方法的返回值
    }
})
