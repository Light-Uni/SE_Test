import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import { ROLES } from "../../constants/role";
import { PageHeader, StatusPill, Icon, EmptyState } from "../../components/UI";
import {
  getPurchaseRequisitions,
  approvePurchaseRequisition,
  rejectPurchaseRequisition,
  type PurchaseRequisition,
} from "../../api/medicineRequestApi";

const STORAGE_LABEL: Record<string, string> = {
  NORMAL:  "Thường",
  COOL:    "Mát",
  COLD:    "Lạnh",
  SPECIAL: "Đặc biệt",
};


export default function PurchaseRequisitionsPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const isManager = user?.role === ROLES.MANAGER;

  const [rows, setRows] = useState<PurchaseRequisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    getPurchaseRequisitions()
      .then(setRows)
      .catch(() => alert("Không thể tải danh sách đề xuất mua hàng"))
      .finally(() => setLoading(false));
  }, []);

  const displayed = filter === "ALL" ? rows : rows.filter((r) => r.status === filter);

  const pending   = rows.filter((r) => r.status === "PENDING").length;
  const approved  = rows.filter((r) => r.status === "APPROVED").length;
  const rejected  = rows.filter((r) => r.status === "REJECTED").length;

  async function handleApprove(id: number) {
    if (!window.confirm("Duyệt đề xuất mua hàng này?")) return;
    setProcessing(id);
    try {
      await approvePurchaseRequisition(id);
      setRows((prev) => prev.map((r) => r.id === id ? { ...r, status: "APPROVED" } : r));
    } catch {
      alert("Không thể duyệt đề xuất");
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(id: number) {
    if (!window.confirm("Từ chối đề xuất mua hàng này?")) return;
    setProcessing(id);
    try {
      await rejectPurchaseRequisition(id);
      setRows((prev) => prev.map((r) => r.id === id ? { ...r, status: "REJECTED" } : r));
    } catch {
      alert("Không thể từ chối đề xuất");
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="page animate-fade-in">
      <PageHeader
        title="Đề xuất mua hàng"
        subtitle="Hệ thống tự động tạo khi tồn kho xuống dưới mức tối thiểu (min_stock)"
      />

      {/* ─── Stats ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Chờ duyệt",   value: pending,  color: "#F59E0B", icon: "hourglass_empty" },
          { label: "Đã duyệt",    value: approved, color: "#059669", icon: "check_circle"    },
          { label: "Đã từ chối",  value: rejected, color: "#DC2626", icon: "cancel"          },
        ].map((s) => (
          <div key={s.label} className="metric-card" style={{ borderBottom: `3px solid ${s.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="text-label-sm" style={{ color: "var(--on-surface-variant)", marginBottom: 8 }}>{s.label}</div>
                <div className="font-headline" style={{ fontSize: "2rem", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={s.icon} size={22} style={{ color: s.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Filter tabs ─── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={filter === f ? "btn btn-primary" : "btn btn-ghost"}
            style={{ fontSize: "0.82rem", padding: "6px 14px" }}
          >
            {f === "ALL" ? "Tất cả" : f === "PENDING" ? "Chờ duyệt" : f === "APPROVED" ? "Đã duyệt" : "Từ chối"}
            {f === "PENDING" && pending > 0 && (
              <span style={{ marginLeft: 6, background: "#F59E0B", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: "0.72rem", fontWeight: 700 }}>
                {pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── Table ─── */}
      <div className="metric-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--on-surface-variant)" }}>Đang tải...</div>
        ) : (
          <table className="wms-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Thuốc</th>
                <th>Bảo quản</th>
                <th style={{ textAlign: "right" }}>Tồn kho hiện tại</th>
                <th style={{ textAlign: "right" }}>Tồn tối thiểu</th>
                <th style={{ textAlign: "right" }}>Tồn tối đa</th>
                <th style={{ textAlign: "right" }}>SL đề xuất nhập</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
                {isManager && <th>Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={isManager ? 10 : 9}>
                    <EmptyState icon="shopping_cart" message="Không có đề xuất nào" />
                  </td>
                </tr>
              ) : (
                displayed.map((r) => {
                  const stockRatio = r.min_stock > 0 ? r.current_stock / r.min_stock : 1;
                  const isLow = stockRatio <= 0.5;
                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700 }}>#{r.id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.medicine_name}</div>
                      </td>
                      <td>
                        <span
                          className="pill"
                          style={{
                            background: "rgba(99,102,241,0.1)",
                            color: "#4338ca",
                            fontSize: "0.75rem",
                          }}
                        >
                          {STORAGE_LABEL[r.storage_type ?? "NORMAL"] ?? r.storage_type}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span style={{ fontWeight: 700, color: isLow ? "#DC2626" : "var(--on-surface)" }}>
                          {r.current_stock.toLocaleString("vi-VN")}
                        </span>
                        {isLow && (
                          <Icon name="warning" size={14} style={{ color: "#DC2626", marginLeft: 4 }} />
                        )}
                      </td>
                      <td style={{ textAlign: "right", color: "var(--on-surface-variant)" }}>
                        {r.min_stock.toLocaleString("vi-VN")}
                      </td>
                      <td style={{ textAlign: "right", color: "var(--on-surface-variant)" }}>
                        {r.max_stock != null ? r.max_stock.toLocaleString("vi-VN") : "—"}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span style={{ fontWeight: 700, color: "#059669" }}>
                          +{r.suggested_qty.toLocaleString("vi-VN")}
                        </span>
                      </td>
                      <td style={{ color: "var(--on-surface-variant)", fontSize: "0.82rem" }}>
                        {new Date(r.created_at).toLocaleDateString("vi-VN")}
                      </td>
                      <td>
                        <StatusPill
                          status={r.status === "PENDING" ? "pending" : r.status === "APPROVED" ? "processed" : "rejected"}
                          label={r.status === "PENDING" ? "Chờ duyệt" : r.status === "APPROVED" ? "Đã duyệt" : "Từ chối"}
                        />
                      </td>
                      {isManager && (
                        <td>
                          {r.status === "PENDING" ? (
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                id={`btn-approve-req-${r.id}`}
                                className="btn btn-primary"
                                style={{ padding: "5px 12px", fontSize: "0.78rem" }}
                                disabled={processing === r.id}
                                onClick={() => handleApprove(r.id)}
                              >
                                <Icon name="check" size={14} /> Duyệt
                              </button>
                              <button
                                id={`btn-reject-req-${r.id}`}
                                className="btn btn-secondary"
                                style={{ padding: "5px 12px", fontSize: "0.78rem", color: "var(--error)", border: "1px solid var(--error)" }}
                                disabled={processing === r.id}
                                onClick={() => handleReject(r.id)}
                              >
                                <Icon name="close" size={14} /> Từ chối
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.78rem", color: "var(--on-surface-variant)" }}>—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── Info box ─── */}
      <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", fontSize: "0.82rem", color: "var(--on-surface-variant)" }}>
        <Icon name="info" size={14} style={{ marginRight: 6 }} />
        Đề xuất được tạo <strong>tự động</strong> khi thủ kho hoàn thành xuất kho và tồn kho của một thuốc rơi xuống dưới hoặc bằng ngưỡng <strong>min_stock</strong>.
        Số lượng đề xuất nhập = <strong>max_stock − tồn kho hiện tại</strong>.
      </div>
    </div>
  );
}
