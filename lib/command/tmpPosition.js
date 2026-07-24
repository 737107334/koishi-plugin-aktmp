const { segment } = require('koishi');
const { resolve } = require('path');
const guildBind = require('../database/guildBind');
const truckyAppApi = require('../api/truckyAppApi');
const edaApi = require('../api/edaApi');
const cityGeo = require('../api/cityGeo');
const truckersMpApi = require('../api/truckersMpApi');
const truckersMpMapApi = require('../api/truckersMpMapApi');
const baiduTranslate = require('../util/baiduTranslate');
const common = require('../util/common');
/**
 * 定位
 */
module.exports = async (ctx, cfg, session, tmpId) => {
    if (ctx.puppeteer) {
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
        let playerInfo = await truckersMpApi.player(ctx.http, tmpId);
        if (playerInfo.error) {
            return '❌查询玩家信息失败，请重试';
        }
        // 查询线上信息（主 EDA，备 Trucky）
        let mapInfo = await edaApi.player(ctx.http, tmpId);
        if (mapInfo.error || !mapInfo.online) {
            // EDA 不可用或未命中 → 回退 Trucky
            const t = await truckyAppApi.online(ctx.http, tmpId);
            if (!t.error && t.data && t.data.online) {
                const poi = (t.data.location && t.data.location.poi) || {};
                mapInfo = {
                    error: false,
                    online: true,
                    data: {
                        axisX: t.data.x,
                        axisY: t.data.y,
                        serverId: t.data.server,
                        serverName: t.data.serverDetails ? t.data.serverDetails.name : '',
                        country: poi.country || '',
                        city: poi.realName || ''
                    }
                };
            }
        }
        if (!mapInfo || mapInfo.error) {
            // EDA 与 Trucky 双双不可用（非离线，而是查询失败）
            return '❌查询玩家位置信息失败，请重试';
        }
        if (!mapInfo.online) {
            return '🔄玩家离线';
        }
        const m = mapInfo.data;
        // 查询周边玩家，并处理数据
        let areaPlayersData = await truckersMpMapApi.area(ctx.http, m.serverId, m.axisX - 4000, m.axisY + 2500, m.axisX + 4000, m.axisY - 2500);
        let areaPlayerList = [];
        if (!areaPlayersData.error) {
            areaPlayerList = areaPlayersData.data;
            let index = areaPlayerList.findIndex((player) => {
                return player.tmpId.toString() === tmpId.toString();
            });
            if (index !== -1) {
                areaPlayerList.splice(index, 1);
            }
        }
        areaPlayerList.push({
            axisX: m.axisX,
            axisY: m.axisY,
            tmpId
        });
        // promods服ID集合
        let promodsServerIdList = [50, 51];
        // 城市/国家：Trucky 源直接用 poi；EDA 源用坐标反查最近城市（免 key）
        let loc = null;
        if (!m.country && !m.city) {
            loc = cityGeo.locate(m.serverId, m.axisX, m.axisY);
        }
        const countryText = m.country || (loc && loc.country) || '';
        let cityName = m.city || (loc && loc.realName) || '';
        if (cityName && cityName.includes('(')) {
            cityName = cityName.substring(0, cityName.lastIndexOf('(') - 1).trim();
        }
        // 构建地图数据
        let data = {
            mapType: promodsServerIdList.indexOf(m.serverId) !== -1 ? 'promods' : 'ets',
            avatar: playerInfo.data.smallAvatar,
            username: playerInfo.data.name,
            serverName: m.serverName || edaApi.serverName(m.serverId),
            country: countryText ? await baiduTranslate(ctx, cfg, countryText) : '未知',
            realName: cityName ? await baiduTranslate(ctx, cfg, cityName) : '未知',
            currentPlayerId: tmpId,
            centerX: m.axisX,
            centerY: m.axisY,
            playerList: areaPlayerList
        };
        let page;
        try {
            page = await ctx.puppeteer.page();
            await page.setViewport({ width: 1000, height: 1000, deviceScaleFactor: 2 });
            await page.goto(`file:///${resolve(__dirname, '../resource/position.html')}`);
            await page.evaluate(`setData(${JSON.stringify(data)})`);
            await common.sleep(100);
            await page.waitForNetworkIdle();
            const element = await page.$("#container");
            return (segment.image(await element.screenshot({
                encoding: "binary"
            }), "image/jpg"));
        }
        catch (e) {
            return '渲染异常，请重试';
        }
        finally {
            if (page) {
                await page.close();
            }
        }
    }
    else {
        return '⚠️未启用 puppeteer 服务';
    }
};
