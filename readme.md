# koishi-plugin-aktmp

<div align="center">

[![GitHub stars](https://img.shields.io/github/stars/737107334/koishi-plugin-aktmp?style=flat-square&logo=github)](https://github.com/737107334/koishi-plugin-aktmp)
[![npm version](https://img.shields.io/npm/v/koishi-plugin-aktmp?logo=npm)](https://www.npmjs.com/~qq737107334)
[![Bilibili](https://img.shields.io/badge/Bilibili-606891061-00A1D6?style=flat-square&logo=bilibili)](https://space.bilibili.com/606891061)

**欧洲卡车模拟2 TruckersMP查询插件** — Koishi平台打造欧卡多功能查询插件工具

</div>

---

## 📢 作者信息

- 💬 **作者机器人交流群**：[978796651](http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=ODOVV6E4qjAWTt6W30qdVp6QvjCCIm3e&authKey=us4Xk6VozVtMKrxjCZSBvng6la18GKfUbw2fesVEh8pVSrF0UOAlbyZ5coUg0CxZ&noverify=0&group_code=978796651)
- 🐧 **作者企鹅**：[737107334](tencent://message/?uin=737107334)

---

## 功能特性

- 🔍 **玩家查询** — 快速查询 TruckersMP 玩家信息（离线时显示上次在线时间）
- 📍 **实时定位** — 查看玩家当前所在位置
- 🗺️ **足迹追踪** — 展示玩家今日行驶轨迹
- 🚦 **路况信息** — 查看热门地点实时路况
- 📊 **里程排行** — 总里程/今日里程排行榜
- 🛤️ **服务器列表** — 查看 ETS2 服务器状态
- 🌍 **地图 DLC** — 查看地图 DLC 及实时价格（每 2 小时自动更新）

---

## 数据源说明

| 数据项 | 数据来源 | 说明 |
|--------|----------|------|
| TMP 编号 / 玩家名称 / SteamID | TruckersMP 官方 API |
| 注册日期 / 注册天数 / 所属分组 | TruckersMP 官方 API |
| 当前车队 / 车队职位 | TruckersMP 官方 API |
| 封禁状态 / 封禁次数 / 封禁原因 | TruckersMP 官方 API |
| 是否赞助商 | TruckersMP 官方 API |
| 今日里程 / 历史里程 | **EVM 接口** |
| 上次在线时间 | **EVM 接口** |
| 在线状态 / 坐标 | **EDA 接口（主）** + Trucky（备） |
| 在线城市 / 国家 | 内置 ETS2 城市坐标库反查 |

---

### 更新日志

**v1.0.2**
- ✅ 地图 DLC 价格改为实时联网获取（Steam 国区），每 2 小时自动刷新
- ✅ 地图 DLC 价格改为右对齐显示

**v1.0.1**
- ✅ 新增服务器分割线显示
- ✅ 新增插件版本分割线显示
- ✅ 新增路况查询分割线显示
- ✅ 修复多项已知问题

---

## 支持的游戏服务器

更新服务器显示主图风格。

| 服务器 | 简称 |
|--------|------|
| Simulation 1 | S1 服 |
| Simulation 2 | S2 服 |
| [US] Simulation | 美 服 |
| [Asia] Simulation | 亚 服 |
| Arcade | A 服 |
| ProMods | P 服 |
| ProMods Arcade | P 服(街机) |

---

## 指令说明

| 指令 | 说明 | 示例 |
|------|------|------|
| `绑定` | 绑定 TMP ID | `绑定 123` |
| `解绑` | 解绑 TMP ID | `解绑` |
| `查询` | 查询玩家信息 | `查询 123` |
| `定位` | 查询玩家位置 | `定位 123` |
| `路况` | 查询路况信息 | `路况 s1` |
| `服务器` | 服务器列表 | `服务器` |
| `插件版本` | 查看版本 | `插件版本` |
| `地图dlc` | DLC 列表 | `地图dlc` |
| `总里程排行` | 总里程排名 | `总里程排行` |
| `今日里程排行` | 今日里程排名 | `今日里程排行` |
| `足迹` | ETS2 玩家足迹 | `足迹 123` |
| `足迹p` | ProMods 玩家足迹 | `足迹p 123` |

---

## Koishi安装

```bash
npm install koishi-plugin-aktmp
```

或使用 pnpm/yarn：

```bash
pnpm add koishi-plugin-aktmp
# 或
yarn add koishi-plugin-aktmp
```

## 致谢

- 数据来源：[TruckersMP](https://truckersmp.com/)
---
## 💬 交流群 & 联系作者

- 📢 **QQ 交流群**：[978796651](http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=ODOVV6E4qjAWTt6W30qdVp6QvjCCIm3e&authKey=us4Xk6VozVtMKrxjCZSBvng6la18GKfUbw2fesVEh8pVSrF0UOAlbyZ5coUg0CxZ&noverify=0&group_code=978796651)
- 🐧 **作者 QQ**：[737107334](tencent://message/?uin=737107334)

欢迎加入交流群反馈问题、提出建议或分享使用体验！🎉
