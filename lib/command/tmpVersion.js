const truckersMpApi = require('../api/truckersMpApi');
module.exports = async (ctx) => {
    // 查询版本信息 (官方 API)
    let result = await truckersMpApi.version(ctx.http);
    if (result.error) {
        return '❌查询数据失败，请稍后再试';
    }
    // 官方 API 直接返回版本数据(无 error/response 包裹)
    let resp = result.data;
    if (!resp) {
        return '❌查询数据失败，请稍后再试';
    }
    // 固定宽度填充函数
    const padRight = (str, len) => str + ' '.repeat(Math.max(0, len - str.length));
    // 构建消息返回
    let message = '📶 TruckersMP 版本信息\n';
    message += '✦─────────✦\n';
    // 真实接口字段: name=联机插件版本, supported_game_version=ETS2, supported_ats_game_version=ATS
    let tmpVersion = resp.name;
    let tmpStage = resp.stage;
    let supportGameVersion = resp.supported_game_version;
    let atsSupportVersion = resp.supported_ats_game_version;
    let officialGameVersion = resp.supported_game_version;  // 官方欧卡与支持的为同一版本
    let updateDate = resp.time ? resp.time.split(' ')[0] : null;
    let updateTime = resp.time ? resp.time.split(' ')[1] : null;
    if (tmpVersion) {
        message += `◈ 联机插件   ${padRight(tmpVersion, 12)}\n`;
    }
    if (supportGameVersion) {
        message += `◈ 欧卡支持   ${padRight(supportGameVersion, 12)}\n`;
    }
    if (officialGameVersion) {
        message += `◈ 官方欧卡   ${padRight(officialGameVersion, 12)}\n`;
    }
    if (supportGameVersion && officialGameVersion) {
        message += `◈ 兼容游戏   ${supportGameVersion === officialGameVersion ? '✅' : '❌'}\n`;
    }
    if (updateDate) {
        message += `◈ 更新日期   ${updateDate}\n`;
    }
    if (updateTime) {
        message += `◈ 更新时间   ${updateTime}\n`;
    }
    message += '✦─────────✦';
    return message;
};
