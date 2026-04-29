# 00 总览与关键决策

## 1. 背景
- 源项目：`https://github.com/HougeLangley/MediCareAI`
- 用户目标：在 `MediCareAI` 下完成微信小程序前端，并适配现有后端服务。
- 本轮重点：在既有页面可用基础上，持续处理联调问题、中文化、交互与样式体验。

## 2. 本轮已完成范围
- 小程序页面能力已成型（登录、注册、首页、症状提交、病历、个人资料）。
- 页面可见文案整体中文化。
- API 调用按后端实际接口完成对接（患者端）。
- 网络错误提示增强（尤其是 `request:fail` 相关提示）。
- 样式统一与提示体验优化。
- 按真机反馈修复：输入框显示问题、按钮文字未居中等。

## 3. 核心技术决策

### 3.1 后端兼容优先
- 原则：仅中文化“展示层”，不改后端协议字段。
- 例：`severity` 传值仍为 `mild/moderate/severe`，页面显示映射中文。

### 3.2 患者平台固定
- 请求头固定：`X-Platform: patient`
- 登录载荷固定：`platform: 'patient'`
- 结论：默认是患者端登录逻辑，不是医生/管理员端。

### 3.3 网络失败可读化
- 将微信底层 `request:fail` 转换为用户可读中文：
  - 超时
  - 连接拒绝（后端未启动）
  - HTTPS/证书/协议异常

### 3.4 避免重定向副作用
- 病历接口改为带尾斜杠路径（`/medical-cases/`），减少后端重定向引发的协议异常风险。

### 3.5 真机与模拟器分环境
- `utils/config.js` 里保留 `local/lan/remote` 三套基地址。
- 模拟器可用 `127.0.0.1`，真机需改为同局域网电脑 IP（`lan`）。

## 4. 关键变更汇总（按类型）

### 4.1 文案与本地化
- `app.json`：Tab 文案中文化。
- 全页面 `wxml/json/js` 中文化（标题、字段、按钮、提示、空态）。
- `utils/request.js`、`utils/api.js`、`utils/auth.js` 默认英文错误改中文。

### 4.2 联调稳定性
- `utils/api.js`：`casesApi.list/create` 改为 `/medical-cases/`。
- `pages/dashboard/index.js`：先展示用户信息，再拉病历统计，避免失败时首页个人信息空白。
- `utils/request.js`：网络异常文本增强。

### 4.3 视觉与交互
- `app.wxss`：统一卡片、按钮、输入框、状态提示、空态样式。
- 登录/注册/首页/症状/病历/资料页加入辅助文案和状态条。
- 按钮居中改为 `flex`，修复真机不居中问题。

## 5. 当前目录关键结构
- 页面目录：`pages/login`, `pages/register`, `pages/dashboard`, `pages/symptom-submit`, `pages/medical-records`, `pages/profile`
- API 层：`utils/api.js`
- 请求与鉴权：`utils/request.js`, `utils/auth.js`, `utils/storage.js`
- 全局样式：`app.wxss`

## 6. 当前已知边界
- `README.md` 仍主要是英文说明，可后续补中文版或双语版。
- 环境切换目前依赖手动改 `utils/config.js`，无可视化开关。
