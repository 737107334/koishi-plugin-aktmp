const evmOpenApi = require('../../api/evmOpenApi');
module.exports = async (ctx) => {
    // 查询服务器信息
    let serverData = await evmOpenApi.serverList(ctx.http);
    if (serverData.error) {
        return '⚠️查询服务器失败，请稍后重试';
    }
    let serverList = serverData.data;
    // 计算总在线人数
    let totalOnline = serverList.reduce((sum, s) => sum + (s.playerCount || 0), 0);
    // 固定宽度填充函数
    const padRight = (str, len) => str + ' '.repeat(Math.max(0, len - str.length));
    // 构建消息
    let message = `🌍 欧卡2 服务器状态\n`;
    message += `📊 总在线人数 : ${totalOnline}人\n`;
    message += `═══════════════════════\n`;
    let first = true;
    for (let server of serverList) {
        if (!first) message += '\n';
        message += `🖥️ 服务器 : ${server.serverName || ''}${server.isOnline === 1 ? '🟢' : '⚫'}\n`;
        message += `📊 在线人数 : ${server.playerCount || 0}/${server.maxPlayer || 0}`;
        if (server.queue) {
            message += ` (队列: ${server.queueCount || 0})`;
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
        message += '\n═══════════════════════';
        first = false;
    }
    return message;
};
