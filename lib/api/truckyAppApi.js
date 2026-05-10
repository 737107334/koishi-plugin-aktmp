const PROXY_API = 'https://api.codetabs.com/v1/proxy/?quest=';
const DIRECT_API = 'https://api.truckyapp.com';
module.exports = {
    /**
     * 查询线上信息
     */
    async online(http, tmpId) {
        const path = `/v3/map/online?playerID=${tmpId}`;
        for (const base of [DIRECT_API, PROXY_API]) {
            try {
                const result = await http.get(`${base}${base === PROXY_API ? encodeURIComponent(DIRECT_API + path) : path}`);
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
        for (const base of [DIRECT_API, PROXY_API]) {
            try {
                const result = await http.get(`${base}${base === PROXY_API ? encodeURIComponent(DIRECT_API + path) : path}`);
                if (!result || !result.response || result.response.length <= 0) continue;
                return { error: false, data: result.response };
            } catch {}
        }
        return { error: true };
    }
};
