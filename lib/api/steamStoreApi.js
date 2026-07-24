const { resolve } = require('path');
const fs = require('fs');

const STATIC_DATA_PATH = resolve(__dirname, '../resource/dlc-data-static.json');

/**
 * 获取 ETS2 地图 DLC 列表
 * 先从本地静态文件读取基础信息（名称/描述/图片），
 * 再通过 Steam API 批量查询所有 DLC 的实时价格（单次请求，几乎不会失败）。
 * Steam API 异常时降级使用本地静态数据中的价格。
 * @param {object} http - koishi ctx.http
 * @returns {Promise<Array>} DLC 数组
 */
async function getDlcList(http) {
    let staticData = [];
    try {
        if (fs.existsSync(STATIC_DATA_PATH)) {
            staticData = JSON.parse(fs.readFileSync(STATIC_DATA_PATH, 'utf-8'));
        }
    } catch (e) {
        console.error('[SteamStore] 本地数据读取失败:', e.message);
    }
    if (staticData.length === 0) return [];

    // 单次批量请求 Steam API，获取所有 DLC 的实时价格（逗号分隔 appId）
    let livePrices = {};
    try {
        const appIds = staticData.map(d => d.appId).join(',');
        const url = `https://store.steampowered.com/api/appdetails?appids=${appIds}&filters=price_overview&cc=cn`;
        const res = await http.get(url, { timeout: 10000 });
        if (res && typeof res === 'object') {
            // 解析每个 appId 的价格
            for (const d of staticData) {
                const info = res[String(d.appId)];
                if (info && info.success && info.data && info.data.price_overview) {
                    livePrices[d.appId] = info.data.price_overview;
                }
            }
        }
    } catch (e) {
        console.error('[SteamStore] Steam API 请求失败:', e.message);
    }

    let updated = 0;
    const result = staticData.map(d => {
        const po = livePrices[d.appId];
        if (po) {
            updated++;
            return {
                ...d,
                original_price: po.initial,
                final_price: po.final,
                discount_percent: po.discount_percent || 0,
                is_free: po.final === 0,
                currency: po.currency || 'CNY',
            };
        }
        return d; // Steam API 失败或无价格数据，保持静态价格
    });

    console.log(`[SteamStore] 实时价格已更新 ${updated}/${result.length} 个地图DLC`);
    return result;
}

module.exports = { getDlcList };
