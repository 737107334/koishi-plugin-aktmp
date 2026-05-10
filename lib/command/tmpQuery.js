const dayjs = require('dayjs');
const dayjsRelativeTime = require('dayjs/plugin/relativeTime');
const dayjsLocaleZhCn = require('dayjs/locale/zh-cn');
const guildBind = require('../database/guildBind');
const truckyAppApi = require('../api/truckyAppApi');
const evmOpenApi = require('../api/evmOpenApi');
const baiduTranslate = require('../util/baiduTranslate');
dayjs.extend(dayjsRelativeTime);
dayjs.locale(dayjsLocaleZhCn);
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
    // 查询玩家信息
    let playerInfo = await evmOpenApi.playerInfo(ctx.http, tmpId);
    if (playerInfo.error && playerInfo.code === 10001) {
        return '❌玩家不存在';
    }
    else if (playerInfo.error) {
        return '❌查询玩家信息失败，请重试';
    }
    // 查询线上信息
    let playerMapInfo = await truckyAppApi.online(ctx.http, tmpId);
    // 拼接消息模板
    let message = '';
    if (cfg.queryShowAvatarEnable) {
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
        const vtcRoleMap = {
            'Owner': '队长',
            'Co-Owner': '副队长',
            'Chairman': '主席',
            'Vice Chairman': '副主席',
            'Manager': '管理员',
            'Deputy Manager': '副管理员',
            'Captain': '主管',
            'Lieutenant': '副主管',
            'Recruiter': '招聘员',
            'Driver': '司机',
            'Trainee': '实习司机',
            'Member': '成员',
            'Veteran Driver': '资深司机',
            'Legend Driver': '传奇司机',
            'Pilot': '引航员',
            'Event Manager': '活动管理员',
            'Media Manager': '媒体管理员',
            'HR': '人事部',
        };
        message += '\n🚚车队职位: ' + (vtcRoleMap[playerInfo.data.vtcRole] || playerInfo.data.vtcRole);
    }
    message += '\n🚫玩家封禁: ' + (playerInfo.data.isBan ? '✅' : '❌');
    if (playerInfo.data.isBan) {
        message += '\n🚫截止日期: ';
        if (playerInfo.data.banHide) {
            message += '玩家已隐藏⚠️';
        }
        else {
            if (!playerInfo.data.banUntil) {
                message += '⚠️永久';
            }
            else {
                message += dayjs(playerInfo.data.banUntil).format('YYYY年MM月DD日 HH:mm');
            }
            message += "\n🚫封号原因: " + (playerInfo.data.banReasonZh || playerInfo.data.banReason);
        }
    }
    message += '\n🚫封禁次数:  ' + (playerInfo.data.banCount || 0) + '次';
    if (playerInfo.data.mileage) {
        let mileage = playerInfo.data.mileage;
        let mileageUnit = '米';
        if (mileage > 1000) {
            mileage = (mileage / 1000).toFixed(1);
            mileageUnit = '公里';
        }
        message += '\n🚩历史里程: ' + mileage + mileageUnit;
    }
    if (playerInfo.data.todayMileage) {
        let todayMileage = playerInfo.data.todayMileage;
        let mileageUnit = '米';
        if (todayMileage > 1000) {
            todayMileage = (todayMileage / 1000).toFixed(1);
            mileageUnit = '公里';
        }
        message += '\n🚩今日里程: ' + todayMileage + mileageUnit;
    }
    message += '\n💎是否赞助商: ' + (playerInfo.data.isSponsor ? '✅' : '❌');
    if (playerInfo.data.isSponsor) {
        if (playerInfo.data.sponsorAmount) {
            message += '\n🎁当前赞助:  $' + (playerInfo.data.sponsorAmount / 100);
        }
        if (playerInfo.data.sponsorCumulativeAmount) {
            message += '\n🎁累计赞助:  $' + (playerInfo.data.sponsorCumulativeAmount / 100);
        }
    }
    message += '\n🖥️在线状态: ' + ((playerMapInfo && !playerMapInfo.error && playerMapInfo.data.online) ? '✅' : '❌');
    if (playerMapInfo && !playerMapInfo.error && playerMapInfo.data.online) {
        const serverNameMap = {
            'Simulation 1': 'S1 服',
            'Simulation 2': 'S2 服',
            'Arcade': 'A 服',
            'ProMods': 'P 服',
            'ProMods Arcade': 'P 服(街机)',
            'US Simulation': '美 服',
            'Asia Simulation': '亚 服',
        };
        const rawServerName = playerMapInfo.data.serverDetails.name;
        const shortServerName = serverNameMap[rawServerName] || rawServerName;
        message += '\n📡在线服务器: ' + shortServerName + ' 🟢';
        message += '\n📊在线国家: ';
        message += await baiduTranslate(ctx, cfg, playerMapInfo.data.location.poi.country);
        message += '\n📶在线城市: ';
        message += await baiduTranslate(ctx, cfg, playerMapInfo.data.location.poi.realName);
    } else if (playerInfo.data.lastOnlineTime) {
        message += '\n📶上次在线: ' + dayjs(playerInfo.data.lastOnlineTime).fromNow(false);
    }
    return message;
};
