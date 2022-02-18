import {isSameVnode} from "./index";

/**
 * 创建真实节点，并返回
 * @param oldVnode
 * @param vnode
 * @returns {*|Text}
 */
export function patch(oldVnode, vnode) {
    // 处理组件渲染，组件渲染的时候child.$mount(); 没有el，oldVnode为空
    if (!oldVnode) {
        // 创造真实节点
        return createElm(vnode);
    }
    if (oldVnode.nodeType === 1) {
        // 初始化渲染操作, oldVnode是真实节点
        // console.log('初始化渲染操作', oldVnode, vnode)
        // 根据虚拟节点创建真实节点，先根据虚拟节点创建一个真实节点，将节点插入到页面中，再将老的节点删除
        // 为什么$mount不能指定body和html， 因为有一个替换操作
        const elm = createElm(vnode)
        // 直接扔到body中不行吗， 挂载节点后面可能有其他内容，不改变内容的显示位置
        // 1。获取oldVnode的父节点，2 将新节点插入原来节点的后一个，3 将原来节点删除
        const parentElm = oldVnode.parentNode
        parentElm.insertBefore(elm, oldVnode.nextSibling)
        parentElm.removeChild(oldVnode)
        return elm;
    } else {
        // 更新虚拟节点
        patchVnode(oldVnode, vnode)
        return vnode.el;  //返回新的el元素
    }
}

/**
 * 对比新旧虚拟节点，更新节点属性，子节点
 * @param oldVnode
 * @param vnode
 * @returns {string|(() => Promise<string>)|(() => string)|any}
 */
function patchVnode (oldVnode, vnode) {
    // diff算法是同级别比对
    // 需要先对比第一层，第一层一定是一个元素
    // 看一下是否需要复用节点，如果不需要直接删除，重新创建
    if(!isSameVnode(oldVnode, vnode)) {
        // 不是相同的元素，直接用新的虚拟节点生成的真是节点去替换旧的节点
        //oldVnode.el保存的是虚拟节点对应的真实节点
        return oldVnode.el.parentNode.replaceChild(createElm(vnode), oldVnode.el)
    }
    // 如果是文本或者元素，前后都一样， 需要复用老的元素
    let el = vnode.el = oldVnode.el
    // 如果是相同节点，判断是不是文本，文本只需要用新的文本替换老的文本
    // 有tag就是元素，没有就是文本， 标签名可能一样，都是undefined, 那可能就是文本
    if (!oldVnode.tag) { // 这里是文本
        if (oldVnode.text !== vnode.text) { // 文本变化
            return oldVnode.el.textContent = vnode.text
        }
    }
    // 两个都是相同标签的元素， 更新属性
    updateProperties(vnode, oldVnode.props);
    // 处理子节点
    // 比对完外部标签后，进行儿子对比
    // 儿子和儿子之间的关系，1）两方都有儿子， 特殊，diff
    // 1方有儿子，1方没有儿子
    // 两方都是文本
    let newChildren = vnode.children || {}
    let oldChildren = oldVnode.children || {}
    if (oldChildren.length > 0 && newChildren.length > 0) { // 都有儿子
        updateChildren(el, oldChildren, newChildren)
    } else if (oldChildren.length > 0) { // 老的有儿子, 新的没儿子, 移除老的元素
        el.innerHTML = ""
    } else if (newChildren.length > 0) { // 新的有儿子， 老的没儿子， 将新虚拟节点创建的真实节点加入
        newChildren.forEach(child => el.appendChild(createElm(child)))
    }
}

/**
 * 更新子元素
 * @param el 新的虚拟节点对应的真实元素
 * @param oldChildren
 * @param newChildren
 */
function updateChildren (el, oldChildren, newChildren) {
    // vue2对常见dom操作做了一些优化
    // push shift pop unshift reverse sort api经常被用到，考虑对这些情况做一些优化
    // 内部采用了双指针的方式
    let oldStartIndex = 0;
    let oldEndIndex = oldChildren.length - 1;
    let newStartIndex = 0;
    let newEndIndex = newChildren.length - 1;
    let oldStartVnode = oldChildren[oldStartIndex];
    let oldEndVode = oldChildren[oldEndIndex];
    let newStartVnode = newChildren[newStartIndex];
    let newEndVnode = newChildren[newEndIndex];

    let map = makeIndexByKey(oldChildren);  // 给旧节点造索引，索引就是key
    // 如果对比上，移动对比上的指针
    // 只要有一方头尾指针相遇，结束循环
    while(oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
        if (!oldStartVnode) {  // 移动的过程中可能出现，重置为null的老节点， 需要跳过
            oldStartVnode = oldChildren[++oldStartIndex]
        } else if (!oldEndVode) {
            oldEndVode = oldChildren[--oldEndIndex]
        } else if(isSameVnode(oldStartVnode, newStartVnode)) { // 是相同的标签
            // 从头指针开始对比, 尾部插入元素的情况   A B C D -> A B C D E
            // patchVnode中再调用，updateChildren， 递归调用所有子元素走完
            patchVnode(oldStartVnode, newStartVnode);  // 标签一样比属性，属性比完，比children
            oldStartVnode = oldChildren[++oldStartIndex]; // 对比完移动指针
            newStartVnode = newChildren[++newStartIndex];
        } else if (isSameVnode(oldEndVode, newEndVnode)) {
            // 从头部插入元素   A B C D => E A B C D
            patchVnode(oldEndVode, newEndVnode);  // 标签一样比属性，属性比完，比children
            oldEndVode = oldChildren[--oldEndIndex]; // 对比完移动指针
            newEndVnode = newChildren[--newEndIndex];
        } else if (isSameVnode(oldStartVnode, newEndVnode)) { // 头部移动到尾部
            // A B C D => D C B A
            patchVnode(oldStartVnode, newEndVnode);
            // 移动旧节点，将当前对比上的节点，插入到最后一个旧节点的后面
            // insertBefore是具备移动性的，移动走了，原来的就不存在了
            el.insertBefore(oldStartVnode.el, oldEndVode.el.nextSibling)
            oldStartVnode = oldChildren[++oldStartIndex];
            newEndVnode = newChildren[--newEndIndex];
        } else if (isSameVnode(oldEndVode, newStartVnode)) { // 尾部移动到头部
            // A B C D => D A B C
            patchVnode(oldEndVode, newStartVnode);
            el.insertBefore(oldEndVode.el, oldStartVnode.el)
            oldEndVode = oldChildren[--oldEndIndex]
            newStartVnode = newChildren[++newStartIndex]
            // 四种优化策略
        } else {
            // 在对列表操作的时候，需要设置key（key不能是索引）
            // 乱序比对，需要造一个映射表，去搜索看是否存在，如果存在就复用
            // 需要拿新的第一个key，去老的映射表里找
            let moveIndex = map[newStartVnode.key]
            if (moveIndex == undefined) {
                // 创建新的节点，插入到oldStartVnode之前
                // todo: ????
                el.insertBefore(createElm(newStartVnode), oldStartVnode.el)
            } else {
                // 找到了，需要复用，移动到oldStartVnode之前
                let moveVnode = oldChildren[moveIndex]
                patchVnode(moveVnode, newStartVnode); // 能复用，对比属性，儿子节点
                el.insertBefore(moveVnode.el, oldStartVnode.el);
                oldChildren[moveIndex] = null; // 移动完之后，将节点置空
            }
            newStartVnode = newChildren[++newStartIndex];
        }
    }
    // 老的开始节点，结束节点之间的，删除
    if (oldStartIndex <= oldEndIndex) {
        for(let i = oldStartIndex; i<= oldEndIndex; i++) {
            let child = oldChildren[i];
            if (child !== null) {
                el.removeChild(child.el);
            }
        }
    }
    // 对比完之后，新虚拟节点头尾指针没有相遇，说明新虚拟节点比就虚拟节点插入(从头插入，从尾插入)了元素
    if(newStartIndex <= newEndIndex) {
        for (let i = newStartIndex; i <= newEndIndex; i++) {
            // 找尾指针的下一个元素，如果有则是 头部插入了，如果没有则是在尾部插入了
            let anchor = newChildren[newEndIndex + 1] === null ? null : newChildren[newEndIndex + 1].el;
            // insertBefore， 第一个参数：要插入的节点对象， 第二个参数：不必填， 不传入或null，会在尾部插入新节点
            el.insertBefore(createElm(newChildren[i]), anchor)   //将新创建的元素加入到DOM
        }
    }

    function makeIndexByKey (oldChildren) {
        let map = {};
        oldChildren.forEach((item, index) => {
            map[item.key] = index;
        })
        return map;
    }

}

/**
 * oldProps可能不存在，如果存在就表示更新，不存在则创建元素
 * 更新属性
 * @param vnode
 * @param oldProps
 */
function updateProperties (vnode, oldProps = {}) {
    let newProps = vnode.props || {};
    let el = vnode.el
    // 比较属性是否一致：
    // 老的有新的没有，将老的删除掉；
    // 新的有老的有，替换成新的；
    // 新的有，老的没有，替换成新的

    // 单独处理样式
    let oldStyle = oldProps.style || {}
    let newStyle = newProps.style || {}
    for(let key in oldStyle) {  // 老的有样式，新的没有的样式， 清空
        if (!(key in newStyle)) {
           el.style[key] = ''
        }
    }
    for(let key in oldProps) { // 老的有的属性，新的没有的属性，清除
        if (!(key in newProps)) {
            el.removeAttribute(key)
        }
    }

    for (let key in newProps) { // 新的有的属性，用新的
        if(key === 'style') {
            // 样式单独处理
            for(let styleName in newStyle) {
                // 添加新的有的样式，直接赋值给真实节点
                el.style[styleName] = newStyle[styleName]
            }
        } else {
            el.setAttribute(key, newProps[key])
        }
    }
}

/**
 * 创建真实节点
 * @param vnode
 * @returns {any | Text}
 */
export function createElm (vnode) {
    // debugger
    const {tag, props, children, text} = vnode
    if (typeof tag === 'string') {
        if(createComponent(vnode)) {
            // 是组件
            return vnode.componentInstance.$el;
        } else {
            // 元素
            vnode.el = document.createElement(tag) //将创建的真实DOM和虚拟DOM映射，方便后续更新和复用
            updateProperties(vnode)  // 给vnode.el添加属性
            // 将子节点放入， 递归放入所有节点
            children && children.forEach(child => {
                vnode.el.appendChild(createElm(child))
            })
        }
    } else {
        // 文本, 文本节点直接放入文本
        vnode.el = document.createTextNode(text)
    }
    return vnode.el
}

function createComponent (vnode) {
    // 组件的props中有一个hook属性
    let i = vnode.props;
    if ((i = i.hook) && (i = i.init)) {
        i(vnode);  // 组件的init(vnode)
    }
    if(vnode.componentInstance) {  // 是组件
        return true;
    }
    return false;
}
