const evmOpenApi = require('../api/evmOpenApi');
module.exports = async (ctx) => {
    // 查询版本信息
    let result = await evmOpenApi.tmpVersion(ctx.http);
    if (result.error) {
        return '❌查询数据失败，请稍后再试';
    }
    // 固定宽度填充函数
    const padRight = (str, len) => str + ' '.repeat(Math.max(0, len - str.length));
    // 构建消息返回
    let message = '📶 TruckersMP 版本信息\n';
    message += '✦─────────────────✦\n';
    if (result.data.tmpVersion) {
        message += `◈ 联机插件   ${padRight(result.data.tmpVersion, 8)}\n`;
    }
    if (result.data.supportGameVersion) {
        message += `◈ 欧卡支持   ${padRight(result.data.supportGameVersion, 8)}\n`;
    }
    if (result.data.officialGameVersion) {
        message += `◈ 官方欧卡   ${padRight(result.data.officialGameVersion, 8)}\n`;
    }
    if (result.data.supportGameVersion && result.data.officialGameVersion) {
        if (result.data.supportGameVersion === result.data.officialGameVersion) {
            message += `◈ 兼容游戏   ✅\n`;
        } else {
            message += `◈ 兼容游戏   ❌\n`;
        }
    }
    message += '✦─────────────────✦';
    return message;
};
