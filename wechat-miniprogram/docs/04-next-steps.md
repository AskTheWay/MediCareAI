# 04 后续建议与待办

## P0（建议优先）
1. 环境切换可视化
- 现状：`utils/config.js` 手工改 `API_ENV`。
- 建议：增加 `project.private.config.json` 或本地常量开关说明，减少误配。

2. 完善错误展示一致性
- 现状：多数页面已中文可读，但 `toast/modal/inline status` 仍可进一步统一。
- 建议：抽一个统一 `showError/showSuccess` 工具。

3. README 双语同步
- 现状：`wechat-miniprogram/README.md` 仍以英文为主，部分路径描述未覆盖最近改动（样式和中文化）。
- 建议：补一版中文操作手册 + 联调 FAQ。

## P1（体验增强）
1. 主题变量化
- 将颜色和间距抽成 CSS 变量（或统一常量块），便于后续改主题。

2. 首页信息增强
- 可增加“最近一次诊断时间/状态”提示。

3. 症状提交流程增强
- 文件上传进度条（非文字）；
- 上传失败文件可重试列表。

4. 病历详情可读性
- 时间统一格式化；
- 评论区支持收起/展开和长文本截断。

## P2（工程化）
1. 端到端回归清单
- 登录、注册、资料保存、提交诊断、评论回复、慢病管理。

2. 轻量自动检查脚本
- JSON 编码检查（无 BOM）；
- JS 语法检查；
- 关键文案残留英文扫描。

3. 文案与枚举映射集中化
- 将 `role/status/severity` 映射统一放 `utils/constants.js`，避免多处分散。

## 交接给下一位 AI 的建议
1. 先读 `docs/HANDOVER_INDEX.md` 和 `docs/03-troubleshooting.md`。
2. 联调前先确认 `utils/config.js` 环境地址。
3. 优先保证网络链路正确，再做页面细节优化。
