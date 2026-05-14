<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-title">管理员登录</div>
      <el-form status-icon :model="loginForm" :rules="rules" ref="ruleForm" class="login-form">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            prefix-icon="el-icon-user-solid"
            placeholder="用户名"
            @keyup.enter.native="login" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            prefix-icon="iconfont el-icon-mymima"
            show-password
            placeholder="密码"
            @keyup.enter.native="login" />
        </el-form-item>
      </el-form>
      <el-button type="primary" @click="login">登录</el-button>
    </div>
  </div>
</template>

<script>
import { generaMenu } from '@/assets/js/menu'
export default {
  data: function () {
    return {
      loginForm: {
        username: '',
        password: ''
      },
      rules: {
        username: [{ required: true, message: '用户名不能为空', trigger: 'blur' }],
        password: [{ required: true, message: '密码不能为空', trigger: 'blur' }]
      }
    }
  },
  methods: {
    login() {
      this.$refs.ruleForm.validate((valid) => {
        if (valid) {
          const that = this
          let param = new URLSearchParams()
          param.append('username', that.loginForm.username)
          param.append('password', that.loginForm.password)
          that.axios.post('/api/users/login', param).then(({ data }) => {
            if (data.flag) {
              that.$store.commit('login', data.data)
              generaMenu()
              that.$message.success('登录成功')
              that.$router.push({ path: '/' })
            } else {
              that.$message.error(data.message)
            }
          })
        } else {
          return false
        }
      })
    }
  }
}
</script>

<style scoped>
.login-container {
  position: fixed;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  background: url(http://zxl-blog1.oss-cn-hangzhou.aliyuncs.com/aurora/photos/f3c1476108d4714d9dc971be1ba275f6391297476.jpg@270w_360h_1s.avif) center center / contain no-repeat;
  background-color: #f5f7fa;
  display: flex;
  justify-content: center;
  align-items: center;
}
.login-card {
  background: transparent;
  backdrop-filter: none;
  padding: 40px 60px;
  width: 400px;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
.login-title {
  color: #303133;
  font-weight: bold;
  font-size: 1.5rem;
  text-align: center;
  margin-bottom: 2rem;
}
.login-form {
  margin-top: 1.2rem;
}
.login-card button {
  margin-top: 1.5rem;
  width: 100%;
}

/* 输入框透明样式 */
.login-card ::v-deep .el-input__inner {
  background-color: rgba(255, 255, 255, 0.3) !important;
  border: 1px solid rgba(255, 255, 255, 0.5) !important;
  color: #303133 !important;
}

.login-card ::v-deep .el-input__inner::placeholder {
  color: rgba(48, 49, 51, 0.6) !important;
}

.login-card ::v-deep .el-input__inner:focus {
  background-color: rgba(255, 255, 255, 0.5) !important;
  border-color: rgba(64, 158, 255, 0.8) !important;
}

.login-card ::v-deep .el-input__prefix {
  color: rgba(48, 49, 51, 0.8) !important;
}
</style>
