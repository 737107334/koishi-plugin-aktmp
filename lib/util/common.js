/**
 * VTC 职位中文映射表
 */
const VTC_ROLE_MAP = {
    'Owner': '队长',
    'Co-Owner': '副队长',
    'Chairman': '主席',
    'Vice Chairman': '副主席',
    'Manager': '管理员',
    'Deputy Manager': '副管理员',
    'Captain': '主管',
    'Lieutenant': '副主管',
    'Recruiter': '招聘员',
    'Driver': '司机',
    'Trainee': '实习司机',
    'Member': '成员',
    'Veteran Driver': '资深司机',
    'Legend Driver': '传奇司机',
    'Pilot': '引航员',
    'Event Manager': '活动管理员',
    'Media Manager': '媒体管理员',
    'HR': '人事部',
};

/**
 * 将 Unicode 数学字母符号（粗体/斜体/粗斜体）还原为普通 ASCII
 */
function normalizeMathSymbols(str) {
    return Array.from(str).map(ch => {
        const cp = ch.codePointAt(0);
        if (cp >= 0x1D400 && cp <= 0x1D419) return String.fromCharCode(65 + (cp - 0x1D400));
        if (cp >= 0x1D41A && cp <= 0x1D433) return String.fromCharCode(97 + (cp - 0x1D41A));
        if (cp >= 0x1D434 && cp <= 0x1D44D) return String.fromCharCode(65 + (cp - 0x1D434));
        if (cp >= 0x1D44E && cp <= 0x1D467) return String.fromCharCode(97 + (cp - 0x1D44E));
        if (cp >= 0x1D468 && cp <= 0x1D481) return String.fromCharCode(65 + (cp - 0x1D468));
        if (cp >= 0x1D482 && cp <= 0x1D49B) return String.fromCharCode(97 + (cp - 0x1D482));
        if (cp >= 0x1D7CE && cp <= 0x1D7FF) return String.fromCharCode(48 + (cp - 0x1D7CE));
        return ch;
    }).join('');
}

/**
 * 翻译 VTC 职位为中文
 */
function translateVtcRole(role) {
    if (!role) return role;
    if (VTC_ROLE_MAP[role]) return VTC_ROLE_MAP[role];
    let cleaned = normalizeMathSymbols(role);
    cleaned = cleaned.replace(/[⭐🌟✨☆★●○◆◇♦♠♣♥\[\]【】]/g, '').trim();
    if (VTC_ROLE_MAP[cleaned]) return VTC_ROLE_MAP[cleaned];
    const sortedRoles = Object.keys(VTC_ROLE_MAP).sort((a, b) => b.length - a.length);
    for (const [en, zh] of sortedRoles.map(r => [r, VTC_ROLE_MAP[r]])) {
        if (new RegExp('\\b' + en.replace(/[-\/]/g, '\\$&') + '\\b', 'i').test(cleaned)) {
            return zh;
        }
    }
    return cleaned || role;
}

module.exports = {
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    translateVtcRole,
    VTC_ROLE_MAP,
};
