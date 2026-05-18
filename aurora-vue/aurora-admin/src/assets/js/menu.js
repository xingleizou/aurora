import Layout from '@/layout/index.vue'
import router from '@/router'
import store from '@/store'
import axios from 'axios'
import Vue from 'vue'

export function generaMenu() {
  axios.get('/api/admin/user/menus').then(({ data }) => {
    if (data.flag) {
      let userMenus = data.data
      userMenus.forEach((item) => {
        if (item.icon != null) {
          item.icon = 'iconfont ' + item.icon
        }
        if (item.component == 'Layout') {
          item.component = Layout
        }
        if (item.children && item.children.length > 0) {
          item.children.forEach((route) => {
            route.icon = 'iconfont ' + route.icon
            route.component = loadView(route.component)
          })
        }
      })
      store.commit('saveUserMenus', userMenus)
      userMenus.forEach((item) => {
        router.addRoute(item)
      })
    } else {
      Vue.prototype.$message.error(data.message)
      router.push({ path: '/login' })
    }
  })
}

export const loadView = (view) => {
  // 使用 ES6 动态 import，Webpack 5 会自动进行代码分割
  return () => import(`@/views${view}.vue`)
}
