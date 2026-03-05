# MediCareAI Android 患者端 App

MediCareAI Android 患者端应用程序 - 基于 Jetpack Compose 和 Kotlin 开发的智能疾病管理系统移动端应用。

## 功能特性

- **欢迎页面**: 展示 MediCareAI Logo、项目简介、登录和注册按钮
- **用户认证**: 
  - 患者登录（对接 VPS 后端 API）
  - 患者注册（含邮箱验证）
- **个人中心**: 
  - 查看和编辑个人信息
  - 管理健康档案
- **症状提交**: 
  - 描述症状并提交
  - AI 智能诊断分析
  - 查看诊断结果
- **诊疗记录**: 
  - 查看历史诊疗记录
  - 查看 AI 诊断详情
  - 查看医生反馈

## 技术栈

- **UI 框架**: Jetpack Compose
- **编程语言**: Kotlin
- **架构**: MVVM + Repository 模式
- **依赖注入**: Hilt
- **网络请求**: Ktor Client
- **序列化**: Kotlinx Serialization
- **异步处理**: Kotlin Coroutines & Flow

## 配色方案

遵循原项目配色：
- 主色调: `#667eea` (蓝紫色渐变) → `#764ba2`
- 背景色: `#f5f5f5`
- 强调色: `#ffd700` (金色 VIP 标识)

## 项目结构

```
android/
├── app/
│   ├── src/main/java/com/medicareai/patient/
│   │   ├── data/
│   │   │   ├── api/           # API 客户端
│   │   │   ├── model/         # 数据模型
│   │   │   └── repository/    # 数据仓库
│   │   ├── di/                # 依赖注入模块
│   │   ├── ui/
│   │   │   ├── screens/       # 页面屏幕
│   │   │   ├── components/    # 可复用组件
│   │   │   └── theme/         # 主题配置
│   │   ├── viewmodel/         # 视图模型
│   │   ├── MainActivity.kt    # 主活动
│   │   └── MediCareAIApplication.kt # 应用入口
│   └── res/                   # 资源文件
└── build.gradle.kts          # 构建配置
```

## API 配置

应用连接 VPS 后端 API: `https://8.137.177.147/api/v1/`

主要 API 端点:
- `POST /auth/login` - 用户登录
- `POST /auth/register` - 用户注册
- `GET /auth/me` - 获取当前用户
- `GET /patients/me` - 获取患者档案
- `GET /medical-cases` - 获取诊疗记录
- `POST /medical-cases` - 创建诊疗记录
- `POST /ai/comprehensive-diagnosis` - AI 诊断

## 构建说明

### 环境要求

- Android Studio Hedgehog (2023.1.1) 或更高版本
- JDK 17
- Android SDK 34
- Gradle 8.4

### 构建步骤

1. 使用 Android Studio 打开 `android` 文件夹
2. 等待 Gradle 同步完成
3. 连接 Android 设备或启动模拟器
4. 点击 "Run" 按钮构建并运行应用

### 命令行构建

```bash
cd android
./gradlew assembleDebug
```

生成的 APK 位于: `app/build/outputs/apk/debug/app-debug.apk`

## 权限说明

应用需要以下权限:
- `INTERNET` - 连接后端 API
- `ACCESS_NETWORK_STATE` - 检测网络状态

## 安全说明

- 应用使用 HTTPS 与后端通信
- 用户认证使用 JWT Token
- Token 存储在应用私有存储中

## 作者

- **作者**: 苏业钦
- **License**: MIT

## 致谢

感谢使用 MediCareAI 智能疾病管理系统！