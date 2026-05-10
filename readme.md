# koishi-plugin-aktmp

<div align="center">

[![GitHub stars](https://img.shields.io/github/stars/737107334/koishi-plugin-aktmp?style=flat-square&logo=github)](https://github.com/737107334/koishi-plugin-aktmp)
[![npm version](https://img.shields.io/npm/v/koishi-plugin-aktmp?logo=npm)](https://www.npmjs.com/~qq737107334)
[![Bilibili](https://img.shields.io/badge/Bilibili-606891061-00A1D6?style=flat-square&logo=bilibili)](https://space.bilibili.com/606891061)

**欧洲卡车模拟2 TruckersMP查询插件** — Koishi平台打造欧卡多功能查询插件工具

</div>

---

## 功能特性

- 🔍 **玩家查询** — 快速查询 TruckersMP 玩家信息
- 📍 **实时定位** — 查看玩家当前所在位置
- 🗺️ **足迹追踪** — 展示玩家今日行驶轨迹
- 🚦 **路况信息** — 查看热门地点实时路况
- 📊 **里程排行** — 总里程/今日里程排行榜
- 🛤️ **服务器列表** — 查看 ETS2 服务器状态
- 🌍 **地图 DLC** — 查看已安装的地图 DLC

---

## 支持的游戏服务器

| 服务器 | 简称 |
|--------|------|
| Simulation 1 | `s1` / `s1服` |
| Simulation 2 | `s2` / `s2服` |
| ProMods | `p` / `p服` |
| Arcade | `a` / `a服` |

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

> 💡 绑定 TMP ID 后，使用其他指令时可省略输入 ID

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
- 感谢 **备长炭** 提供的数据支持

---

## 交流群

📢 QQ 交流群：**978796651**

## 联系作者

QQ：737107334
