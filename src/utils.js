const strats = {};
['beforeCreate', 'created', 'beforeMount', 'mounted'].forEach(method => {
    strats[method] = function (parentVal, childVal) {
        // 第一次parentVal是空的，Vue.options默认是{}, options用户传入mixin的参数 = {a, beforeCreated: function () {}}
        if (childVal) {
            if (parentVal) {
                return parentVal.concat(childVal)
            } else {
                return [childVal]
            }
        } else {
            return parentVal; // 如果儿子没有，直接用父亲的
        }
    }
})
// 处理组件的父子关系, 组件的合并策略
// 声明组件时，会在vm.$options上新增components属性，通过vm.$options.components拿到组件的属性
strats.components = function (parentVal, childVal) {
    const obj = Object.create(parentVal); // obj.__pro__ = parentVal
    if (childVal) {
        for(let key in childVal) {
            obj[key] = childVal[key]
        }
    }
    return obj;
}
// parentVal： mixin中的数据，childVal: Vue实例中的数据
export function mergeOptions (parentVal, childVal) { // 合并的过程时自己定义的策略
    // 如果a有b没有，那么采用a的
    // 如果a有b也有，采用b的
    // 特殊情况，比如生命周期：需要把多个生命周期合并成数组
    const options = {};
    for (let key in parentVal) {
        mergeField(key)
    }
    for (let key in childVal) {  // b有a没有
        if(!parentVal.hasOwnProperty(key)) { // a中已经有的，就不再合并， 取a
            mergeField(key)
        }
    }
    function mergeField (key) {
        // 针对不同的key进行合并，将不同的策略定义到对象上，根据不同的策略进行加载
        if (strats[key]) { // 如果传入了生命周期，或组件
            options[key] = strats[key](parentVal[key], childVal[key]) // 将生命周期函数，合并成数组
        } else {
            options[key] = childVal[key] || parentVal[key] // 优先取新的
        }

    }
    return options;
}
