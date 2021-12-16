import {mergeOptions} from "../utils";

export function initGlobalAPI (Vue) { // 静态方法， Vue.XXX
    Vue.options = {}; // 所有的全局属性都会放到这个变量上
    Vue.mixin = function (options) { // 用户要合并的对象
        this.options = mergeOptions(this.options, options) // this   =>  Vue
    }
    // Vue定义全局组件：1。定义全局组件映射关系到Vue.options  2.内部调用Vue.extend返回一个子类
    Vue.options.components = {}; //放全局组件
    Vue.component = function (id, componentDef) {
        // extend方法肯定是父类的， 这里this就是Vue
        componentDef.name = componentDef.name || id;
        // 第二个参数是调用过extend之后返回的值（Vue.component默认会调用extend）
        componentDef = this.extend(componentDef); // extend返回子类的构造函数
        this.options.components[id] = componentDef; // 全局方法都保存在options中

    }
    Vue.extend = function (componentDef) {
        // 生成子类
        const Sub = function vueComponent(options) {
            // this -> Sub的实例，Sub中没有_init方法，会去Vue.prototype上找到_init方法调用
            // _init合options，初始化（data, watcher...),如果有el，进行挂载
            this._init(options)
        }
        // this -> Vue
        Sub.prototype = Object.create(this.prototype)
        Sub.prototype.constructor = Sub;
        // 子类的全局属性 = Vue的全局属性与自己传入的属性合并
        // todo: 合并的时候，构造一个父子关系 将 Vue全局的options和组件传入的options合并
        Sub.options = mergeOptions(this.options, componentDef)
        // new Sub({}).$mount()
        // console.log(Sub.options, 666)
        return Sub
    }
}


