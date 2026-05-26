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
  // 移除可能已存在的 .vue 后缀，避免与拼接的后缀重复
  const cleanView = view.replace(/\.vue$/, '')
  return () => import(`@/views${cleanView}.vue`)
}
