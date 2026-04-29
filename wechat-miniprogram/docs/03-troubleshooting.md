# 03 常见问题与排障手册

## 1. `app.json` 报 Unexpected token（位置 0）

### 现象
- 微信开发者工具报：
  - `SyntaxError: Unexpected token ... in JSON at position 0`

### 根因
- JSON 文件带 UTF-8 BOM。

### 处理
- 将 `app.json` 转为 UTF-8 无 BOM 保存。
- 同时建议检查其他 JSON 文件编码一致性。

---

## 2. 首页出现 `request:fail`

### 现象
- 首页红字显示 `request:fail` 或统计加载失败。

### 常见根因
1. 后端未启动；
2. 地址不可达（真机用错 `127.0.0.1`）；
3. HTTP/HTTPS 协议不一致（如被重定向到 `https://127.0.0.1`）；
4. 超时或网络不稳定。

### 当前代码内置提示
- 请求超时：`请求超时，请检查网络后重试`
- 连接拒绝：`无法连接后端服务，请确认服务已启动`
- HTTPS 异常：`网络请求失败：HTTPS证书或协议异常...`

### 快速定位步骤
1. 看 `utils/config.js` 的 `API_ENV`；
2. 看开发者工具 Network 的真实 Request URL；
3. 确认协议与后端监听一致（`http` 或 `https`）；
4. 确认端口可达（默认后端 8000）。

---

## 3. 真机调试无法访问本地后端

### 现象
- 模拟器能用，真机报网络失败。

### 根因
- 真机上的 `127.0.0.1` 指向手机自身，不是开发电脑。

### 处理
1. `utils/config.js` 切到 `lan`；
2. 将 `lan` 地址改为电脑局域网 IP（如 `192.168.x.x`）；
3. 手机与电脑需同一局域网；
4. 已在开发者工具勾选“开发环境不校验请求域名/证书”（仅调试）。

---

## 4. 登录成功但显示不是预期角色/无法通用 Web 账号

### 说明
- 小程序当前按患者端逻辑：
  - `platform: 'patient'`
  - `X-Platform: patient`
- 若账号权限不匹配，可能登录失败或展示异常。

---

## 5. 首页个人信息显示不全

### 已做修复
- 首页逻辑已改为：
  - 先显示用户信息；
  - 再请求病历统计；
  - 即使统计失败，用户信息仍可展示。

---

## 6. 输入框显示像多行或内容被截断

### 根因
- `input/textarea/picker` 共用样式导致真机行高异常。

### 已做修复
- 三类控件分离样式：
  - `input` 固定单行高
  - `picker` 单行高
  - `textarea` 多行高

---

## 7. 按钮文字未居中

### 根因
- 仅靠 `line-height` 对齐在真机不稳定。

### 已做修复
- 按钮改为 `flex` 居中（普通按钮 + mini 按钮）。

---

## 8. 后端 Docker 常用命令

> 以项目根目录 `MediCareAI` 为例。

```powershell
docker compose up -d backend
docker compose ps backend
docker compose logs --tail=80 backend
```

若使用开发 compose 文件：

```powershell
docker compose -f docker-compose.dev.yml up -d backend
```

---

## 9. 调试建议清单
- 每次改样式后执行：微信开发者工具“清缓存 + 重新编译”。
- 每次改 JS 后可本地跑：`node --check`。
- 联调先测登录与 `/auth/me`，再测病历和 AI 流程。
