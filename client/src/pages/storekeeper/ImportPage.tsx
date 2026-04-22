import { useMemo, useState, useEffect } from "react";
import { PageHeader, MetricCard, StatusPill, Icon, EmptyState } from "../../components/UI";
import { getImportRequests, receiveImportRequest } from "../../api/medicineRequestApi";

/* ─── Giữ nguyên types ─── */
type RequestSource = "manager" | "requestor";
type RequestType = "import" | "return";
type RequestItem = { productName: string; quantity: number };
type WarehouseRequest = {
  id: number;
  createdAt: string;
  status: "pending" | "processed" | "PENDING" | "RECEIVED";
  source: RequestSource;
  type: RequestType;
  items: RequestItem[];
  medicine_name?: string;
  quantity?: number;
  note?: string;
};

export default function ImportRequestPage() {
  /* ─── State ─── */
  const [requests, setRequests] = useState<WarehouseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WarehouseRequest | null>(null);
  const [status, setStatus] = useState<"full" | "partial">("full");
  const [note, setNote] = useState("");
  const [batchCode, setBatchCode] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [warehouseId, setWarehouseId] = useState<string>("1");
  const [expiryDate, setExpiryDate] = useState<string>("");

  // Load import requests từ API
  useEffect(() => {
    getImportRequests()
      .then((res) => {
        // Map API response sang WarehouseRequest layout
        const data = res.data.map((r: any) => ({
          id: r.id,
          createdAt: r.received_date
            ? new Date(r.received_date).toLocaleDateString("vi-VN")
            : new Date(r.created_at || Date.now()).toLocaleDateString("vi-VN"),
          status:
            r.status === "RECEIVED" ? "processed" : "pending",
          source: r.created_by ? "manager" : "requestor",
          type: "import" as RequestType,
          medicine_name: r.medicine_name,
          quantity: r.quantity,
          note: r.note,
          items: [{ productName: r.medicine_name || "—", quantity: r.quantity }],
        }));
        setRequests(data);
      })
      .catch((err) => alert(err.response?.data?.message || "Lỗi tải danh sách nhập kho"))
      .finally(() => setLoading(false));
  }, []);

  const getTotal = (items: RequestItem[]) => items.reduce((sum, i) => sum + i.quantity, 0);

  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    processed: requests.filter((r) => r.status === "processed").length,
  }), [requests]);

  const handleSubmit = async () => {
    if (!selected) return;
    try {
      await receiveImportRequest(selected.id, {
        batch_code: batchCode,
        quantity: quantity || selected.quantity || 1,
        warehouse_id: warehouseId,
        expiry_date: expiryDate,
        status,
        note,
      });
      // Cập nhật UI local
      setRequests((prev) =>
        prev.map((r) => (r.id === selected.id ? { ...r, status: "processed" } : r))
      );
      setSelected(null);
      setStatus("full");
      setNote("");
      setBatchCode("");
      setQuantity(0);
      setExpiryDate("");
      alert("Xác nhận nhận hàng thành công!");
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi xác nhận nhận hàng");
    }
  };

  if (loading) return <div className="page"><p style={{ color: "var(--on-surface-variant)" }}>Đang tải...</p></div>;

  return (
    <div className="page animate-fade-in">
      <PageHeader title="Thông báo nhập kho" subtitle="Quản lý request nhập / hoàn trả từ quản lý & người dùng" />

      {/* ─── Stats ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
        <MetricCard label="Tổng yêu cầu" value={stats.total} icon="inbox" color="var(--primary)" />
        <MetricCard label="Chờ xử lý" value={stats.pending} icon="pending" color="#F59E0B" borderColor={stats.pending > 0 ? "#F59E0B" : undefined} />
        <MetricCard label="Đã xử lý" value={stats.processed} icon="check_circle" color="#059669" />
      </div>

      {/* ─── Table ─── */}
      <div className="metric-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="wms-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Ngày</th>
              <th>Nguồn</th>
              <th>Loại</th>
              <th>Tổng SL</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr><td colSpan={7}><EmptyState icon="inbox" message="Chưa có yêu cầu nào" /></td></tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700 }}>#{r.id}</td>
                  <td>{r.createdAt}</td>
                  <td>
                    <span
                      className="pill"
                      style={{
                        background: r.source === "manager" ? "rgba(139,92,246,0.1)" : "rgba(59,130,246,0.1)",
                        color: r.source === "manager" ? "#5b21b6" : "#1e40af",
                      }}
                    >
                      {r.source === "manager" ? "QL kho" : "Người dùng"}
                    </span>
                  </td>
                  <td>{r.type === "import" ? "Nhập kho" : "Hoàn trả"}</td>
                  <td style={{ fontWeight: 600 }}>{getTotal(r.items)}</td>
                  <td>
                    <StatusPill status={r.status} label={r.status === "pending" ? "Chờ xử lý" : "Đã xử lý"} />
                  </td>
                  <td>
                    <button
                      className="btn btn-primary"
                      style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                      disabled={r.status === "processed"}
                      onClick={() => { setSelected(r); setQuantity(r.quantity || 0); }}
                    >
                      <Icon name="check_circle" size={14} /> Xử lý
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Modal ─── */}
      {selected && (
        <div className="modal-overlay">
          <div className="modal-box wms-form">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 className="font-headline" style={{ fontWeight: 700, fontSize: "1.1rem" }}>Xử lý #{selected.id}</h2>
                <p style={{ fontSize: "0.78rem", color: "var(--on-surface-variant)", marginTop: 2 }}>
                  {selected.source === "manager" ? "QL kho" : "Người dùng"} · Nhập kho · {selected.createdAt}
                </p>
              </div>
              <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setSelected(null)}>
                <Icon name="close" size={20} />
              </button>
            </div>

            {/* Info grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Thuốc", value: selected.medicine_name || selected.items[0]?.productName },
                { label: "Số lượng YC", value: getTotal(selected.items) },
                { label: "Ghi chú", value: selected.note || "—" },
              ].map((s) => (
                <div key={s.label} style={{ background: "var(--surface-container-low)", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--on-surface-variant)", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontWeight: 700, color: "var(--on-surface)" }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Thông tin lô hàng nhận */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Mã lô hàng</label>
                  <input placeholder="VD: PARA-2026-A1" value={batchCode} onChange={(e) => setBatchCode(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Số lượng thực nhận</label>
                  <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Hạn sử dụng</label>
                  <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Kho nhập</label>
                  <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                    <option value="1">Kho 1 (Thường)</option>
                    <option value="2">Kho 2 (Mát)</option>
                    <option value="3">Kho 3 (Lạnh)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Status radio */}
            <div style={{ marginBottom: 12 }}>
              <div className="text-label-sm" style={{ color: "var(--on-surface-variant)", marginBottom: 8 }}>Tình trạng nhận hàng</div>
              <div style={{ display: "flex", gap: 16 }}>
                {(["full", "partial"] as const).map((val) => (
                  <label key={val} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.875rem" }}>
                    <input type="radio" checked={status === val} onChange={() => setStatus(val)} />
                    {val === "full" ? "Đủ hàng" : "Thiếu hàng"}
                  </label>
                ))}
              </div>
            </div>

            {status === "partial" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 16 }}>
                <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Ghi chú thiếu hàng</label>
                <textarea rows={3} placeholder="Mô tả tình trạng thiếu hàng..." value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>Huỷ</button>
              <button id="btn-confirm-import" className="btn btn-primary" onClick={handleSubmit}>
                <Icon name="check_circle" size={16} /> Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
