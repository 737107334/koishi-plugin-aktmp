const { segment } = require('koishi');
const { resolve } = require('path');
const common = require('../util/common');
const evmOpenApi = require('../api/evmOpenApi');
const guildBind = require('../database/guildBind');
module.exports = async (ctx, session, rankingType, tmpId) => {
    if (!ctx.puppeteer) {
        return '⚠️未启用 Puppeteer 功能';
    }
    // 查询排行榜信息
    let mileageRankingList = await evmOpenApi.mileageRankingList(ctx.http, rankingType, null);
    if (mileageRankingList.error) {
        return '⚠️里程排行查询依赖的数据源（EVM）已停用，暂不可用';
    }
    else if (mileageRankingList.data.length === 0) {
        return '🔄暂无数据';
    }
    // 解析输入的tmpId（支持 @艾特、QQ号、TMP ID）
    let playerTmpId = null;
    if (tmpId) {
        const atMatch = tmpId.match(/<at\s+id="([^"]+)"/);
        if (atMatch) {
            const bindData = await guildBind.get(ctx.database, session.platform, atMatch[1]);
            if (!bindData) return '⚠️该用户未绑定TMP编号';
            playerTmpId = String(bindData.tmp_id);
        } else if (/^\d+$/.test(tmpId)) {
            if (tmpId.length > 7) {
                const bindData = await guildBind.get(ctx.database, session.platform, tmpId);
                if (bindData) {
                    playerTmpId = String(bindData.tmp_id);
                } else {
                    return '⚠️该QQ号未绑定TMP账号';
                }
            } else {
                playerTmpId = tmpId;
            }
        }
    } else {
        let guildBindData = await guildBind.get(ctx.database, session.platform, session.userId);
        playerTmpId = guildBindData ? String(guildBindData.tmp_id) : null;
    }
    let playerMileageRanking = null;
    if (playerTmpId) {
        let playerMileageRankingResult = await evmOpenApi.mileageRankingList(ctx.http, rankingType, playerTmpId);
        if (!playerMileageRankingResult.error && playerMileageRankingResult.data.length > 0) {
            playerMileageRanking = playerMileageRankingResult.data[0];
        }
    }
    // 拼接页面数据
    let data = {
        rankingType: rankingType,
        mileageRankingList: mileageRankingList.data,
        playerMileageRanking: playerMileageRanking
    };
    let page;
    try {
        page = await ctx.puppeteer.page();
        await page.setViewport({ width: 1000, height: 1000, deviceScaleFactor: 2 });
        await page.goto(`file:///${resolve(__dirname, '../resource/mileage-leaderboard.html')}`);
        await page.evaluate(`setData(${JSON.stringify(data)})`);
        await page.waitForNetworkIdle();
        await common.sleep(500);
        const element = await page.$("#container");
        return (segment.image(await element.screenshot({
            encoding: "binary"
        }), "image/jpg"));
    }
    catch (e) {
        console.info(e);
        return '❌渲染异常，请重试';
    }
    finally {
        if (page) {
            await page.close();
        }
    }
};
