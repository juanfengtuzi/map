# 增删改数据同步问题 · 完整复盘

> 这是一份对「旅行地图」项目增删改反复出问题的排查过程记录。
> 目标是讲清楚：**症状是什么 → 每一层的根因是什么 → 为什么之前的修复会"修好又复发" → 最终如何根治**。
> 记录日期：2026-08-03

---

## 1. 架构背景

纯前端 SPA，没有后端服务器。数据存在 GitHub 仓库的 `data/travels.json` 里：

- **读**：`fetch` 拉取数据
- **写**：GitHub Contents API `PUT`（需要 GitHub Personal Access Token）
- **Token**：存浏览器 `localStorage`，进入"管理模式"后才有写权限

这套架构的隐含约束是：**"读"和"写"是两个完全不同的通道**，各自有自己的缓存/一致性问题。

---

## 2. 症状时间线（用户视角）

| # | 症状 | 阶段 |
|---|------|------|
| 1 | 新建后完全没反应，只弹"创建成功"，实则毫无变化 | 早期 |
| 2 | 删除一个地点后，所属旅行还留着空壳 | 早期 |
| 3 | 管理界面删除地点 → 退出 → 刷新 → 又恢复到未删除状态 | **中期·核心** |
| 4 | 旅行足迹、所属旅行里的标签文字消失 | 中期 |
| 5 | 新增、删除两个操作都不更新了 | 中期 |
| 6 | 增加后退出是正常的，但删除就是不行 | 中期 |
| 7 | 删除还是没有改变 | 后期 |

第 3~7 条反复出现，本质是**同一个根因**——但之前几次都是"治标"，所以不断复发。

---

## 3. 第一层根因：前端状态管理竞态（早期一次性 bug）

这几个是"真 bug"，修一个是一个，不构成反复：

### 3.1 Trip ID 不匹配
`App.handleAddTrip` 用 `uuidv4()` 生成一个 ID 返回给表单，而 hook 内部的 `addTrip` 又自己生成一个 ID 存进去。**返回的 ID 和实际存储的 ID 不一致** → 后续 `addLocation(tripId, ...)` 永远匹配不到新旅行 → 地点静默丢失。

**修复**：`addTrip` 改为接受调用方传入的完整 `Trip`（含 ID），不再内部生成。

### 3.2 Stale Closure（闭包捕获旧数据）
`addLocation` 等函数闭包捕获了旧的 `trips` 状态。React 的 `setState` 是异步的，快速连续操作时读到旧数据，后一次覆盖前一次。

**修复**：引入 `tripsRef`（`useRef` 同步最新状态），所有操作从 `tripsRef.current` 读取，不再依赖闭包里的 `trips`。

### 3.3 删除后空旅行未清理
删光一个旅行的最后一个地点后，空旅行还留在时间轴和地图里。

**修复**：`deleteLocation` 过滤掉 `locations.length === 0` 的旅行。

---

## 4. 第二层根因：浏览器 / CDN 缓存（中期）

### 4.1 浏览器 HTTP 缓存（`Cache-Control: max-age=60`）
GitHub API 响应带 `Cache-Control: max-age=60`，浏览器默认会把 GET 结果缓存 60 秒。保存后立刻刷新 → 浏览器根本没发请求，直接读本地缓存的旧数据。

**修复**：所有 `fetch` 加 `cache: 'reload'`，强制绕过浏览器缓存。

### 4.2 ⚠️ 真正的病根：GitHub Raw CDN 5 分钟缓存
这才是第 3~7 条反复出现的核心。

`raw.githubusercontent.com` 由 GitHub 的 **CDN 边缘缓存**（Fastly）提供服务，响应头带 `Cache-Control: max-age=300`（5 分钟）。PUT 提交后：

- **GitHub 服务器上的文件**：立即更新 ✅
- **CDN 边缘缓存**：**最长 5 分钟**仍返回旧内容 ❌

两个关键认知：

1. **`?t=Date.now()` 时间戳无效**。CDN 的缓存键是**路径**，不是完整 URL。实测两个不同的 `?t=` 请求都返回 `X-Cache: HIT`（命中同一份缓存）。
2. **`cache: 'no-store'` 只绕过浏览器缓存**，对 CDN 边缘缓存无效。

更致命的是：**CDN 返回旧数据时是 HTTP 200，不报错**。代码层完全无法区分"这是最新数据"还是"这是 5 分钟前的旧数据"。

---

## 5. 为什么反复"修好又复发"——治标 vs 治本

前几轮修复都是**治标**，只要还在读 raw CDN，问题就必然复发：

| 尝试 | 为什么不行 |
|------|-----------|
| 加 `?t=时间戳` 绕过缓存 | CDN 缓存键不含 query，无效 |
| 加 `cache: 'no-store'` | 只绕过浏览器缓存，不绕过 CDN |
| 保存后延迟 2 秒回拉确认 | 读的还是 raw CDN（旧数据），且回拉时序不可靠 |
| 退出时 `await refresh()` 确认写入 | **反而帮倒忙**：refresh 走 raw CDN 读到删除前的旧数据，把删除"恢复"回来，还污染了 localStorage 缓存 |
| 加 localStorage 兜底缓存 | 兜底只在 `fetch` **抛错**时生效；CDN 返回旧数据不抛错，兜底永远不触发，反而被旧数据覆盖 |

关键教训：**只要"无 token 读数据"还在走带缓存的 raw CDN，这个 bug 就永远在**。真正的解决方案不是绕过缓存，而是**换一个不带缓存的读取源**。

---

## 6. 最终根治方案

### 6.1 彻底移除 raw CDN 读取

`fetchData` 现在**始终走 GitHub Contents API**（`api.github.com/repos/.../contents/data/travels.json`）：

- **有 token**：认证 API（5000 次/时 配额）
- **无 token**：公开仓库免认证 API（60 次/时 配额，对个人使用足够）

Contents API 是**强一致的**——PUT 成功后立刻能读到新数据，**没有 CDN 缓存**。

```ts
// 原逻辑：token ? API : raw CDN（有 5 分钟缓存）
// 现逻辑：token ? 认证 API : 公开 API（都无缓存）
const fetchData = useCallback(async (): Promise<TravelsData> => {
  if (token) {
    try { return await readContentsApi(token); }
    catch (e) { console.error('认证 API 读取失败:', e); }
  }
  try { return await readContentsApi(null); }   // 公开仓库免认证
  catch (e) { console.error('公开 API 读取失败:', e); }
  throw new Error('无法读取旅行数据');
}, [token, readContentsApi]);
```

### 6.2 localStorage 只存"确认最新"的结果

- `updateLocalTrips`（用户编辑）→ 即时写缓存
- `refresh` 用 Contents API 成功读到的数据 → 写缓存
- **网络失败**才回退缓存

因为读取源永远最新，缓存永远不会被旧数据污染。

### 6.3 退出流程修正

- **去掉退出时的 `await refresh()`**：本地状态就是刚保存的状态，不需要再读一次确认（那次读取正是把删除恢复的元凶）。
- `syncToGitHub` 返回 `boolean`，只在**真正写入**时提示"已同步"。
- 同步成功后无论刷新结果如何都清除 token。

---

## 7. 排查方法论：三路并行验证

为什么这次能根治？因为不再"头疼医头"，而是把整条链路拆成三条独立路径，**并行交叉验证**：

| 路径 | 检查内容 | 结论 |
|------|---------|------|
| 读路径 | refresh → fetchData → raw CDN → localStorage 覆盖 | ✅ 确认核心 bug：CDN 旧数据覆盖正确缓存 |
| 写路径 | saveData → GET sha → PUT → base64 编解码 | ✅ 确认写入是正确的（GitHub 上数据是对的） |
| 同步路径 | handleLogout → syncToGitHub → refresh → clearToken | ✅ 确认退出时的 refresh 把删除恢复 |

三个 agent 独立读代码、各自得出结论，交叉印证后：
- **写路径被排除**：PUT 是成功的，GitHub 上的数据一直是对的
- **读路径被锁定**：CDN 旧数据 + localStorage 被覆盖 = 删除"复活"的完整链条
- **同步路径补刀**：退出时的 refresh 是直接的触发点

> 派子 agent 并行审查的价值：三个独立视角互不干扰，避免单一视角陷入"好像是对的"的错觉。之前几次失败正是因为只盯住一个环节改。

---

## 8. 最终数据流（现状）

```
用户操作（增/删/改）
  → 本地即时更新 + 写 localStorage（响应零延迟）
  → 退出管理时一次性 PUT 到 GitHub
  → 刷新页面走 Contents API（认证/公开，永远最新）
  → 网络失败回退 localStorage 缓存
```

任何环节都不再依赖带缓存的 raw CDN，删除、新增、修改在三个数据源（GitHub、localStorage、React 状态）中保持一致。

---

## 9. 经验教训清单

1. **缓存问题先分清"层"**：浏览器 HTTP 缓存 / CDN 边缘缓存 / 数据源一致性，三者的失效方式完全不同，测试方法也不同（`X-Cache` 响应头能验证 CDN 命中）。
2. **"看起来修好了" ≠ "根因修好了"**：只要读取源仍然带缓存，问题就会以不同形式复发。治标修复会积累成技术债。
3. **一个可复现的症状描述胜过十次猜测**："删除 → 退出 → 刷新 → 恢复"这一句话直接锁定了排查方向（登录态正常、登出态异常 → 问题在无 token 读取路径）。
4. **读和写是两个通道**：GitHub 的"写入成功"和"读回最新"是两回事，必须分别验证。
5. **多视角交叉验证**：三个独立 agent 分别审查读/写/同步路径，比单视角连续排查更快收敛到真根因。
6. **离线兜底不等于数据源**：localStorage 缓存是"断网时的最后防线"，不能作为主要读取源——否则会引入"数据源之间谁是最新"的新问题。
