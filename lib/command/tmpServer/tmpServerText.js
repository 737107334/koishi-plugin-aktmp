const truckersMpApi = require('../../api/truckersMpApi');
const serverInfo = require('../../api/serverInfo');

module.exports = async (ctx) => {
    // 查询服务器信息 (官方 API)
    let result = await truckersMpApi.servers(ctx.http);
    if (result.error) {
        return '⚠️查询服务器失败，请稍后重试';
    }
    // result.data 是官方 API 的 response 数组 (已由 servers() 解包)
    // 只保留欧卡服务器（与 ak-tmpbot 一致）
    let serverList = result.data
        .filter(s => !s.game || s.game === 'ETS2')
        .map(s => ({
        serverName: s.name || s.shortname,
        serverAlias: serverInfo.nameToAlias(s.name) || (s.shortname ? s.shortname + '服' : ''),
        isOnline: s.online ? 1 : 0,
        playerCount: s.players || 0,
        maxPlayer: s.maxplayers || 0,
        queue: s.queue > 0,
        queueCount: s.queue || 0,
        afkEnable: s.afkenabled ? 1 : 0,
        collisionsEnable: s.collisions ? 1 : 0
    }));
    // 计算总在线人数
    let totalOnline = serverList.reduce((sum, s) => sum + (s.playerCount || 0), 0);
    // 固定宽度填充函数
    const padRight = (str, len) => str + ' '.repeat(Math.max(0, len - str.length));
    // 构建消息
    let message = `🌍 欧卡2 服务器状态\n`;
    message += `📊 总在线人数 : ${totalOnline}人\n`;
    message += `═════════════\n`;
    let first = true;
    for (let server of serverList) {
        if (!first) message += '\n';
        message += `🖥️ 服务器 : ${server.serverName || ''}${server.isOnline === 1 ? '🟢' : '⚫'}\n`;
        if (server.serverAlias) {
            message += `🏷️ 服务器简称 : ${server.serverAlias}\n`;
        }
        message += `📊 在线人数 : ${server.playerCount || 0}/${server.maxPlayer || 0}`;
        if (server.queue) {
            message += `\n🚦 排队人数 : ${server.queueCount || 0}`;
        }
        // 服务器特性
        let characteristicList = [];
        if (server.afkEnable !== 1) {
            characteristicList.push('⏱挂机');
        }
        if (server.collisionsEnable === 1) {
            characteristicList.push('💥碰撞');
        }
        if (characteristicList.length > 0) {
            message += '\n🚔 服务器特性: ' + characteristicList.join(' ');
        }
        message += '\n═════════════';
        first = false;
    }
    return message;
};
