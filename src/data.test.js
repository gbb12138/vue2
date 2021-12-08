function Vue () {

}
Vue.extend = function (options) {
    function Sub() {
        this.data = Sub.options.data()
    }
    Sub.options = options
    return Sub
}
let Sub = Vue.extend({ // 相当于创建了一个组件
    // data: {
    //     name: 'zf'
    // }
    data() {
        return {
            name: 'zf'
        }
    }
})

let s1 = new Sub() // 组件的实例
let s2 = new Sub() // 组件的实例

console.log(s1.data)
s1.data.name = '111'
console.log(s2.data)
