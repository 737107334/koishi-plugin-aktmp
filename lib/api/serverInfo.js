// 统一服务器信息映射（通过玩家在线数对账，适配 EDA 的 serverId → 官方 TMP 服务器名）
// 单一数据源，tmpQuery、tmpPosition、cityGeo 都从这里取，不再各自维护映射
// 2026-07 已对账：EDA 只返回 ETS2 服务器，不包含 ATS（验证通过的 10 个 serverId 均有 ETS2 game 标注）

const SERVERS = {
    2:  { name: 'Simulation 1',     shortname: 'S1',  game: 'ETS2' },
    7:  { name: 'Arcade',           shortname: 'A',   game: 'ETS2' },
    8:  { name: '[US] Simulation',  shortname: 'US',  game: 'ETS2' },
    10: { name: '[US] Simulation',  shortname: 'US',  game: 'ETS2' },
    15: { name: '[Asia] Simulation',shortname: 'AS',  game: 'ETS2' },
    30: { name: '[US] Simulation',  shortname: 'US',  game: 'ETS2' },
    41: { name: 'Simulation 2',     shortname: 'S2',  game: 'ETS2' },
    45: { name: '[Asia] Simulation',shortname: 'AS',  game: 'ETS2' },
    50: { name: 'ProMods',          shortname: 'P',   game: 'ETS2' },
    51: { name: 'ProMods Arcade',   shortname: 'PA',  game: 'ETS2' },
};

// ETS2 服务器 ID 全集（用于 cityGeo 路由等）
const ETS2_IDS = Object.keys(SERVERS).map(Number).filter(id => SERVERS[id].game === 'ETS2');

/**
 * 服务器全名 → 短名（与 ak-tmpbot 插件相同的正则算法）
 */
function getAlias(name) {
    const n = (name || '').toLowerCase();
    const simMatch = n.match(/simulation\s*(\d+)/);
    if (simMatch) return 'S' + simMatch[1] + ' 服';
    if (n.includes('promods')) {
        if (n.includes('arcade') || n.includes('arc')) return 'P 服(街机)';
        return 'P 服';
    }
    if (n.includes('arcade') || n.includes('arc')) return 'A 服';
    if (n.includes('event')) return 'E 服';
    if (n.includes('us')) return '美 服';
    if (n.includes('asia')) return '亚 服';
    return '';
}

module.exports = {
    /** 根据 EDA serverId 返回官方全名，如 serverId=2 → 'Simulation 1' */
    fullName(id) { return (SERVERS[id] && SERVERS[id].name) || ''; },
    /** 根据 EDA serverId 返回短名，如 serverId=41 → 'S2服' */
    alias(id) {
        const s = SERVERS[id];
        return s ? getAlias(s.name) : '';
    },
    /** 根据 EDA serverId 返回游戏标识 'ETS2' / 'ATS' */
    game(id) { return (SERVERS[id] && SERVERS[id].game) || ''; },
    /** 判断是否为 ETS2 服务器 */
    isEts2(id) { return SERVERS[id] && SERVERS[id].game === 'ETS2'; },
    /** ETS2 服务器 ID 全集（纯数组） */
    ETS2_IDS,
    /** 根据服务器名称字符串返回短名（给 Trucky 源用），如 'Simulation 2' → 'S2服' */
    nameToAlias(name) { return getAlias(name); },
};
