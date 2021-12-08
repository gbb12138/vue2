import babel from 'rollup-plugin-babel' // 让rollup打包的时候可以采用babel

// 选用rollup的原因是打包js类库，体积小，rollup主要就是专注于打包js模块， webpack适用应用
export default {
    input: "./src/index.js", // 打包的入口
    output: {
        file: 'dist/vue.js', // 打包后的文件存放的地方
        format: 'umd', // 统一模块规范，支持commonJs， amd, 和 window.Vue挂载三种形式
        name: 'Vue', // 打包后挂载在window.vue下
        sourcemap:true, // 为了增加调试功能
    },
    plugins:[
        babel({
            exclude: "node_module/**", // 不去编译node_modules下的文件夹
        })
    ]
}
