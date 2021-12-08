import {parseHTML} from "./parser";
import {generate} from "./generate";
export function compileToFunction (html) {
    html = html.replace(/\n/g, '');
    // 编译模版有三步，1：将模版转化为ast树 2：优化，标记静态节点（patchFlag， BlockTree）3：把ast变成render函数
    // 将模版转化为ast树, 1:一个个进行词法解析vue3  2：正则 vue2
    let ast = parseHTML(html)
    // console.log(ast, '语法树');

    // 2。优化，标记静态节点

    // 3。将ast树，变成render函数， 使用字符串拼接的方式生成render函数
    const code = generate(ast)
    const render = new Function (`with(this){return ${code}}`)
    return render
}
