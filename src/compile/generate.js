const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; //{{ dasdsaf }}
// html ---------------->
// <div id="app" a="1" b="2">
//     哈哈{{age}}
//     <span>
//         {{name}}111
//     </span>
// </div>
// ast 树----------------->
// attrs: (3) [{…}, {…}, {…}]
// children: (3) [{…}, {…}, {…}]
// parent: null
// tag: "div"
// type: 1
// 拼接成render函数------------》
// _c('div', {
//     attrs: {
//         "id": "app",
//         "a": "1",
//         "b": "2"
//     }
// }, [_v("哈哈" + _s(age)), _c('span', [_v(_s(name) + "111")])])

// _c => h() _v 创建文本的虚拟节点 _s => stringfy对象转字符串
export function generate(ast) {
    let children = getChildren(ast)
    let code = `_c("${ast.tag}",${
        ast.attrs.length ? genProps(ast.attrs) : 'undefined'
    }${
        children ? ',[' + children + ']': ''
    })`
    return code;
}
function getChildren (ast) {
    let children = ast.children
    if (children && children.length) {
        return children.map(child => gen(child)).join(',')
    }
    return false
}
function gen(el) {
    if (el.type === 1) {
        return generate(el)
    } else {
        let text = el.text
        if (defaultTagRE.test(text)) { // 文本中有{{}}
            // _v(_s(name) + 'zf' + _s(age))
            let tokens = []
            let match;
            let lastIndex = defaultTagRE.lastIndex = 0 // 保证正则每次都是从0开始
            while(match = defaultTagRE.exec(text)) { // 如果exec全局匹配，每次执行的时候，都需要还原lastIndex
                let index = match.index
                if (index > lastIndex) {
                    tokens.push(JSON.stringify(text.slice(lastIndex, index)))
                }
                tokens.push(`_s(${match[1].trim()})`)
                lastIndex = index + match[0].length
            }
            if (lastIndex < text.length) {
                tokens.push(JSON.stringify(text.slice(lastIndex)))
            }
            return `_v(${tokens.join('+')})`
        } else { // 没有{{}}
            return `_v("${text}")`
        }
    }
}
// 生成属性的render部分
function genProps(attrs) {
    let str = ''
    for(let i = 0; i < attrs.length; i++) {
        let attr = attrs[i]
        if (attr.name === 'style') { // 将style转化成一个对象
            let style = {} // color:red
            attr.value.replace(/([^;:]+)\:([^;:]+)/g, function () {
                style[arguments[1]] = arguments[2]
            })
            attr.value = style
        }
        str += `${attr.name}:${JSON.stringify(attr.value)},`
    }
    return `{${str.slice(0, -1)}}`
}
