const { segment } = require('koishi');
const { resolve } = require('path');
const fs = require('fs');
const common = require('../util/common');
const steamStoreApi = require('../api/steamStoreApi');

const CACHE_JSON_PATH = resolve(__dirname, '../resource/dlc-cache.json');
const CACHE_JPG_PATH = resolve(__dirname, '../ksak-HuanCun/dlc-jpg/dlc_map.jpg');
const CACHE_TTL = 1000 * 60 * 60 * 12; // 12小时过期

function loadCache() {
    try {
        if (fs.existsSync(CACHE_JSON_PATH)) {
            return JSON.parse(fs.readFileSync(CACHE_JSON_PATH, 'utf-8'));
        }
    } catch (e) {}
    return null;
}

function saveCache(imageBuffer, dlcCount) {
    try {
        const jpgDir = resolve(__dirname, '../ksak-HuanCun/dlc-jpg');
        if (!fs.existsSync(jpgDir)) {
            fs.mkdirSync(jpgDir, { recursive: true });
        }
        fs.writeFileSync(CACHE_JPG_PATH, imageBuffer);
        const cacheData = {
            image: imageBuffer.toString('base64'),
            timestamp: Date.now(),
            dlcCount: dlcCount,
            format: 'jpeg'
        };
        fs.writeFileSync(CACHE_JSON_PATH, JSON.stringify(cacheData, null, 2));
        console.log(`[DLC] 缓存已保存 (${(imageBuffer.length / 1024).toFixed(1)} KB)`);
    } catch (e) {
        console.error('[DLC] 缓存保存失败:', e.message);
    }
}

function isCacheValid() {
    const cache = loadCache();
    if (!cache || !cache.timestamp) return false;
    return Date.now() - cache.timestamp < CACHE_TTL;
}

/**
 * DLC 中文名称映射
 */
const DLC_CN_NAMES = {
    227310: '东欧',
    304212: '斯堪的纳维亚',
    531130: '法国',
    558244: '意大利',
    925580: '波罗的海彼岸',
    1056760: '黑海之路',
    1209460: '伊比利亚',
    2004210: '西巴尔干',
    2604420: '希腊',
    2780810: '北欧地平线',
};

function getDisplayName(d) {
    const engName = d.name.replace(/^Euro Truck Simulator 2 - /, '');
    const cnName = DLC_CN_NAMES[d.appId];
    return cnName ? `${cnName} - ${engName}` : engName;
}

function mapDlcData(dlcList) {
    return dlcList.map(d => ({
        name: getDisplayName(d),
        desc: d.short_description,
        originalPrice: d.original_price,
        finalPrice: d.final_price,
        discount: d.discount_percent,
        headerImageUrl: d.header_image,
        backgroundImageUrl: ''
    }));
}

async function refreshCache(ctx) {
    if (!ctx.puppeteer) return;
    let dlcData;
    try {
        dlcData = await steamStoreApi.getDlcList(ctx.http);
        if (!dlcData || dlcData.length === 0) return;
    } catch (e) {
        console.error('[DLC] 定时刷新获取数据失败:', e.message);
        return;
    }
    let page;
    try {
        page = await ctx.puppeteer.page();
        await page.setViewport({ width: 650, height: 850, deviceScaleFactor: 2 });
        await page.goto(`file:///${resolve(__dirname, '../resource/dlc.html').replace(/\\/g, '/')}`);
        await page.evaluate(`setData(${JSON.stringify(mapDlcData(dlcData))})`);
        await page.waitForNetworkIdle();
        await common.sleep(500);
        const element = await page.$('#dlc-info-container');
        const imageBuffer = await element.screenshot({
            encoding: 'binary',
            type: 'jpeg',
            quality: 85
        });
        saveCache(imageBuffer, dlcData.length);
        console.log(`[DLC] 定时刷新完成 (${dlcData.length}个DLC)`);
    } catch (e) {
        console.error('[DLC] 定时刷新渲染失败:', e.message);
    } finally {
        if (page) await page.close();
    }
}

module.exports = async (ctx, session) => {
    if (!ctx.puppeteer) {
        return '⚠️未启用 Puppeteer 功能';
    }

    // 检查本地 JPG 缓存
    if (fs.existsSync(CACHE_JPG_PATH) && isCacheValid()) {
        const imageBuffer = fs.readFileSync(CACHE_JPG_PATH);
        console.log(`[DLC] 使用JPG缓存`);
        return segment.image(imageBuffer, 'image/jpeg');
    }

    // 检查 JSON 缓存
    const cache = loadCache();
    if (cache && cache.image && (Date.now() - cache.timestamp < CACHE_TTL)) {
        console.log(`[DLC] 使用JSON缓存`);
        return segment.image(Buffer.from(cache.image, 'base64'), 'image/jpeg');
    }

    // 无有效缓存，从 Steam Store API 获取数据
    let dlcData;
    try {
        dlcData = await steamStoreApi.getDlcList(ctx.http);
        if (!dlcData || dlcData.length === 0) {
            if (cache && cache.image) {
                console.log('[DLC] Steam获取失败，使用过期缓存');
                return segment.image(Buffer.from(cache.image, 'base64'), 'image/jpeg');
            }
            return '❌获取DLC数据失败，请稍后重试';
        }
    } catch (e) {
        console.error('[DLC] Steam API 请求失败:', e.message);
        if (cache && cache.image) {
            console.log('[DLC] Steam异常，使用过期缓存');
            return segment.image(Buffer.from(cache.image, 'base64'), 'image/jpeg');
        }
        return '❌网络异常，请稍后重试';
    }

    let page;
    try {
        page = await ctx.puppeteer.page();
        await page.setViewport({ width: 650, height: 850, deviceScaleFactor: 2 });
        await page.goto(`file:///${resolve(__dirname, '../resource/dlc.html').replace(/\\/g, '/')}`);
        await page.evaluate(`setData(${JSON.stringify(mapDlcData(dlcData))})`);
        await page.waitForNetworkIdle();
        await common.sleep(500);

        const element = await page.$('#dlc-info-container');
        const imageBuffer = await element.screenshot({
            encoding: 'binary',
            type: 'jpeg',
            quality: 85
        });

        console.log(`[DLC] 图片生成 (${(imageBuffer.length / 1024).toFixed(1)} KB)`);
        saveCache(imageBuffer, dlcData.length);

        return segment.image(imageBuffer, 'image/jpeg');
    }
    catch (e) {
        console.error('[DLC] 渲染错误:', e);
        return '❌渲染异常，请稍后重试';
    }
    finally {
        if (page) {
            await page.close();
        }
    }
};

module.exports.refreshCache = refreshCache;
