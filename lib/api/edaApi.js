// EDA 实时追踪接口：在线状态 + 坐标（无需 API key）
// 主用 da.vtcm.link/map/playerList，按矩形区域拉取全图在线玩家后按 tmpId 过滤。
// 说明：TruckersMP 官方与 Trucky 均无法稳定给出实时坐标/在线（Trucky 缺 key 时返回 error），
// 因此以 EDA 为主源，Trucky 在调用处作为回退兜底。
const serverInfo = require('./serverInfo');
const BASE_APIS = [
    'https://da.vtcm.link/map/playerList',
    'https://evmapi.114512.xyz/map/playerList'
];
// 全图范围（覆盖 ETS2 全图坐标系），一次拉取后做短时缓存，多个查询共用
const FULL_MAP = { x1: -500000, y1: -500000, x2: 500000, y2: 500000 };
const CACHE_TTL = 5000;
let cache = { time: 0, players: null };

async function fetchAll(http) {
    const now = Date.now();
    if (cache.players && now - cache.time < CACHE_TTL) {
        return cache.players;
    }
    let lastErr = null;
    for (const base of BASE_APIS) {
        try {
            const result = await http.get(`${base}?x1=${FULL_MAP.x1}&y1=${FULL_MAP.y1}&x2=${FULL_MAP.x2}&y2=${FULL_MAP.y2}`, { timeout: 15000 });
            const list = Array.isArray(result) ? result : (result && Array.isArray(result.data) ? result.data : null);
            if (!list) continue;
            cache = { time: now, players: list };
            return list;
        }
        catch (e) {
            lastErr = e;
        }
    }
    throw lastErr || new Error('EDA 无可用数据源');
}

module.exports = {
    /**
     * 根据 EDA serverId 返回官方服务器全名
     */
    serverName: (id) => serverInfo.fullName(id) || ('服' + id),
    /**
     * 查询玩家在线状态与坐标
     * 返回 { error, online, data: { tmpId, tmpName, serverId, axisX, axisY, heading, updateTime } }
     */
    async player(http, tmpId) {
        let list;
        try {
            list = await fetchAll(http);
        }
        catch {
            return { error: true };
        }
        const found = list.find(p => String(p.tmpId) === String(tmpId));
        if (!found) {
            return { error: false, online: false };
        }
        return {
            error: false,
            online: true,
            data: {
                tmpId: found.tmpId,
                tmpName: found.tmpName,
                serverId: found.serverId,
                axisX: found.axisX,
                axisY: found.axisY,
                heading: found.heading,
                updateTime: found.updateTime
            }
        };
    }
};
