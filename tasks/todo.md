# Aurora 博客部署到宝塔面板（阿里云专享版 9.2.0）

> 服务器配置：2核2G | 系统：CentOS（宝塔面板阿里云专享版 9.2.0）
> 存储方案：阿里云 OSS（已配置） | 搜索策略：MySQL（2核2G 不装 ES）

---

## 部署架构

```
宝塔面板
 ├── 软件商店安装 MySQL 5.7/8.0 (端口3306)
 ├── 软件商店安装 Redis (端口6379)
 ├── Docker 安装 RabbitMQ (端口5672, 15672)
 ├── 手动运行 Spring Boot JAR (端口8090)
 └── 宝塔网站 → Nginx 托管前端静态文件 (端口80/443)
```

## 待办列表

### 第一阶段：服务器环境准备

- [ ] **1. 服务器基础设置**
  - 登录宝塔面板
  - 在宝塔"安全"中放行端口：`8090`(后端), `5672`(RabbitMQ), `15672`(RabbitMQ管理)
  - 设置安全组（阿里云控制台）：放行上述端口
  - 检查系统盘空间，建议 >= 20GB

- [ ] **2. 通过宝塔软件商店安装 MySQL**
  - 宝塔面板 → 软件商店 → 搜索 MySQL
  - 安装 MySQL 5.7 或 8.0（推荐 5.7，2核2G 更省内存）
  - 安装完成后：设置 root 密码，创建数据库 `aurora`，字符集 `utf8mb4`

- [ ] **3. 通过宝塔软件商店安装 Redis**
  - 宝塔面板 → 软件商店 → 搜索 Redis
  - 安装 Redis（安装时设置密码，例如 `123456`）

- [ ] **4. Docker 安装 RabbitMQ**
  ```bash
  # 宝塔终端执行
  docker run -d --name rabbitmq --restart=always \
    -p 5672:5672 -p 15672:15672 \
    -e RABBITMQ_DEFAULT_USER=admin \
    -e RABBITMQ_DEFAULT_PASS=admin \
    rabbitmq:management
  ```

### 第二阶段：后端部署

- [ ] **5. 打包后端项目**
  本地操作（需要有 Maven 和 Java 8）：
  ```bash
  cd D:\idea code\aurora\aurora-springboot
  mvn clean package -DskipTests
  ```
  生成 `target/aurora-springboot-0.0.1.jar`

- [ ] **6. 上传 JAR 到服务器**
  - 宝塔面板 → 文件 → 创建目录 `/usr/local/aurora-springboot`
  - 将 `aurora-springboot-0.0.1.jar` 上传到此目录

- [ ] **7. 修改后端配置并上传**
  修改 `application-prod.yml` 中的配置：
  - `spring.datasource.url` → MySQL 连接地址（可用 `localhost` 因为都在本机）
  - `spring.datasource.password` → 你设置的 MySQL root 密码
  - `spring.redis.password` → 你设置的 Redis 密码
  - `spring.rabbitmq.host` → `localhost`（RabbitMQ 在本机 Docker 中）
  - `spring.rabbitmq.username/password` → Docker 启动时设置的用户名密码
  - `website.url` → 改为你的域名或服务器 IP
  将修改后的配置文件上传到 `/usr/local/aurora-springboot/application-prod.yml`

- [ ] **8. 导入数据库**
  宝塔面板 → 数据库 → 导入 `aurora.sql`（项目根目录下找）
  如果没有现成的 sql 文件，需要通过宝塔导入或终端导入

- [ ] **9. 启动后端服务**
  宝塔终端执行：
  ```bash
  # 安装 Java 8（宝塔软件商店可能没有，用 yum）
  yum install -y java-1.8.0-openjdk

  # 启动后端（测试运行）
  cd /usr/local/aurora-springboot
  nohup java -jar aurora-springboot-0.0.1.jar \
    --spring.config.location=./application-prod.yml \
    > /usr/local/aurora-springboot/log.log 2>&1 &

  # 检查是否启动成功
  tail -f /usr/local/aurora-springboot/log.log
  ```

  **内存优化**：2核2G 环境下，建议添加 JVM 参数限制内存：
  ```bash
  nohup java -Xms256m -Xmx512m -jar aurora-springboot-0.0.1.jar \
    --spring.config.location=./application-prod.yml \
    > /usr/local/aurora-springboot/log.log 2>&1 &
  ```

### 第三阶段：前端部署

- [ ] **10. 打包前端项目**
  本地操作（需要 Node.js）：
  ```bash
  # 打包前台博客
  cd D:\idea code\aurora\aurora-vue\aurora-blog
  npm install
  npm run build
  # 打包完成后 dist/ 目录重命名为 blog

  # 打包后台管理
  cd D:\idea code\aurora\aurora-vue\aurora-admin
  npm install
  npm run build
  # 打包完成后 dist/ 目录重命名为 admin
  ```

  **关键修改**（部署前检查）：
  - `aurora-blog/src/config/config.ts` → 检查 `TENCENT_CAPTCHA` 和 `QQ_APP_ID` 配置
  - `aurora-blog/public/index.html` → 检查 QQ 登录相关配置
  - 如果没有 HTTPS，注释掉 `public/index.html` 中的 `<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests" />`

- [ ] **11. 上传前端静态文件到服务器**
  宝塔面板 → 文件 → 创建目录 `/usr/local/aurora-vue`
  将 `blog` 和 `admin` 两个目录上传到 `/usr/local/aurora-vue/` 下

### 第四阶段：Nginx 反向代理

- [ ] **12. 宝塔面板添加网站**
  宝塔面板 → 网站 → 添加站点：
  - **前台站点**：域名（如 `blog.yourdomain.com`），根目录 `/usr/local/aurora-vue/blog`
  - **后台站点**：域名（如 `admin.yourdomain.com`），根目录 `/usr/local/aurora-vue/admin`
  
  如果没有域名，可以使用 IP + 端口方式（如 IP:8066 前台，IP:8067 后台）

- [ ] **13. 配置 Nginx 反向代理（API 转发）**
  在每个站点的 Nginx 配置中，添加 API 反向代理：
  ```nginx
  location ^~ /api/ {
      proxy_pass http://127.0.0.1:8090/;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
  ```
  在宝塔面板的网站设置 → 配置文件 中直接修改

### 第五阶段：验证与收尾

- [ ] **14. 验证部署**
  - 访问前台博客页面
  - 访问后台管理页面（默认账号：admin@163.com / 123456）
  - 测试文章浏览、搜索等功能
  - 检查后端日志有无报错

- [ ] **15. 配置开机自启**
  编写系统服务或使用宝塔的计划任务：
  ```bash
  # 宝塔 → 计划任务 → 添加 Shell 脚本
  # 任务内容：检测后端进程是否存在，不存在则重启
  ```

---

## 内存管理建议（2核2G 关键！）

| 服务 | 预计内存占用 | 说明 |
|------|------------|------|
| MySQL 5.7 | ~300MB | 宝塔安装，可限制 `performance_schema=OFF` |
| Redis | ~50MB | 宝塔安装 |
| RabbitMQ | ~200MB | Docker 安装 |
| Java 后端 | ~512MB | `-Xms256m -Xmx512m` 限制 |
| Nginx | ~50MB | 宝塔自带 |
| 系统 + 宝塔 | ~600MB | 开销 |
| **总计** | **~1.7GB** | 预留 ~300MB 余量，基本够用 |

如果内存不足：
1. 降低 MySQL `innodb_buffer_pool_size` 到 256MB
2. Java 后端限制到 `-Xmx384m`
3. 关闭不用的宝塔插件

---

## 注意事项

1. **阿里云安全组**：宝塔面板放行端口后，还需要在阿里云控制台安全组中放行对应端口
2. **数据库备份**：部署完成后立即设置宝塔面板的数据库自动备份
3. **OSS 配置**：项目已配置阿里云 OSS，**不需要** minio，省去大量内存
4. **RabbitMQ**：如果用不到消息队列功能，可以考虑不装 RabbitMQ，省 ~200MB 内存
5. **防火墙**：宝塔面板自带防火墙，确保没有阻挡需要的端口
