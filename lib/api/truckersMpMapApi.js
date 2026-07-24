const BASE_API = 'https://tracker.ets2map.com';
module.exports = {
    /**
     * 区域查询玩家
     * 返回 { error, data: [{tmpId, axisX, axisY}, ...] } 与 evmOpenApi.mapPlayerList 格式一致
     */
    async area(http, serverId, x1, y1, x2, y2) {
        let result = null;
        try {
            result = await http.get(`${BASE_API}/v3/area?x1=${x1}&y1=${y1}&x2=${x2}&y2=${y2}&server=${serverId}`);
        }
        catch {
            return {
                error: true
            };
        }
        if (!result || !result.Success) {
            return { error: true };
        }
        // 标准化字段名: ets2map 返回 { playerId, x, y } → 统一为 { tmpId, axisX, axisY }
        let data = (result.Data || []).map(item => ({
            tmpId: item.PlayerId || item.MpId || item.playerId || item.id || item.tmpId,
            axisX: item.X ?? item.x ?? item.axisX ?? item.posX,
            axisY: item.Y ?? item.y ?? item.axisY ?? item.posY
        }));
        return { error: false, data };
    }
};
