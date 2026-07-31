# 旅行地图网站 设计文档

**日期**: 2026-07-31
**状态**: 设计已确认，待制定实现计划

---

## 1. 项目概述

一个单页旅行地图网站，用来记录和女朋友一起旅游过的城市和地点。仅限中国地图。支持按旅行分组展示、彩色路线连线、底部时间轴导航，以及通过 GitHub Token 认证的后台管理面板。部署到 GitHub Pages。

**视觉风格**: animal-island-ui（动物森友会风格的 React 组件库）—— 温暖大地色系、大圆角 pill 形、3D 按钮阴影、有机外形。

---

## 2. 技术栈

| 层级           | 选型                                |
| -------------- | ----------------------------------- |
| 前端框架       | React 18 + TypeScript               |
| 构建工具       | Vite                                |
| UI 组件库      | animal-island-ui（26 个组件）        |
| 地图           | Leaflet + 高德瓦片图层              |
| 数据存储       | 仓库根目录 `data/travels.json`       |
| 数据读写       | GitHub Contents API                 |
| 身份认证       | GitHub Personal Access Token（存 localStorage） |
| 部署           | GitHub Pages                        |

---

## 3. 数据模型

```typescript
// 单个地点
interface Location {
  id: string;          // uuid
  city: string;        // 城市名
  lat: number;         // 纬度
  lng: number;         // 经度
  date: string;        // 日期 YYYY-MM-DD
  description: string; // 一句话描述
  tags: string[];      // 标签，如 "自然风光"、"美食"、"城市漫步"
  photo: string;       // 图片 URL，无则为空字符串
}

// 一趟旅行
interface Trip {
  id: string;          // uuid
  name: string;        // 旅行名称，如 "杭州之旅"
  date: string;        // 日期 YYYY-MM
  color: TripColor;    // 路线颜色，从 animal-island-ui 调色板选取
  locations: Location[];
}

// 可选颜色（与 animal-island-ui NookPhone 调色板一致）
type TripColor =
  | 'app-pink' | 'purple' | 'app-blue' | 'app-yellow'
  | 'app-orange' | 'app-teal' | 'app-green' | 'app-red'
  | 'lime-green' | 'yellow-green' | 'brown' | 'warm-peach-pink';

// 顶层数据
interface TravelsData {
  trips: Trip[];
}
```

数据文件: `data/travels.json`，存于仓库根目录。浏览模式通过 GitHub Raw URL 直接 fetch；管理模式通过 GitHub Contents API 读写。

**旅行颜色与 hex 对照表：**

| 颜色名          | 色值       |
| --------------- | ---------- |
| app-pink        | `#f8a6b2` |
| purple          | `#b77dee` |
| app-blue        | `#889df0` |
| app-yellow      | `#f7cd67` |
| app-orange      | `#e59266` |
| app-teal        | `#82d5bb` |
| app-green       | `#8ac68a` |
| app-red         | `#fc736d` |
| lime-green      | `#d1da49` |
| yellow-green    | `#ecdf52` |
| brown           | `#9a835a` |
| warm-peach-pink | `#e18c6f` |

---

## 4. 页面布局

```
┌──────────────────────────────────────────┐
│   园子&兔子的旅行地图                     │  ← Title 飘带横幅
├──────────────────────────────────────────┤
│                                          │
│          全屏 Leaflet 地图               │
│    ● ╌╌╌ ● ╌╌╌ ●   (粉色虚线，旅行A)     │
│    ● ╌╌╌ ●           (蓝色虚线，旅行B)    │
│                                          │
├──────────────────────────────────────────┤
│ ──●── 杭州之旅 25.03 ──●── 成都 25.06    │  ← 底部时间轴
└──────────────────────────────────────────┘
```

**各部分说明：**

- **顶部**：`<Title>` 飘带横幅，写 "园子&兔子的旅行地图"
- **主体**：全屏 Leaflet 地图，高德中文瓦片。同一次旅行的多个地点用该旅行的颜色虚线相连（Leaflet `dashArray`），不同旅行使用不同颜色区分
- **底部**：水平可滚动时间轴，虚线轨道 + 彩色圆点。每个圆点代表一趟旅行，旁边显示旅行名称和日期。点击圆点地图平滑飞至该旅行区域
- **管理入口**：左下角小按钮 `<Button type="text">`，普通访客不可见，Token 验证后出现

### 右侧详情抽屉

点击地图标记点 → 右侧滑出 `<Drawer placement="right">` 展示：

- 城市名（标题）
- 日期
- 一句话描述
- 若干 `<Tag>` 标签
- 照片（如有，放在 `<Card>` 中）
- 编辑/删除按钮（仅在管理模式显示）

---

## 5. 组件树

```
App
├── Title              （顶部飘带横幅）
├── MapView             （Leaflet 地图 + 标记 + 连线）
│   ├── TripPolyline   （每趟旅行的彩色虚线连线）
│   └── LocationMarker （每个地点的自定义标记）
├── Timeline            （底部时间轴，水平滚动）
│   └── TimelineDot     （每趟旅行的彩色圆点 + 名称 + 日期）
├── DetailDrawer        （右侧详情抽屉）
│   └── Card + Tag + 照片
├── ManagementPanel     （管理模式，Token 认证后出现）
│   ├── TokenInput      （GitHub Token 输入，存 localStorage）
│   ├── LocationForm    （使用 Form + FormItem + useForm）
│   └── DeleteConfirm   （删除确认 Modal）
└── Footer              （底部波浪装饰）
```

整个 App 包裹在 `<Cursor>` 中，使用游戏风格手指光标。

---

## 6. 数据流

### 浏览模式（读）

```
页面加载 → fetch(GitHub Raw URL) → JSON 数据
  → 渲染地图标记、连线、时间轴
```

GitHub Raw URL: `https://raw.githubusercontent.com/{user}/{repo}/main/data/travels.json`

### 管理模式（写）

```
用户操作（新增/编辑/删除）
  → 调用 GitHub Contents API
  → PUT 需要: path, sha（当前文件 hash）, content（base64 编码）, message（commit 信息）
  → 成功: 重新 fetch 数据, Notification.success 提示
  → 失败: Notification.error 提示
```

### Token 流程

```
1. 用户点击管理按钮 → Modal 弹出，输入 GitHub Token
2. Token 存入 localStorage
3. 所有 GitHub API 请求携带 Authorization: Bearer <token>
4. Token 仅存在用户自己的浏览器中，其他访客看不到
```

---

## 7. 地图配置

- **瓦片地址**: 高德 `https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}`，子域名 1-4
- **初始视角**: 中国中心（纬度 35.86，经度 104.19，缩放级别 5）
- **地点标记**: 自定义 SVG 图标，使用该旅行分配的路线颜色
- **路线连线**: `dashArray: "10, 10"`，颜色匹配旅行颜色，线宽 3
- **自动适配**: 页面加载后 `fitBounds` 自动缩放到覆盖所有地点
- **时间轴点击**: 地图 `flyTo` 平滑飞至该旅行地点中心

---

## 8. 构建与部署

- `vite.config.ts` 配置 `base: '/map/'`（与仓库名一致）
- 构建输出目录: `dist/`
- 使用 `gh-pages` 包或 GitHub Actions 自动部署 `dist/` 到 GitHub Pages

---

## 9. 范围边界

**做：**
- 中国地图 + 高德中文瓦片
- 按旅行的分组标记和彩色虚线连线
- 右侧地点详情抽屉
- 底部时间轴（点击定位）
- 管理面板（新增/编辑/删除地点、新增旅行）
- GitHub Token 认证（localStorage）

**不做：**
- 世界地图 / 其他国家
- 多用户账号系统
- 图片上传（仅支持填写图片 URL）
- 移动端 App / PWA 离线支持
- 后端服务器
