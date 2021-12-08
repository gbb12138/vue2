//组件：
// 1。声明组件的映射关系Vue.component   {components: xxx}
//2。根据组件的名字生成组件的虚拟节点
//3。创造组件的实例，替换原来的渲染内容
const isResrved = (tag) => {
    return ['a','div','p','span','ul','li','button','input'].includes(tag);
}
export function createElement(vm, tag, props = {}, children) {
    // 判断tag是元素还是组件
    if (isResrved(tag)) {
        // 是元素
        return vnode(vm, tag, props, children, undefined, props.key)
    } else {
        // 是组件,根据当前组件生成一个虚拟节点，组件的虚拟节点
        // 通过组件名称找到对应的组件定义
        // 组件的虚拟节点是为了后续生成真实Dom提供的  Vue.extend({template})   => Sub
        const Ctor = vm.$options['components'][tag];
       return createComponent(vm, tag, props, children, Ctor)
    }
}
function createComponent (vm, tag, props, children, Ctor) {
    if (typeof Ctor === 'object') {  // 如果是对象，使用extend变成函数
        Ctor = vm.constructor.extend(Ctor);
    }
    props.hook = {
        init(vnode){  // 初始化组件，组件的虚拟节点上有一个componentOptions
            // new Sub()时会调用_init()
            let child = vnode.componentInstance = new vnode.componentOptions.Ctor({});
            // 组件内部产生了真实节点，挂载到了child.$el / vnode.componentInstance.$el
            child.$mount(); // 将组件挂载后的结果放到$el属性上
        },
        prepatch(){},
    }
     return (vnode('vm', 'vue-component-' + tag, props, undefined, undefined,
         props.key, {Ctor, children}))
}
export function createTextElement (vm, text) {
    return vnode(vm, undefined, undefined, undefined, text)
}
// 如果是组件componentOptions包含组件的构造方法
function vnode (vm, tag, props, children, text, key, componentOptions) {
    return {
        vm, tag, props, children, text, key,componentOptions
    }
}
// 标签名相同，key相同，就是相同的Vnode
export function isSameVnode (oldVnode, newVnode) {
    return oldVnode.tag === newVnode.tag && oldVnode.key === newVnode.key;
}
