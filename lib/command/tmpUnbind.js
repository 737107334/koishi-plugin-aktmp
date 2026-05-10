const guildBind = require('../database/guildBind');
/**
 * 解绑 TMP ID
 */
module.exports = async (ctx, session) => {
    // 查询当前绑定信息
    let bindInfo = await guildBind.get(ctx.database, session.platform, session.userId);
    if (!bindInfo) {
        return `❌当前未绑定任何账号`;
    }
    // 删除绑定
    let result = await guildBind.remove(ctx.database, session.platform, session.userId);
    if (result) {
        return `✅解绑成功`;
    }
    return `❌解绑失败`;
};
