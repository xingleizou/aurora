import { defineStore } from 'pinia'

export const useMetaStore = defineStore('metaStore', {
  state: () => {
    return {
      title: '邹星星的个人博客' // 修改这里
    }
  }
})
