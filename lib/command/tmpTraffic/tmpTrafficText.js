const truckyAppApi = require('../../api/truckyAppApi');
const baiduTranslate = require('../../util/baiduTranslate');
/**
 * 服务器别名
 */
const serverNameAlias = {
    's1': 'sim1',
    's2': 'sim2',
    'p': 'eupromods1',
    'a': 'arc1'
};
/**
 * 服务器中文名
 */
const serverNameZh = {
    'sim1': 'S1',
    'sim2': 'S2',
    'eupromods1': 'P',
    'arc1': 'A'
};
/**
 * 路况程度转中文
 */
const severityToZh = {
    'Fluid': '🟢畅通',
    'Moderate': '🟠正常',
    'Congested': '🔴缓慢',
    'Heavy': '🟣拥堵',
    'Low': '🟢畅通',
    'green': '🟢畅通',
    'yellow': '🟡缓行',
    'orange': '🟠正常',
    'red': '🔴拥堵',
    'black': '🟣封闭'
};
/**
 * 位置类型转中文
 */
const typeToZh = {
    'City': '城市',
    'Road': '公路',
    'Intersection': '十字路口',
    'crash': '车祸',
    'closed': '封路',
    'event': '活动',
    'speedcamera': '测速',
    'policing': '警察',
    'overweight': '超重'
};
/**
 * 过滤标识符 - 这些类型不显示
 */
const filteredTypes = [];
/**
 * 本地翻译字典 - 优先使用此字典的翻译
 */
const localDict = {
    'Alpen Road': '阿尔卑斯山脉公路',
    'Alpen road': '阿尔卑斯山脉公路',
    'alpen road': '阿尔卑斯山脉公路',
    'Alpen': '阿尔卑斯山脉公路',
    'alpen': '阿尔卑斯山脉公路',
    'Alps': '阿尔卑斯山脉',
    'alps': '阿尔卑斯山脉',
    'Alpenstraße': '阿尔卑斯山路',
    'alpenstraße': '阿尔卑斯山路'
};
/**
 * 本地翻译函数
 */
function localTranslate(text) {
    if (localDict[text]) {
        return localDict[text];
    }
    return null;
}
/**
 * 获取路况等级文本
 */
function getSeverityFromData(traffic) {
    if (traffic.newSeverity && severityToZh[traffic.newSeverity]) {
        return severityToZh[traffic.newSeverity];
    }
    if (traffic.severity && severityToZh[traffic.severity]) {
        return severityToZh[traffic.severity];
    }
    return traffic.color || '⚪异常';
}
/**
 * 查询路况
 */
module.exports = async (ctx, cfg, serverName) => {
    // 转换服务器别名
    let serverQueryName = serverNameAlias[serverName];
    if (!serverQueryName) {
        return '🔄请输入服务器名称 (s1, s2, p, a)注意＋空格';
    }
    let trafficData = await truckyAppApi.trafficTop(ctx.http, serverQueryName);
    if (trafficData.error) {
        return '⚠️查询路况信息失败';
    }
    // 构建消息
    let message = `🚛 ${serverNameZh[serverQueryName]} 服务器热门路况交通\n`;
    message += `━━━━━━━━━━━━━\n`;
    let first = true;
    for (const traffic of trafficData.data) {
        const countryZh = await baiduTranslate(ctx, cfg, traffic.country);
        let name = traffic.name.substring(0, traffic.name.lastIndexOf('(') - 1);
        let type = traffic.name.substring(traffic.name.lastIndexOf('(') + 1, traffic.name.lastIndexOf(')'));
        // 优先使用本地翻译，其次用百度翻译
        const nameZh = localTranslate(name) || await baiduTranslate(ctx, cfg, name);
        // 如果是地理位置标识符，不显示类型
        const showType = !filteredTypes.includes(type.toLowerCase());
        if (!first) message += '\n';
        message += `${countryZh} ${nameZh}${showType ? ' (' + (typeToZh[type] || type) + ')' : ''}`;
        message += `\n路况: ${getSeverityFromData(traffic)} | 人数: ${traffic.players}`;
        message += '\n─────────';
        first = false;
    }
    message += '\n━━━━━━━━━━━━━';
    return message || '⚠️暂无路况数据';
};
