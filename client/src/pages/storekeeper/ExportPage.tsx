import { useMemo, useState, useEffect } from "react";
import { PageHeader, Icon, StatusPill, EmptyState } from "../../components/UI";
import {
  getPendingExportRequests,
  getBatchesByMedicine,
  completeExportRequest,
} from "../../api/medicineRequestApi";

/* ─── Giữ nguyên types ─── */
type RequestItem = { productId: number; productName: string; quantity: number };
type StockRequest = { id: number; status: "pending" | "approved" | "rejected" | "PENDING" | "APPROVED" | "REJECTED"; items: RequestItem[] };
type Batch = { id: number; medicine_id: number; batch_code: string; quantity: number; expiry_date: string };
type ExportItem = { batchId: number; batchCode: string; quantity: number; productId: number };

export default function ExportPage() {
  /* ─── State ─── */
  const [stockRequests, setStockRequests] = useState<StockRequest[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<number>(0);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [exportItems, setExportItems] = useState<ExportItem[]>([]);

  // Fetch danh sách yêu cầu pending
  useEffect(() => {
    getPendingExportRequests()
      .then((res) => {
        const data: StockRequest[] = res.data;
        setStockRequests(data);
        if (data.length > 0) {
          setSelectedId(data[0].id);
          setSelectedProductId(data[0].items?.[0]?.productId ?? null);
        }
      })
      .catch((err) => alert(err.response?.data?.message || "Lỗi tải danh sách yêu cầu"))
      .finally(() => setLoading(false));
  }, []);

  // Fetch batches theo medicine khi selectedProductId thay đổi
  useEffect(() => {
    if (!selectedProductId) { setBatches([]); return; }
    getBatchesByMedicine(selectedProductId)
      .then((res) => setBatches(res.data))
      .catch(() => setBatches([]));
  }, [selectedProductId]);

  const request = useMemo(() => stockRequests.find((r) => r.id === selectedId), [selectedId, stockRequests]);

  const relatedBatches = useMemo(() => {
    if (!selectedProductId) return [];
    return batches
      .filter((b) => b.medicine_id === selectedProductId && b.quantity > 0)
      .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());
  }, [selectedProductId, batches]);

  const totalExport = exportItems.reduce((s, i) => s + i.quantity, 0);

  const handleAdd = (b: Batch) => {
    setExportItems((prev) => {
      const existed = prev.find((i) => i.batchId === b.id);
      if (existed) return prev.map((i) => i.batchId === b.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { batchId: b.id, batchCode: b.batch_code, quantity: 1, productId: b.medicine_id }];
    });
  };

  const handleIncrease = (id: number) => setExportItems((prev) => prev.map((i) => i.batchId === id ? { ...i, quantity: i.quantity + 1 } : i));
  const handleDecrease = (id: number) => setExportItems((prev) => prev.map((i) => i.batchId === id ? { ...i, quantity: i.quantity - 1 } : i).filter((i) => i.quantity > 0));
  const handleRemove = (id: number) => setExportItems((prev) => prev.filter((i) => i.batchId !== id));

  const handleSubmit = async () => {
    if (!exportItems.length) return;
    try {
      await completeExportRequest(
        selectedId,
        exportItems.map((i) => ({ batch_id: i.batchId, quantity: i.quantity }))
      );
      alert("Xuất kho thành công!");
      setExportItems([]);
      // Refresh danh sách
      const res = await getPendingExportRequests();
      setStockRequests(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi xuất kho");
    }
  };

  if (loading) return <div className="page"><p style={{ color: "var(--on-surface-variant)" }}>Đang tải...</p></div>;

  return (
    <div className="page animate-fade-in" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <PageHeader title="Yêu cầu xuất kho" subtitle="Chọn lô thuốc để thực hiện xuất kho theo FEFO" />

      <div style={{ display: "flex", gap: 20, flex: 1, minHeight: 0 }}>
        {/* ─── Left: Request list ─── */}
        <div style={{ width: 260, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="text-label-sm" style={{ color: "var(--on-surface-variant)", padding: "0 4px" }}>Yêu cầu chờ xử lý</div>
          {stockRequests.length === 0 ? (
            <EmptyState icon="inbox" message="Không có yêu cầu nào" />
          ) : (
            stockRequests.map((r) => (
              <div
                key={r.id}
                onClick={() => { setSelectedId(r.id); setSelectedProductId(r.items[0]?.productId ?? null); setExportItems([]); }}
                style={{
                  padding: "14px 16px",
                  borderRadius: 10,
                  cursor: "pointer",
                  border: `1px solid ${selectedId === r.id ? "var(--primary-container)" : "var(--outline-variant)"}`,
                  background: selectedId === r.id ? "rgba(30,64,175,0.06)" : "var(--surface-container-lowest)",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: "0.875rem", color: selectedId === r.id ? "var(--primary)" : "var(--on-surface)" }}>
                    Request #{r.id}
                  </span>
                  <StatusPill status={r.status.toLowerCase()} label={r.status === "pending" || r.status === "PENDING" ? "Chờ" : r.status} />
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--on-surface-variant)" }}>
                  {r.items.length} loại thuốc · {r.items.reduce((s, i) => s + i.quantity, 0)} đơn vị
                </p>
              </div>
            ))
          )}
        </div>

        {/* ─── Right: Batch panel + Cart ─── */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, minWidth: 0 }}>
          {/* Batch panel */}
          <div className="metric-card" style={{ padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Product tabs */}
            <div style={{ display: "flex", gap: 6, padding: "14px 16px", borderBottom: "1px solid var(--outline-variant)", overflowX: "auto" }}>
              {request?.items.map((item) => (
                <button
                  key={item.productId}
                  onClick={() => setSelectedProductId(item.productId)}
                  className={`btn ${selectedProductId === item.productId ? "btn-primary" : "btn-secondary"}`}
                  style={{ flexShrink: 0, padding: "6px 14px", fontSize: "0.8rem" }}
                >
                  {item.productName}
                </button>
              ))}
            </div>

            {/* FEFO label */}
            <div style={{ padding: "8px 16px", background: "rgba(30,64,175,0.04)", borderBottom: "1px solid var(--outline-variant)", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="schedule" size={14} style={{ color: "var(--primary)" }} />
              <span style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 600 }}>Sắp xếp FEFO (hạn gần nhất ưu tiên)</span>
            </div>

            {/* Batch list */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {relatedBatches.length === 0 ? (
                <EmptyState icon="inventory_2" message="Không có lô khả dụng" />
              ) : (
                <table className="wms-table">
                  <thead>
                    <tr>
                      <th>Mã lô</th>
                      <th>Hạn sử dụng</th>
                      <th>Tồn kho</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatedBatches.map((b) => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 600 }}>{b.batch_code}</td>
                        <td style={{ color: new Date(b.expiry_date) < new Date() ? "var(--error)" : "var(--on-surface)" }}>
                          {new Date(b.expiry_date).toLocaleDateString("vi-VN")}
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: "var(--primary)" }}>{b.quantity}</span>
                        </td>
                        <td>
                          <button className="btn btn-primary" style={{ padding: "4px 12px", fontSize: "0.8rem" }} onClick={() => handleAdd(b)}>
                            <Icon name="add" size={14} /> Thêm
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Cart */}
          <div className="metric-card" style={{ padding: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--outline-variant)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: "0.875rem" }}>Danh sách xuất</p>
                <p style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)", marginTop: 2 }}>
                  {exportItems.length} lô đã chọn
                </p>
              </div>
              {exportItems.length > 0 && (
                <button className="btn btn-ghost" style={{ color: "var(--error)", fontSize: "0.78rem" }} onClick={() => setExportItems([])}>
                  <Icon name="clear_all" size={14} /> Xóa tất cả
                </button>
              )}
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {exportItems.length === 0 ? (
                <EmptyState icon="shopping_cart" message="Chưa chọn lô nào" />
              ) : (
                exportItems.map((i) => (
                  <div key={i.batchId} style={{ padding: "12px 20px", borderBottom: "1px solid var(--outline-variant)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{i.batchCode}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "1rem", lineHeight: 1 }} onClick={() => handleDecrease(i.batchId)}>−</button>
                      <span style={{ minWidth: 28, textAlign: "center", fontWeight: 700 }}>{i.quantity}</span>
                      <button className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "1rem", lineHeight: 1 }} onClick={() => handleIncrease(i.batchId)}>+</button>
                    </div>
                    <button className="btn btn-ghost" style={{ color: "var(--error)", padding: "4px 8px" }} onClick={() => handleRemove(i.batchId)}>
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={{ borderTop: "1px solid var(--outline-variant)", padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: "0.875rem", color: "var(--on-surface-variant)" }}>Tổng số lượng</span>
                <span className="font-headline" style={{ fontWeight: 800, fontSize: "1.25rem" }}>{totalExport}</span>
              </div>
              <button
                id="btn-confirm-export"
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "12px", borderRadius: 10 }}
                onClick={handleSubmit}
                disabled={exportItems.length === 0}
              >
                <Icon name="output" size={18} /> Xác nhận xuất kho
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
