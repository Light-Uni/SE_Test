/* ============================================================
   Sidebar Component – shared across all pages
   ============================================================ */

const SIDEBAR_ITEMS = [
  { id: 'dashboard',      label: 'Tổng quan',       href: 'dashboard.html',      icon: 'grid' },
  { id: 'warehouse',      label: 'Quản lý Kho',     href: 'warehouse.html',      icon: 'box' },
  { id: 'import-export',  label: 'Nhập/Xuất kho',   href: 'import-export.html',  icon: 'arrow-lr' },
  { id: 'warehouse-map',  label: 'Sơ đồ Kho',       href: 'warehouse-map.html',  icon: 'map' },
  { id: 'reports',        label: 'Báo cáo/Kiểm kê', href: 'reports.html',        icon: 'chart' },
  { id: 'config',         label: 'Cấu hình',         href: 'config.html',         icon: 'settings' },
];

const ICONS = {
  grid: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  box: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`,
  'arrow-lr': `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>`,
  map: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`,
  chart: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>`,
  settings: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 19.07l-1.41 1.41M19.07 19.07l-1.41-1.41M4.93 4.93l-1.41 1.41M22 12h-2M4 12H2M12 22v-2M12 4V2"/></svg>`,
};

function initSidebar(activeId) {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <div class="sidebar-logo-icon">CC</div>
      <div class="sidebar-logo-text">
        <div class="sidebar-logo-title">Clinical Curator</div>
        <div class="sidebar-logo-sub">Pharma Logistics</div>
      </div>
    </div>
    <nav class="sidebar-nav">
      ${SIDEBAR_ITEMS.map(item => `
        <a href="${item.href}" class="nav-item ${item.id === activeId ? 'active' : ''}">
          <span class="nav-icon">${ICONS[item.icon]}</span>
          <span>${item.label}</span>
        </a>`).join('')}
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-facility">
        <div class="facility-avatar">PL</div>
        <div class="facility-info">
          <div class="facility-name">Pharmacy Logo</div>
          <div class="facility-sub">Main Facility</div>
        </div>
      </div>
    </div>`;
}
