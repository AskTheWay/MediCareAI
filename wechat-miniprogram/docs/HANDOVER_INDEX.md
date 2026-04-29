# MediCareAI 小程序交接文档索引

更新时间：2026-03-19

## 目标
本索引用于帮助后来者（人类或 AI）快速理解本轮协作中，小程序前端从创建到联调、中文化、样式优化与排障的完整结果。

## 建议阅读顺序
1. [FULL_CONTEXT_SUMMARY.md](./FULL_CONTEXT_SUMMARY.md)
2. [00-overview.md](./00-overview.md)
3. [01-timeline.md](./01-timeline.md)
4. [02-modules-and-api.md](./02-modules-and-api.md)
5. [03-troubleshooting.md](./03-troubleshooting.md)
6. [04-next-steps.md](./04-next-steps.md)

## 当前状态速览
- 小程序目录：`MediCareAI/wechat-miniprogram`
- 页面：登录、注册、首页、症状提交、病历记录、个人资料
- 可见文案：已基本中文化
- 样式：已完成一版统一美化（卡片、按钮、状态提示、空态）
- 网络错误提示：已增强中文可读性（含 `request:fail` 场景）
- 语法检查：JS 通过 `node --check`（本轮已验证）

## 关键入口文件
- 配置：`utils/config.js`
- 请求封装：`utils/request.js`
- API 映射：`utils/api.js`
- 全局样式：`app.wxss`
- 页面路由：`app.json`
