import api from "../utils/axiosInstance";

const BASE = "http://localhost:3000/api";

// ─── Export Requests ───────────────────────────────────────────────
export const getMyExportRequests = () =>
  api.get(`${BASE}/export-requests/my`);

export const createExportRequest = (items: { medicine_id: number; quantity: number }[]) =>
  api.post(`${BASE}/export-requests`, { items });

export const getPendingExportRequests = () =>
  api.get(`${BASE}/export-requests`);

export const approveExportRequest = (id: number) =>
  api.patch(`${BASE}/export-requests/${id}/approve`, {});

export const rejectExportRequest = (id: number, note: string) =>
  api.patch(`${BASE}/export-requests/${id}/reject`, { note });

export const completeExportRequest = (
  id: number,
  exportItems: { batch_id: number; quantity: number }[]
) =>
  api.patch(
    `${BASE}/export-requests/${id}/complete`,
    { exportItems }
  );

// ─── Import Requests ───────────────────────────────────────────────
export const getImportRequests = () =>
  api.get(`${BASE}/import-requests`);

export const createImportRequest = (data: {
  medicine_id: number;
  quantity: number;
  batch_code?: string;
  expiry_date?: string;
  note?: string;
  type?: 'IMPORT' | 'RETURN';
}) => api.post(`${BASE}/import-requests`, data);

export const receiveImportRequest = (id: number, data: object) =>
  api.patch(`${BASE}/import-requests/${id}/receive`, data);

export const rejectImportRequest = (id: number, note: string) =>
  api.patch(`${BASE}/import-requests/${id}/reject`, { note });

// ─── Dashboard ─────────────────────────────────────────────────────
export const getDashboardSummary = () =>
  api.get(`${BASE}/dashboard/summary`);

// ─── Batches (FEFO) ────────────────────────────────────────────────
export const getBatchesByMedicine = (medicineId: number) =>
  api.get(`${BASE}/batches?medicine_id=${medicineId}`);

export const getAllBatches = () =>
  api.get(`${BASE}/batches`);

// ─── Inventory ─────────────────────────────────────────────────────
export const getInventory = () =>
  api.get(`${BASE}/inventory`);

// ─── Inventory Logs ────────────────────────────────────────────────
export const getInventoryLogs = (type?: "IMPORT" | "EXPORT" | "ADJUST") =>
  api.get(`${BASE}/inventory-logs${type ? `?type=${type}` : ""}`);

// ─── Audits ────────────────────────────────────────────────────────
export const getAudits = () =>
  api.get(`${BASE}/audits`);

export const getAuditById = (id: number) =>
  api.get(`${BASE}/audits/${id}`);

export const createAudit = (items: { medicine_id: number; batch_id: number; system_qty: number; actual_qty: number }[]) =>
  api.post(`${BASE}/audits`, { items });

export const addAuditItem = (id: number, data: { medicine_id: number; batch_id: number; system_qty: number; actual_qty: number }) =>
  api.post(`${BASE}/audits/${id}/items`, data);

export const confirmAudit = (id: number) =>
  api.patch(`${BASE}/audits/${id}/confirm`, {});

// ─── Warehouses ────────────────────────────────────────────────────
export type SuggestPositionResult = {
  suggested_warehouse_id: number | null;
  warehouse_name:         string | null;
  suggested_position:     string | null;
  storage_type_required:  string;
  error:                  string | null;
};

export const getSuggestedPosition = (medicine_id: number): Promise<SuggestPositionResult> =>
  api
    .get(`http://localhost:3000/api/warehouses/suggest-position?medicine_id=${medicine_id}`)
    .then((r) => r.data);

// ─── Purchase Requisitions (UC6) ───────────────────────────────────
export type PurchaseRequisition = {
  id:            number;
  medicine_id:   number;
  medicine_name: string;
  current_stock: number;
  min_stock:     number;
  suggested_qty: number;
  status:        "PENDING" | "APPROVED" | "REJECTED";
  created_at:    string;
  max_stock?:    number;
  storage_type?: string;
};

export const getPurchaseRequisitions = (): Promise<PurchaseRequisition[]> =>
  api
    .get(`http://localhost:3000/api/purchase-requisitions`)
    .then((r) => r.data);

export const getPurchaseRequisitionsCount = (): Promise<{ count: number }> =>
  api
    .get(`http://localhost:3000/api/purchase-requisitions/count`)
    .then((r) => r.data);

export const approvePurchaseRequisition = (id: number) =>
  api.patch(`http://localhost:3000/api/purchase-requisitions/${id}/approve`, {});

export const rejectPurchaseRequisition = (id: number) =>
  api.patch(`http://localhost:3000/api/purchase-requisitions/${id}/reject`, {});

// ─── Report Export helpers ──────────────────────────────────────────
/** Trigger browser download from a binary API response */
export async function downloadReport(url: string, filename: string): Promise<void> {
  const res = await api.get(url, {
    responseType: "blob",
  });
  const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export const exportAuditReport = (auditId: number, format: "excel" | "pdf") =>
  downloadReport(
    `http://localhost:3000/api/reports/audit/${auditId}/export?format=${format}`,
    `kiem-ke-${auditId}.${format === "pdf" ? "pdf" : "xlsx"}`
  );

export const exportInventoryReport = (format: "excel" | "pdf", from = "", to = "") =>
  downloadReport(
    `http://localhost:3000/api/reports/inventory/export?format=${format}${from ? `&from=${from}` : ""}${to ? `&to=${to}` : ""}`,
    `ton-kho.${format === "pdf" ? "pdf" : "xlsx"}`
  );
