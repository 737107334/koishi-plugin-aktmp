// 城市坐标反查：用游戏内坐标(axisX, axisY)反查最近城市与国家（免 key，纯本地）
// 数据源：Koenvh1/ETS2-City-Coordinate-Retriever（ETS2 游戏内坐标）
//   坐标约定：x = 东西向(对应 ets2map/EDA 的 axisX)，z = 南北向(对应 axisY)，y = 海拔(忽略)
//   因此反查在平面 (x=axisX, z=axisY) 上取最近城市。
const serverInfo = require('./serverInfo');
const euCities = require('./cities_eu.json').citiesList;
const atsCities = require('./cities_ats.json').citiesList;

// 按服务器选择数据集（统一从 serverInfo 取 ID 列表）
function datasetForServer(serverId) {
    if (serverId === 3) return atsCities;
    if (serverInfo.ETS2_IDS.indexOf(serverId) !== -1) return euCities;
    return null;
}

function nearest(list, ax, ay) {
    let best = null, bestD = Infinity;
    for (const c of list) {
        const x = parseFloat(c.x), z = parseFloat(c.z);
        const d = (x - ax) * (x - ax) + (z - ay) * (z - ay);
        if (d < bestD) { bestD = d; best = c; }
    }
    return best;
}

module.exports = {
    /**
     * 反查坐标对应的城市与国家
     * @param {number} serverId 服务器编号
     * @param {number} axisX 东西向坐标
     * @param {number} axisY 南北向坐标
     * @returns {{realName:string, country:string}|null} 找不到数据集时返回 null
     */
    locate(serverId, axisX, axisY) {
        const list = datasetForServer(serverId);
        if (!list || axisX == null || axisY == null) return null;
        const c = nearest(list, Number(axisX), Number(axisY));
        if (!c) return null;
        return { realName: c.realName, country: c.country };
    }
};
