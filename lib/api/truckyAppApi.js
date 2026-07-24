// TruckyApp Open API：在线状态 / 交通数据
// 主用 api.114512.xyz/trucky（自建镜像，实时性更好、无公共代理/CDN 缓存）
// 备用官方 api.truckyapp.com（仅主源失败时兜底）
const BASE_APIS = [
    'https://api.114512.xyz/trucky',
    'https://api.truckyapp.com'
];

module.exports = {
    /**
     * 查询线上信息
     */
    async online(http, tmpId) {
        const path = `/v3/map/online?playerID=${tmpId}`;
        for (const base of BASE_APIS) {
            try {
                const result = await http.get(`${base}${path}`);
                if (!result || !result.response || result.response.error) continue;
                return { error: false, data: result.response };
            } catch {}
        }
        return { error: true };
    },
    /**
     * 查询热门交通数据
     */
    async trafficTop(http, serverName) {
        const path = `/v2/traffic/top?game=ets2&server=${serverName}`;
        for (const base of BASE_APIS) {
            try {
                const result = await http.get(`${base}${path}`);
                if (!result || !result.response || result.response.length <= 0) continue;
                return { error: false, data: result.response };
            } catch {}
        }
        return { error: true };
    }
};
