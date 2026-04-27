/* ============================================================
   CLINICAL CURATOR – API Helper & Mock Data
   ============================================================ */

const API_BASE = './api';

// ── API Helper ──
async function apiFetch(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}/${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn('API unavailable, using mock data:', e.message);
    return null;
  }
}

// ── Toast Notifications ──
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast ${type !== 'success' ? type : ''}`;
  toast.innerHTML = `<span style="font-size:16px">${icons[type]||'✓'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.animation = 'slideOutRight 0.3s ease forwards'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// ── Date Helpers ──
function formatDate(dateStr) {
  if (!dateStr) return '–';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatDateShort(dateStr) {
  if (!dateStr) return '–';
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}
function daysUntilExpiry(dateStr) {
  const now = new Date(); now.setHours(0,0,0,0);
  const exp = new Date(dateStr); exp.setHours(0,0,0,0);
  return Math.floor((exp - now) / 86400000);
}
function getExpiryStatus(dateStr, nearDays = 90) {
  const days = daysUntilExpiry(dateStr);
  if (days < 0)        return 'expired';
  if (days <= nearDays) return 'near';
  return 'safe';
}
function getStatusLabel(status) {
  const map = { safe: 'AN TOÀN', near: 'CẬN DATE', expired: 'HẾT HẠN' };
  return map[status] || status;
}
function formatCurrency(n) {
  if (n >= 1e9) return (n/1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
  return n.toLocaleString('vi-VN');
}
function formatNumber(n) {
  return Number(n).toLocaleString('vi-VN');
}

// ── Current Date Time ──
function getCurrentDateTime() {
  const now = new Date();
  const days = ['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];
  const months = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
  return {
    dayName: days[now.getDay()],
    day: now.getDate(),
    month: months[now.getMonth()],
    year: now.getFullYear(),
    time: now.toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' })
  };
}

// ── Number Format ──
function numFormat(n) { return Number(n).toLocaleString('vi-VN'); }

// ═══════════════════════════════════════════════════════════
//  MOCK DATA
// ═══════════════════════════════════════════════════════════

const MOCK = {
  drugs: [
    { id: 'DRG001', code: 'AMX-500', name: 'Amoxicillin 500mg', category: 'Kháng sinh', form: 'Viên nén', unit: 'Viên', minStock: 500, nearDateDays: 90, totalQty: 5000 },
    { id: 'DRG002', code: 'PAR-650', name: 'Paracetamol 650mg', category: 'Giảm đau', form: 'Hộp 10 vỉ x 10 viên', unit: 'Hộp', minStock: 200, nearDateDays: 60, totalQty: 1420 },
    { id: 'DRG003', code: 'VAC-AZ',  name: 'Vắc-xin AstraZeneca', category: 'Vắc-xin', form: 'Lọ 10 liều', unit: 'Lọ', minStock: 50, nearDateDays: 120, totalQty: 120 },
    { id: 'DRG004', code: 'INS-HUM', name: 'Insulin Human Inj', category: 'Nội tiết', form: 'Bút tiêm 3ml', unit: 'Bút', minStock: 100, nearDateDays: 90, totalQty: 2400 },
    { id: 'DRG005', code: 'AUG-625', name: 'Augmentin 625mg', category: 'Kháng sinh', form: 'Hộp lẻ', unit: 'Viên', minStock: 300, nearDateDays: 90, totalQty: 142 },
    { id: 'DRG006', code: 'VIT-C',   name: 'Vitamin C 1000mg', category: 'Vitamin', form: 'Chai', unit: 'Chai', minStock: 100, nearDateDays: 60, totalQty: 120 },
    { id: 'DRG007', code: 'INS-GLG', name: 'Insulin Glargine', category: 'Nội tiết', form: 'Bút tiêm', unit: 'Bút', minStock: 30, nearDateDays: 90, totalQty: 24 },
  ],

  batches: [
    { id: 'BAT001', batchNo: 'AMX-2023-005', drugId: 'DRG001', drugName: 'Amoxicillin 500mg', drugCode: 'AMX-500', mfgDate: '2023-12-10', expiryDate: '2026-10-12', qty: 5000, locationId: 'LOC001', locationName: 'Kệ A1 – Tầng 3', zone: 'Kho thường (15–35°C)', status: 'safe' },
    { id: 'BAT002', batchNo: 'AZ-AT-AZ-4',   drugId: 'DRG003', drugName: 'Vắc-xin AstraZeneca', drugCode: 'VAC-AZ', mfgDate: '2024-01-01', expiryDate: '2024-05-15', qty: 120, locationId: 'LOC002', locationName: 'Kho Lạnh – Kệ C', zone: 'Kho lạnh (2–8°C)', status: 'near' },
    { id: 'BAT003', batchNo: 'PARA-1-809',    drugId: 'DRG002', drugName: 'Paracetamol 650mg', drugCode: 'PAR-650', mfgDate: '2021-08-15', expiryDate: '2024-02-15', qty: 850, locationId: 'LOC003', locationName: 'Kệ B2 – Tầng 1', zone: 'Kho mát (≤30°C)', status: 'expired' },
    { id: 'BAT004', batchNo: 'INS-H-21-13',   drugId: 'DRG004', drugName: 'Insulin Human Inj', drugCode: 'INS-HUM', mfgDate: '2024-01-20', expiryDate: '2026-01-20', qty: 2400, locationId: 'LOC004', locationName: 'Kho Lạnh – Kệ A', zone: 'Kho lạnh (2–8°C)', status: 'safe' },
    // PARA FEFO batches
    { id: 'BAT005', batchNo: '#PARA-2401', drugId: 'DRG002', drugName: 'Paracetamol 650mg', drugCode: 'PAR-650', mfgDate: '2024-01-01', expiryDate: '2024-06-15', qty: 350, locationId: 'LOC005', locationName: 'KHU-A | KẾ-02 | Ô-14', zone: 'Kho thường', status: 'near' },
    { id: 'BAT006', batchNo: '#PARA-2405', drugId: 'DRG002', drugName: 'Paracetamol 650mg', drugCode: 'PAR-650', mfgDate: '2024-05-01', expiryDate: '2024-12-20', qty: 800, locationId: 'LOC006', locationName: 'KHU-B | KẾ-05 | Ô-02', zone: 'Kho thường', status: 'near' },
    { id: 'BAT007', batchNo: '#PARA-2502', drugId: 'DRG002', drugName: 'Paracetamol 650mg', drugCode: 'PAR-650', mfgDate: '2025-02-01', expiryDate: '2025-09-02', qty: 270, locationId: 'LOC007', locationName: 'KHU-A | KẾ-01 | Ô-08', zone: 'Kho thường', status: 'safe' },
    { id: 'BAT008', batchNo: 'LOT-248195A', drugId: 'DRG005', drugName: 'Augmentin 625mg', drugCode: 'AUG-625', mfgDate: '2024-04-01', expiryDate: '2024-10-30', qty: 142, locationId: 'LOC001', locationName: 'Kệ A1 – Tầng 2', zone: 'Kho thường', status: 'near' },
    { id: 'BAT009', batchNo: 'LOT-231139C', drugId: 'DRG002', drugName: 'Paracetamol 500mg', drugCode: 'PAR-500', mfgDate: '2023-11-01', expiryDate: '2024-09-11', qty: 2150, locationId: 'LOC003', locationName: 'Kệ B1 – Tầng 2', zone: 'Kho thường', status: 'near' },
    { id: 'BAT010', batchNo: 'LOT-248212X', drugId: 'DRG001', drugName: 'Amoxicillin 500mg', drugCode: 'AMX-500', mfgDate: '2024-06-01', expiryDate: '2024-11-12', qty: 85,  locationId: 'LOC001', locationName: 'Kệ A2 – Tầng 1', zone: 'Kho thường', status: 'near' },
    { id: 'BAT011', batchNo: 'LOT-2485908', drugId: 'DRG007', drugName: 'Insulin Glargine', drugCode: 'INS-GLG', mfgDate: '2024-05-01', expiryDate: '2024-11-15', qty: 24,  locationId: 'LOC002', locationName: 'Kho Lạnh – Kệ B', zone: 'Kho lạnh (2–8°C)', status: 'near' },
    { id: 'BAT012', batchNo: 'VRC22105',   drugId: 'DRG003', drugName: 'Vaccine Infantrix Hexa', drugCode: 'VAC-IH', mfgDate: '2024-03-01', expiryDate: '2024-05-08', qty: 40,  locationId: 'LOC002', locationName: 'Kho Lạnh – Kệ A-I03', zone: 'Kho lạnh (2–8°C)', status: 'near' },
  ],

  locations: [
    { id: 'LOC001', code: 'A1-01', zone: 'Kho thường', shelf: 'A1', row: '01', condition: '15–35°C', maxQty: 2000, currentQty: 1500, items: 3 },
    { id: 'LOC002', code: 'A1-02', zone: 'Kho lạnh',   shelf: 'A1', row: '02', condition: '2–8°C',  maxQty: 500,  currentQty: 420, items: 2 },
    { id: 'LOC003', code: 'B1-01', zone: 'Kho mát',    shelf: 'B1', row: '01', condition: '≤30°C',  maxQty: 1500, currentQty: 850, items: 4 },
    { id: 'LOC004', code: 'A1-03', zone: 'Kho lạnh',   shelf: 'A1', row: '03', condition: '2–8°C',  maxQty: 600,  currentQty: 240, items: 1 },
    { id: 'LOC005', code: 'A-02-14', zone: 'Kho thường', shelf: 'KẾ-02', row: 'Ô-14', condition: '15–35°C', maxQty: 1000, currentQty: 350, items: 1 },
    { id: 'LOC006', code: 'B-05-02', zone: 'Kho thường', shelf: 'KẾ-05', row: 'Ô-02', condition: '15–35°C', maxQty: 1200, currentQty: 800, items: 1 },
  ],

  transactions: [
    { id: 'TXN001', type: 'import', date: '2024-01-20', drugName: 'Insulin Human Inj', batchNo: 'INS-H-21-13', qty: 2400, user: 'Nguyễn Văn A', note: 'Nhập từ nhà cung cấp XYZ' },
    { id: 'TXN002', type: 'export', date: '2024-02-05', drugName: 'Amoxicillin 500mg',  batchNo: 'AMX-2023-005', qty: 200,  user: 'Trần Thị B',   note: 'Xuất cho khoa Nội' },
    { id: 'TXN003', type: 'export', date: '2024-02-10', drugName: 'Paracetamol 650mg',  batchNo: 'PARA-1-809',   qty: 150,  user: 'Nguyễn Văn A', note: 'Xuất cho khoa Ngoại' },
    { id: 'TXN004', type: 'import', date: '2024-03-01', drugName: 'Augmentin 625mg',    batchNo: 'LOT-248195A',  qty: 500,  user: 'Lê Minh C',    note: 'Nhập bổ sung' },
    { id: 'TXN005', type: 'export', date: '2024-03-15', drugName: 'Vắc-xin AstraZeneca', batchNo: 'AZ-AT-AZ-4', qty: 30,   user: 'Trần Thị B',   note: 'Xuất tiêm chủng' },
  ],

  kpis: {
    totalItems:   4282,
    stockValue:   1840000000,
    nearDateLots: 124,
    expiredLots:  12,
    weekChange:   '+2.4%',
    valueChange:  '+1.2%',
  },

  distribution: [
    { name: 'Kho thường', sub: 'Nhiệt độ phòng (15–35°C)', pct: 65, capacity: '1,900/2,000 m²', color: 'blue' },
    { name: 'Kho mát',    sub: 'Dây chuyền lạnh (2–8°C)',  pct: 25, capacity: '250/1,000 m²',  color: 'green' },
    { name: 'Kho lạnh',   sub: 'Âm sâu (–20°C)',           pct: 10, capacity: '50/500 m²',     color: 'yellow' },
  ],

  fefoAlerts: [
    { drugName: 'Augmentin 625mg',    category: 'Kháng sinh · Hộp lẻ viên',    batchNo: 'LOT-248195A', expiryDate: '2024-10-30', qty: 142,   daysLeft: 25 },
    { drugName: 'Paracetamol 500mg',  category: 'Giảm đau · vỉ 10 viên',       batchNo: 'LOT-231139C', expiryDate: '2024-09-11', qty: 2150,  daysLeft: 37 },
    { drugName: 'Amoxicillin 500mg',  category: 'Kháng sinh · Chai 500ml',      batchNo: 'LOT-248212X', expiryDate: '2024-11-12', qty: 85,    daysLeft: 38 },
    { drugName: 'Insulin Glargine',   category: 'Nội tiết · Bút tiêm',          batchNo: 'LOT-2485908', expiryDate: '2024-11-15', qty: 24,    daysLeft: 41 },
  ],
};
