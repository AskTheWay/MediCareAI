# 02 模块与 API 说明

## 1. 页面模块总览

| 页面 | 路径 | 主要职责 |
|---|---|---|
| 登录 | `pages/login` | 患者登录、会话进入 |
| 注册 | `pages/register` | 患者注册、字段校验 |
| 首页 | `pages/dashboard` | 用户信息、统计、最近病历入口 |
| 症状提交 | `pages/symptom-submit` | 创建病历、上传资料、触发 AI 诊断 |
| 病历记录 | `pages/medical-records` | 病历列表、详情、医生评论与患者回复 |
| 个人资料 | `pages/profile` | 资料编辑、慢病管理、疾病字典选择 |

## 2. 每页核心逻辑

### 2.1 登录页
- 文件：`pages/login/index.js`
- 核心行为：
  - 邮箱与密码校验（含邮箱格式）。
  - 调 `authApi.login`，载荷 `platform: 'patient'`。
  - 成功后写入 token 并跳转首页。

### 2.2 注册页
- 文件：`pages/register/index.js`
- 核心行为：
  - 必填校验、密码长度/一致性校验。
  - 邮箱、手机号格式校验。
  - 注册成功后回登录并回填邮箱。

### 2.3 首页
- 文件：`pages/dashboard/index.js`
- 核心行为：
  - `requireLogin()` 校验会话；
  - 先显示用户信息，再拉病历统计；
  - `role` 映射中文：患者/医生/管理员。

### 2.4 症状提交页
- 文件：`pages/symptom-submit/index.js`
- 核心行为：
  - 收集症状参数；
  - 创建病历；
  - 可选上传多个文件并触发抽取；
  - 调 AI 诊断接口并展示结果；
  - 上传失败时不中断整体诊断流程（给出提示）。

### 2.5 病历记录页
- 文件：`pages/medical-records/index.js`
- 核心行为：
  - 拉取病历列表并按时间排序；
  - 关键词过滤；
  - 打开详情后拉评论并可回复；
  - 严重程度与状态中文映射。

### 2.6 个人资料页
- 文件：`pages/profile/index.js`
- 核心行为：
  - 同步 `auth/me` 与 `patients/me`；
  - 保存账号资料与患者资料；
  - 慢病列表加载、添加、删除；
  - 疾病字典选择，严重程度显示中文、提交仍用英文枚举。

## 3. API 抽象层

### 3.1 配置
- 文件：`utils/config.js`
- 当前环境：`API_ENV = 'local'`
- 默认地址：
  - `local`: `http://127.0.0.1:8000/api/v1`
  - `lan`: `http://192.168.1.100:8000/api/v1`（需按本机网段修改）
  - `remote`: `https://8.137.177.147/api/v1`

### 3.2 请求封装
- 文件：`utils/request.js`
- 特性：
  - 自动拼接 URL；
  - 标准化响应载荷；
  - 401 自动刷新 token；
  - 刷新失败清会话并跳登录；
  - 网络错误中文语义化（含 `request:fail` 场景）。

### 3.3 API 映射
- 文件：`utils/api.js`
- 模块：
  - `authApi`
  - `patientApi`
  - `casesApi`
  - `aiApi`
  - `documentsApi`
  - `sharingApi`
  - `diseaseApi`

### 3.4 病历接口注意事项
- `casesApi.list/create` 使用 `/medical-cases/`（尾斜杠）以规避重定向风险。

## 4. 样式体系
- 全局样式：`app.wxss`
- 当前包含：
  - 卡片层级
  - 表单控件（input/picker/textarea 区分样式）
  - 按钮体系（primary/secondary/neutral/mini）
  - 状态提示（error/info/success）
  - 空态提示 `empty-tip`
- 真机兼容点：
  - 按钮采用 `flex` 居中；
  - 输入框单行高度固定，避免显示错位。
