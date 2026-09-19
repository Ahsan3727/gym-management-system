const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const escapeHtml = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => MAP[c]);
export default escapeHtml;
