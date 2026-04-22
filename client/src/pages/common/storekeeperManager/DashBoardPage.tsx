import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import type { RootState } from "../../../app/store";
import { ROLES } from "../../../constants/role";
import { MetricCard, Icon, PageHeader } from "../../../components/UI";
import { getDashboardSummary } from "../../../api/medicineRequestApi";

type Summary = {
  totalSkus: number;
  totalBatches: number;
  nearExpiryCount: number;
  expiredCount: number;
  warehouseCapacity: Record<string, number>;
};

/* Skeleton loader đơn giản */
function SkeletonCard() {
  return (
    <div
      className="metric-card"
      style={{ minHeight: 100, animation: "pulse 1.5s ease-in-out infinite" }}
    >
      <div style={{ width: "60%", height: 12, background: "var(--outline-variant)", borderRadius: 6, marginBottom: 12 }} />
      <div style={{ width: "40%", height: 28, background: "var(--outline-variant)", borderRadius: 6 }} />
    </div>
  );
}

export default function DashboardPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const isRequestor = user?.role === ROLES.REQUESTER;

  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardSummary()
      .then((res) => setSummary(res.data))
      .catch(() => {/* silently fail - keep null */})
      .finally(() => setLoading(false));
  }, []);

  // Tính tổng sức chứa (tất cả kho)
  const totalCapacity = summary
    ? Object.values(summary.warehouseCapacity).reduce((s, v) => s + v, 0)
    : 0;

  return (
    <div className="page animate-fade-in">
      <PageHeader
        title="Tổng quan kho"
        subtitle={new Date().toLocaleDateString("vi-VN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      />

      {/* ─── Top metrics ─── */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
          <MetricCard
            label="Tổng mặt hàng"
            value={summary?.totalSkus ?? "—"}
            icon="inventory_2"
            color="var(--primary)"
            trend={{ up: true, label: "SKU đang quản lý" }}
          />
          <MetricCard
            label="Tổng lô hàng"
            value={summary?.totalBatches ?? "—"}
            icon="layers"
            color="var(--secondary)"
            trend={{ up: true, label: "lô có tồn kho" }}
          />
          <MetricCard
            label="Lô cận date"
            value={summary?.nearExpiryCount ?? "—"}
            icon="schedule"
            color="#F59E0B"
            borderColor="#F59E0B"
            trend={{ up: false, label: "lô hàng cần chú ý" }}
          />
        </div>
      )}

      {/* ─── Bottom metrics (storekeeper/manager only) ─── */}
      {!isRequestor && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          {/* Expired */}
          <div
            className="metric-card"
            style={{ borderBottom: "4px solid var(--error)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="text-label-sm" style={{ color: "var(--on-surface-variant)", marginBottom: 8 }}>
                  Lô hết hạn
                </div>
                <div
                  className="font-headline"
                  style={{ fontSize: "2rem", fontWeight: 800, color: "var(--error)", lineHeight: 1 }}
                >
                  {loading ? "—" : (summary?.expiredCount ?? 0)}
                </div>
              </div>
              <div
                style={{ width: 40, height: 40, borderRadius: 10, background: "var(--error-container)", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Icon name="dangerous" size={22} style={{ color: "var(--error)" }} />
              </div>
            </div>
            <div
              style={{
                marginTop: 16,
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "var(--error-container)",
                borderRadius: 8,
                padding: "8px 12px",
              }}
            >
              <span
                style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--error)", display: "inline-block", flexShrink: 0 }}
              />
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--on-error-container)" }}>
                Cần xử lý ngay
              </span>
            </div>
          </div>

          {/* Warehouse capacity */}
          <div className="metric-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="text-label-sm" style={{ color: "var(--on-surface-variant)", marginBottom: 8 }}>
                  Tổng tồn kho (đơn vị)
                </div>
                <div
                  className="font-headline"
                  style={{ fontSize: "2rem", fontWeight: 800, color: "#059669", lineHeight: 1 }}
                >
                  {loading ? "—" : totalCapacity.toLocaleString("vi-VN")}
                </div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(5,150,105,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="warehouse" size={22} style={{ color: "#059669" }} />
              </div>
            </div>
            {!loading && summary && (
              <div style={{ marginTop: 16 }}>
                {Object.entries(summary.warehouseCapacity).map(([wid, qty]) => (
                  <div key={wid} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--on-surface-variant)", marginBottom: 4 }}>
                    <span>Kho {wid}</span>
                    <span style={{ fontWeight: 600, color: "var(--on-surface)" }}>{qty.toLocaleString("vi-VN")} đơn vị</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Quick actions (storekeeper/manager only) ─── */}
      {!isRequestor && (
        <div className="metric-card">
          <h3 className="font-headline" style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 16 }}>
            Thao tác nhanh
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {[
              { label: "Quản lý kho", icon: "inventory_2", color: "var(--primary)", path: "/inventory" },
              { label: "Lịch sử kho", icon: "history", color: "var(--secondary)", path: "/stock-history" },
              { label: "Xuất kho", icon: "output", color: "#059669", path: "/stock-export" },
              { label: "Kiểm kê", icon: "fact_check", color: "#F59E0B", path: "/audit" },
            ].map((action) => (
              <a
                key={action.path}
                href={action.path}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    background: "var(--surface-container-low)",
                    borderRadius: 10,
                    padding: "16px 14px",
                    textAlign: "center",
                    transition: "all 0.15s",
                    cursor: "pointer",
                    border: "1px solid var(--outline-variant)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = "var(--surface-container)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = action.color;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = "var(--surface-container-low)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = "var(--outline-variant)";
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${action.color}18`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                    <Icon name={action.icon} size={22} style={{ color: action.color }} />
                  </div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--on-surface)" }}>
                    {action.label}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ─── Requester quick actions ─── */}
      {isRequestor && (
        <div className="metric-card">
          <h3 className="font-headline" style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 16 }}>
            Thao tác nhanh
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {[
              { label: "Danh sách thuốc", icon: "medication", color: "var(--primary)", path: "/medicine" },
              { label: "Yêu cầu lấy thuốc", icon: "history_edu", color: "var(--secondary)", path: "/medicine-request" },
            ].map((action) => (
              <a key={action.path} href={action.path} style={{ textDecoration: "none" }}>
                <div
                  style={{
                    background: "var(--surface-container-low)",
                    borderRadius: 10, padding: "16px 14px",
                    display: "flex", alignItems: "center", gap: 12,
                    border: "1px solid var(--outline-variant)", transition: "all 0.15s",
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${action.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={action.icon} size={20} style={{ color: action.color }} />
                  </div>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--on-surface)" }}>
                    {action.label}
                  </span>
                  <Icon name="chevron_right" size={16} style={{ marginLeft: "auto", color: "var(--outline)" }} />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
