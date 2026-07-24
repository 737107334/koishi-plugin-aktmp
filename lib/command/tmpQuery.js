const dayjs = require('dayjs');
const dayjsRelativeTime = require('dayjs/plugin/relativeTime');
const dayjsLocaleZhCn = require('dayjs/locale/zh-cn');
const guildBind = require('../database/guildBind');
const truckyAppApi = require('../api/truckyAppApi');
const edaApi = require('../api/edaApi');
const cityGeo = require('../api/cityGeo');
const serverInfo = require('../api/serverInfo');
const truckersMpApi = require('../api/truckersMpApi');
const evmOpenApi = require('../api/evmOpenApi');
const baiduTranslate = require('../util/baiduTranslate');
const common = require('../util/common');
dayjs.extend(dayjsRelativeTime);
dayjs.locale(dayjsLocaleZhCn);

/**
 * 将官方 bans 的 expiration(形如 "2026-10-03 14:34:00"，无时区)规范为带 Z 的 UTC 字符串，
 * 使 dayjs 按 UTC 解析(与 EVM 一致)，避免国内服务器按本地时间显示导致时区偏差(±8小时)。
 * 已带时区(Z 或 +08:00 等)则原样返回。
 */
function normalizeBanTime(str) {
    if (!str) return null;
    const s = String(str).trim();
    if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(s)) return s;
    return s.replace(' ', 'T') + 'Z';
}
/**
 * 用户组
 */
const userGroup = {
    'Player': '玩家',
    'Retired Legend': '退役',
    'Game Developer': '游戏开发者',
    'Retired Team Member': '退休团队成员',
    'Add-On Team': '附加组件团队',
    'Game Moderator': '游戏管理员'
};
/**
 * 查询玩家信息
 */
module.exports = async (ctx, cfg, session, tmpId) => {
    if (tmpId && isNaN(tmpId)) {
        return `🔄请输入正确的玩家编号，或绑定玩家编号`;
    }
    // 如果没有传入tmpId，尝试从数据库查询绑定信息
    if (!tmpId) {
        let guildBindData = await guildBind.get(ctx.database, session.platform, session.userId);
        if (!guildBindData) {
            return `🔄请输入正确的玩家编号，或绑定玩家编号`;
        }
        tmpId = guildBindData.tmp_id;
    }
    // --- 查询玩家信息 (官方 API) ---
    let playerResult = await truckersMpApi.player(ctx.http, tmpId);
    if (playerResult.error) {
        return '❌查询玩家信息失败，请重试';
    }
    // playerResult.data 是官方 API 的 response 对象 (已由 truckersMpApi.player 解包)
    let p = playerResult.data;

    // --- 查询封禁信息 ---
    let banList = [];
    let bansResult = await truckersMpApi.bans(ctx.http, tmpId);
    if (!bansResult.error && bansResult.data) {
        banList = bansResult.data;  // 直接是封禁数组
    }
    // 注意：TruckersMP API 字段为 active / expiration（expiration 为 null 才是永久封禁）
    let activeBan = null;
    if (p.banned && banList.length > 0) {
        const activeBans = banList.filter(b => b.active === true);
        const pool = activeBans.length > 0 ? activeBans : banList;
        // 取到期时间最晚的一条作为当前封禁；expiration 为 null(永久) 优先
        activeBan = pool.reduce((latest, b) => {
            if (!b.expiration) return b;
            if (!latest.expiration) return latest;
            return new Date(b.expiration) > new Date(latest.expiration) ? b : latest;
        });
    }

    // --- 查询 VTC 角色 ---
    let vtcRole = null;
    let memberId = (p.vtc && p.vtc.memberID) || p.memberId;
    if (p.vtc && memberId) {
        let vtcResult = await truckersMpApi.vtcMember(ctx.http, p.vtc.id, memberId);
        if (!vtcResult.error && vtcResult.data) {
            vtcRole = vtcResult.data.role || null;
        }
    }

    // --- 构建与 EVM playerInfo.data 兼容的结构 ---
    let playerInfo = {
        data: {
            tmpId: p.id,
            name: p.name,
            steamId: p.steamID64,
            avatarUrl: p.avatar || null,
            registerTime: p.joinDate,
            groupName: p.groupName,
            isJoinVtc: !!(p.vtc && p.vtc.id),
            vtcName: p.vtc ? p.vtc.name : null,
            vtcRole: vtcRole,
            isBan: !!p.banned,
            banHide: p.displayBans === false,
            banUntil: activeBan ? normalizeBanTime(activeBan.expiration) : null,
            banReasonZh: null,
            banReason: activeBan ? activeBan.reason : null,
            banCount: p.bansCount || 0,
            // 里程/赞助: 官方 API 没有, 不传 (下游有 if 判空保护)
            mileage: null,
            todayMileage: null,
            lastOnlineTime: null,
            isSponsor: !!(p.patreon && p.patreon.isPatron),
            sponsorAmount: (p.patreon && p.patreon.currentPledge) || null,
            sponsorCumulativeAmount: (p.patreon && p.patreon.lifetimePledge) || null
        }
    };

    // --- 查询 EVM 独有数据 (里程/上次在线, 失败不影响主查询) ---
    let evmResult = null;
    try {
        evmResult = await evmOpenApi.playerInfo(ctx.http, tmpId);
        if (!evmResult.error && evmResult.data) {
            // EVM 的 mileage 单位为米, 转换为公里
            playerInfo.data.mileage = evmResult.data.mileage != null ? Math.round(evmResult.data.mileage / 1000) : null;
            playerInfo.data.todayMileage = evmResult.data.todayMileage != null ? Math.round(evmResult.data.todayMileage / 1000) : null;
            // 上次在线仅来自 EVM（官方接口无此字段）
            if (evmResult.data.lastOnlineTime) {
            playerInfo.data.lastOnlineTime = evmResult.data.lastOnlineTime;
            // 历史车队功能已移除，不再需要 vtcHistory 字段，主动丢弃
            delete evmResult.data.vtcHistory;
        }
        }
    }
    catch {
        // EVM 不可用时忽略
    }

    // --- 查询线上信息（主 EDA，备 Trucky）---
    let onlineInfo = await edaApi.player(ctx.http, tmpId);
    let onlineSource = null;
    if (onlineInfo.error || !onlineInfo.online) {
        // EDA 不可用或未命中 → 回退 Trucky
        const t = await truckyAppApi.online(ctx.http, tmpId);
        if (!t.error && t.data && t.data.online) {
            onlineSource = 'trucky';
            onlineInfo = { error: false, online: true, data: t.data };
        }
    } else {
        onlineSource = 'eda';
    }
    const isOnline = onlineInfo && !onlineInfo.error && onlineInfo.online;

    // --- 拼接消息 ---
    let message = '';
    if (cfg.queryShowAvatarEnable && playerInfo.data.avatarUrl) {
        message += `<img src="${playerInfo.data.avatarUrl}"/>\n`;
    }
    message += '🆔TMP编号: ' + playerInfo.data.tmpId;
    message += '\n😀玩家名称: ' + playerInfo.data.name;
    message += '\n🎮SteamID: ' + playerInfo.data.steamId;
    let registerDate = dayjs(playerInfo.data.registerTime);
    message += '\n📅注册日期: ' + registerDate.format('YYYY年MM月DD日');
    message += `\n📑注册天数: ${dayjs().diff(registerDate, 'day')}天`;
    message += '\n🎖️所属分组: ' + (userGroup[playerInfo.data.groupName] || playerInfo.data.groupName);
    if (playerInfo.data.isJoinVtc) {
        message += '\n🚚当前车队: ' + playerInfo.data.vtcName;
        message += '\n🚚车队职位: ' + (common.translateVtcRole(playerInfo.data.vtcRole) || '未知');
    }
    message += '\n🚫玩家封禁: ' + (playerInfo.data.isBan ? '✅' : '❌');
    if (playerInfo.data.isBan) {
        if (playerInfo.data.banHide) {
            message += '\n🔓解封日期: 玩家已隐藏⚠️';
        }
        else {
            if (!playerInfo.data.banUntil) {
                message += '\n🔓解封日期: ⚠️永久';
            }
            else {
                const banEnd = dayjs(playerInfo.data.banUntil);
                message += '\n🔓解封日期: ' + banEnd.format('YYYY年MM月DD日');
                message += '\n🔓解封时间: ' + banEnd.format('HH:mm');
            }
            message += "\n🚫封号原因: " + (playerInfo.data.banReasonZh || playerInfo.data.banReason || '未知');
        }
    }
    message += '\n🚫封禁次数:  ' + (playerInfo.data.banCount || 0) + '次';
    // 里程: 来自 EVM 独有数据, 缺失或为0则不显示
    if (playerInfo.data.todayMileage != null && playerInfo.data.todayMileage > 0) {
        message += '\n📏今日里程: ' + playerInfo.data.todayMileage.toLocaleString() + ' km';
    }
    if (playerInfo.data.mileage != null && playerInfo.data.mileage > 0) {
        message += '\n📏历史里程: ' + playerInfo.data.mileage.toLocaleString() + ' km';
    }
    message += '\n💎是否赞助商: ' + (playerInfo.data.isSponsor ? '✅' : '❌');
    if (playerInfo.data.isSponsor) {
        if (playerInfo.data.sponsorAmount) {
            const dollars = playerInfo.data.sponsorAmount / 100;
            message += '\n🎁当前赞助:  $' + (Number.isInteger(dollars) ? dollars : dollars.toFixed(2));
        }
        // 累计赞助是EVM独有数据，官方API不提供
    }
    message += '\n🖥️在线状态: ' + (isOnline ? '✅' : '❌');

    // 上次在线时间（来自 EVM 的 lastOnlineTime，主查询已取出），仅离线时显示
    const lastOnlineTime = playerInfo.data.lastOnlineTime;
    if (isOnline) {
        if (onlineSource === 'trucky') {
            // Trucky 源含服务器名/国家/城市
            const shortServerName = serverInfo.nameToAlias(onlineInfo.data.serverDetails.name) || onlineInfo.data.serverDetails.name;
            message += '\n📡在线服务器: ' + shortServerName + ' 🟢';
            if (onlineInfo.data.location && onlineInfo.data.location.poi) {
                message += '\n📊在线国家: ';
                message += await baiduTranslate(ctx, cfg, onlineInfo.data.location.poi.country);
                message += '\n📶在线城市: ';
                let cityName = onlineInfo.data.location.poi.realName;
                if (cityName && cityName.includes('(')) {
                    cityName = cityName.substring(0, cityName.lastIndexOf('(') - 1).trim();
                }
                message += await baiduTranslate(ctx, cfg, cityName);
            }
        } else {
            // EDA 源：用坐标反查最近城市与国家（免 key）
            const shortServerName = serverInfo.alias(onlineInfo.data.serverId) || ('服' + onlineInfo.data.serverId);
            message += '\n📡在线服务器: ' + shortServerName + ' 🟢';
            const loc = cityGeo.locate(onlineInfo.data.serverId, onlineInfo.data.axisX, onlineInfo.data.axisY);
            if (loc) {
                message += '\n📊在线国家: ';
                message += await baiduTranslate(ctx, cfg, loc.country);
                message += '\n📶在线城市: ';
                message += await baiduTranslate(ctx, cfg, loc.realName);
            }
        }
    } else if (lastOnlineTime) {
        // 离线或状态未知 → 显示上次在线（数据来自 EVM，与参考插件一致）
        message += '\n📶上次在线: ' + dayjs(lastOnlineTime).format('YYYY-MM-DD') + ' ' + dayjs(lastOnlineTime).fromNow(false);
    }
    return message;
};
