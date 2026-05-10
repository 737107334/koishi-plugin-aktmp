"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = exports.inject = exports.name = void 0;
exports.apply = apply;
const koishi_1 = require("koishi");
const model = require('./database/model');
const { MileageRankingType } = require('./util/constant');
const tmpQuery = require('./command/tmpQuery');
const tmpServer = require('./command/tmpServer/tmpServer');
const tmpBind = require('./command/tmpBind');
const tmpUnbind = require('./command/tmpUnbind');
const tmpTraffic = require('./command/tmpTraffic/tmpTraffic');
const tmpPosition = require('./command/tmpPosition');
const tmpVersion = require('./command/tmpVersion');
const tmpDlcMap = require('./command/tmpDlcMap');
const tmpMileageRanking = require('./command/tmpMileageRanking');
const tmpFootprint = require('./command/tmpFootprint');
const { ServerType } = require('./util/constant');
exports.name = 'aktmp';
exports.inject = {
    required: ['database'],
    optional: ['puppeteer']
};
exports.Config = koishi_1.Schema.intersect([
    koishi_1.Schema.object({
        baiduTranslateEnable: koishi_1.Schema.boolean().default(false).description('启用百度翻译'),
        baiduTranslateAppId: koishi_1.Schema.string().description('百度翻译APP ID'),
        baiduTranslateKey: koishi_1.Schema.string().description('百度翻译秘钥'),
        baiduTranslateCacheEnable: koishi_1.Schema.boolean().default(false).description('启用百度翻译缓存')
    }).description('基本配置'),
    koishi_1.Schema.object({
        queryShowAvatarEnable: koishi_1.Schema.boolean().default(false).description('查询指令展示头像'),
        tmpTrafficType: koishi_1.Schema.union([
            koishi_1.Schema.const(1).description('文字'),
            koishi_1.Schema.const(2).description('热力图')
        ]).default(1).description('路况信息展示方式'),
        tmpServerType: koishi_1.Schema.union([
            koishi_1.Schema.const(1).description('文字'),
            koishi_1.Schema.const(2).description('图片')
        ]).default(1).description('服务器信息展示方式')
    }).description('指令配置'),
]);
function apply(ctx, cfg) {
    // 初始化数据表
    model(ctx);
    // 注册指令
    ctx.command('绑定 <tmpId>', '绑定TMP账号').action(async ({ session }, tmpId) => await tmpBind(ctx, cfg, session, tmpId));
    ctx.command('解绑', '解绑TMP账号').action(async ({ session }) => await tmpUnbind(ctx, session));
    ctx.command('查询 <tmpId>', '查询TMP玩家信息').action(async ({ session }, tmpId) => await tmpQuery(ctx, cfg, session, tmpId));
    ctx.command('定位 <tmpId>', '定位玩家位置').action(async ({ session }, tmpId) => await tmpPosition(ctx, cfg, session, tmpId));
    ctx.command('路况 <serverName>', '查看路况信息').action(async ({ session }, serverName) => await tmpTraffic(ctx, cfg, serverName));
    ctx.command('服务器', '查看ETS2服务器状态').action(async () => await tmpServer(ctx, cfg));
    ctx.command('地图dlc', '查看地图DLC').action(async ({ session }) => await tmpDlcMap(ctx, session));
    ctx.command('插件版本', '查看插件版本').action(async () => await tmpVersion(ctx));
    ctx.command('今日里程排行', '查看今日里程排行').action(async ({ session }) => await tmpMileageRanking(ctx, session, MileageRankingType.today));
    ctx.command('总里程排行', '查看总里程排行').action(async ({ session }) => await tmpMileageRanking(ctx, session, MileageRankingType.total));
    ctx.command('足迹 <tmpId>', '查看ETS2玩家足迹').action(async ({ session }, tmpId) => await tmpFootprint(ctx, session, ServerType.ets, tmpId));
    ctx.command('足迹p <tmpId>', '查看ProMods玩家足迹').action(async ({ session }, tmpId) => await tmpFootprint(ctx, session, ServerType.promods, tmpId));
}
