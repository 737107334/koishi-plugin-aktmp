const truckersMpApi = require('../../api/truckersMpApi');
const evmOpenApi = require('../../api/evmOpenApi');
const { resolve } = require("path");
const common = require("../../util/common");
const { segment } = require("koishi");

// 根据服务器名称生成简称，例如 "Simulation 1" -> "S1服"、"ProMods" -> "P服"
function getServerAlias(name, shortname) {
    const n = (name || '').toLowerCase();
    const simMatch = n.match(/simulation\s*(\d+)/);
    if (simMatch) return 'S' + simMatch[1] + '服';
    if (n.includes('promods')) {
        const pm = n.match(/promods\s*(\d+)/);
        return 'P' + (pm ? pm[1] : '') + '服';
    }
    if (n.includes('arcade') || n.includes('arc')) return 'A服';
    if (n.includes('event')) return 'E服';
    return shortname ? shortname + '服' : '';
}

module.exports = async (ctx) => {
    if (!ctx.puppeteer) {
        return '⚠️未启用 puppeteer 服务';
    }
    // 并行: TMP官方API(服务器数据) + EVM API(人数曲线，失败不影响)
    const [result, evmResult] = await Promise.all([
        truckersMpApi.servers(ctx.http),
        evmOpenApi.serverList(ctx.http).catch(() => ({ error: true }))
    ]);
    if (result.error) {
        return '❌查询服务器失败，请稍后重试';
    }
    // 构建EVM playerHistory映射 (serverName -> playerHistory)
    const evmHistoryMap = {};
    if (!evmResult.error && evmResult.data) {
        for (const s of evmResult.data) {
            if (s.serverName && s.playerHistory) {
                evmHistoryMap[s.serverName] = s.playerHistory;
            }
        }
    }
    let serverList = result.data.map(s => ({
        serverName: s.name || s.shortname,
        serverAlias: getServerAlias(s.name, s.shortname),
        isOnline: s.online ? 1 : 0,
        playerCount: s.players || 0,
        maxPlayer: s.maxplayers || 0,
        queueCount: s.queue || 0,
        collisionsEnable: s.collisions ? 1 : 0,
        afkEnable: s.afkenabled ? 1 : 0,
        policeCarEnable: s.policecarsforplayers ? 1 : 0,
        speedLimiterEnable: s.speedlimiter ? 1 : 0,
        playerHistory: evmHistoryMap[s.name] || evmHistoryMap[s.shortname] || []
    }));
    let serverData = { error: false, data: serverList };
    let page;
    try {
        page = await ctx.puppeteer.page();
        await page.setViewport({ width: 380, height: 1000, deviceScaleFactor: 2 });
        await page.goto(`file:///${resolve(__dirname, '../../resource/server-list.html')}`);
        await page.evaluate(`setData(${JSON.stringify(serverData)})`);
        await common.sleep(100);
        await page.waitForNetworkIdle();
        const element = await page.$("#container");
        return (segment.image(await element.screenshot({
            encoding: "binary"
        }), "image/jpg"));
    }
    catch {
        return '⚠️渲染异常，请重试';
    }
    finally {
        if (page) {
            await page.close();
        }
    }
};
