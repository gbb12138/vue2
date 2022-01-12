const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // 标签名
const qnameCapture = `((?:${ncname}\\:)?${ncname})`; // div:XXX 明名空间, match匹配的是标签名
const startTagOpen = new RegExp(`^<${qnameCapture}`); // 标签开头的正则 捕获的内容是标签名
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配标签结尾的</div>
// 匹配属性 a = "b" a = 'b' a = b， 3 ｜ 4 ｜ 5
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>']+)))?/
const startTagClose = /^\s*(\/?)>/; // 匹配标签结束的 </  />


// <div id="app" a=1 b=2>哈哈{{age}} <span>{{name}}</span></div>
// {
//     tag: 'div',
//     type: 1,
//     children: [{text: '哈哈{{age}}', type: 3, parent: div对象}, {tag: 'span', type: 1,...}],
//     attr: [{name: id, value: 'app'}],
//     parent: null
// }

//解析HTML，从左到右匹配，解析后删除匹配过的片段，直到HTML为空，说明匹配完了
export function parseHTML (html) {
    function advance (len) {
        html = html.substring(len)
    }
    function parseStartTag () {
        const start = html.match(startTagOpen)
        if (start) {
            // 匹配到开头是开始标签
            const match = {
                tagName: start[1],
                attrs:[]
            }
            advance(start[0].length) // 将匹配到的开始标签片段删除
            let attr;
            let end;
            // 继续匹配属性, 直到遇到>
            while(!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
                match.attrs.push({
                    name: attr[1],
                    value: attr[3] || attr[4] || attr[5]
                })
                advance(attr[0].length)
            }
            advance(end[0].length)
            return match
        }
        return false
    }
    // 生成一棵树， 利用栈，遇到开始标签就入栈，遇到结束标签就出栈，判断父节点就找栈顶元素
    // 返回开始标签的标签名，属性
    let root = null
    let stack = [];
    let parent = null
    function createstElement (tag, attrs) {
        return {
            tag,
            type: 1,
            attrs,
            children: [],
            parent: null
        }
    }
    function start (tagName, attrs) {
        // console.log(tagName, attrs, '开始标签')
        let element = createstElement(tagName, attrs)
        if (!root) {
            root = element
        }
        // 开始标签， 入栈
        let parent = stack[stack.length - 1] // [div]
        if (parent) { // 当放入span的时候，找到栈顶是div， 那span的父元素就是div
            element.parent = parent
            parent.children.push(element) // div的子元素就找到了，当前的span元素
        }
        stack.push(element) // [div，span]  再放入当前的span
    }

    function chars (text) {
        // console.log(text, '处理文本')
        let parent = stack[stack.length - 1] // 拿到栈顶元素
        text = text.replace(/\s|\n/g, "") // 文本遇到空格就删除
        parent.children.push({ // 将文本内容，加入到当前父元素的子元素列表中
            text,
            type: 3
        })
    }
    // 结束标签， 出栈
    function end (tagName) {
        // console.log(tagName, '结束标签')
        stack.pop()
    }
    while (html) { // html只有一个根结点
        let textEnd = html.indexOf('<')
        if (textEnd === 0) { // 开头是<, 不是开始标签，就是结束标签
            const startTagMatch = parseStartTag()
            if (startTagMatch) {
                // 生成开始标签的虚拟节点{ attrs: [], children: [],parent: {},tag: "span",type: 1 }
                start(startTagMatch.tagName, startTagMatch.attrs)
                continue
            }
            // 如果代码走到这，说明匹配到了结束标签
            let endTagMatch = html.match(endTag)
            if (endTagMatch) { // 匹配到了结束标签
                end(endTagMatch[1])
                advance(endTagMatch[0].length)
            }
        }
        // 处理文本
        let text;
        if (textEnd > 0) {
            text = html.substring(0, textEnd)
        }
        if (text) {
            chars(text)
            advance(text.length)
        }
    }
    return root; // 返回ast树根结点
}
