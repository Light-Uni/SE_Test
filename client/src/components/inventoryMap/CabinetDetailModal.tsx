import { useState } from "react";
import type { CabinetInfo } from "../../types/inventoryMap";
import { ROLES } from "../../constants/role";

interface Props {
  cabinet: CabinetInfo;
  userRole: string;
  onClose: () => void;
  onToggleFull: (key: string, isFull: boolean) => Promise<void>;
}

const STATUS_LABEL: Record<string, string> = {
  safe:    "Còn hạn",
  near:    "Cận date",
  expired: "Hết hạn",
  empty:   "Trống",
};

const STATUS_COLOR: Record<string, string> = {
  safe:    "#059669",
  near:    "#F59E0B",
  expired: "#EF4444",
  empty:   "#9CA3AF",
};

export default function CabinetDetailModal({ cabinet, userRole, onClose, onToggleFull }: Props) {
  const [loading, setLoading] = useState(false);
  const isStorekeeper = userRole === ROLES.STOREKEEPER;

  const handleToggleFull = async () => {
    setLoading(true);
    try {
      await onToggleFull(cabinet.key, !cabinet.isFull);
    } finally {
      setLoading(false);
    }
  };

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "var(--surface-container)",
          border: "1px solid var(--outline-variant)",
          borderRadius: 20, width: "100%", maxWidth: 520,
          maxHeight: "85vh", display: "flex", flexDirection: "column",
          boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
          animation: "fadeIn 0.18s ease",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--outline-variant)",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--on-surface-variant)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
              Tầng {cabinet.floor} · Phòng {cabinet.room}
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--on-surface)", lineHeight: 1.2 }}>
              {cabinet.label} {cabinet.isFull && (
                <span style={{ fontSize: "0.65rem", background: "#EF4444", color: "#fff", borderRadius: 6, padding: "2px 8px", verticalAlign: "middle", marginLeft: 6 }}>
                  ĐẦY
                </span>
              )}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--on-surface-variant)", marginTop: 4 }}>
              {cabinet.drugs.length} lô · {cabinet.totalQuantity.toLocaleString()} đơn vị
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: "50%", border: "none",
              background: "var(--surface-container-high)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.2rem", color: "var(--on-surface-variant)",
              transition: "all 0.15s",
            }}
          >
            ✕
          </button>
        </div>

        {/* Drug list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
          {cabinet.drugs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--on-surface-variant)" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>📦</div>
              <div style={{ fontWeight: 600 }}>Tủ trống</div>
            </div>
          ) : (
            cabinet.drugs.map((drug) => {
              const expDate = new Date(drug.expiryDate);
              const expStr  = expDate.toLocaleDateString("vi-VN");
              return (
                <div
                  key={drug.batchId}
                  style={{
                    background: "var(--surface-container-low)",
                    border: `1px solid ${STATUS_COLOR[drug.status]}33`,
                    borderLeft: `3px solid ${STATUS_COLOR[drug.status]}`,
                    borderRadius: 10, padding: "12px 16px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--on-surface)" }}>
                      {drug.medicineName}
                    </div>
                    <span style={{
                      fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                      background: `${STATUS_COLOR[drug.status]}20`,
                      color: STATUS_COLOR[drug.status],
                    }}>
                      {STATUS_LABEL[drug.status]}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: "0.78rem", color: "var(--on-surface-variant)" }}>
                    <span>🏷 {drug.batchCode}</span>
                    <span>📦 {drug.quantity.toLocaleString()} đv</span>
                    <span style={{ color: STATUS_COLOR[drug.status] }}>📅 {expStr}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: storekeeper action */}
        {isStorekeeper && (
          <div style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--outline-variant)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: "0.85rem", color: "var(--on-surface-variant)", fontWeight: 500 }}>
              {cabinet.isFull ? "Tủ đang được đánh dấu đầy" : "Đánh dấu trạng thái tủ"}
            </span>
            <button
              onClick={handleToggleFull}
              disabled={loading}
              style={{
                padding: "8px 20px", borderRadius: 10, border: "none", cursor: "pointer",
                fontWeight: 700, fontSize: "0.85rem",
                background: cabinet.isFull ? "#EF4444" : "#059669",
                color: "#fff",
                opacity: loading ? 0.6 : 1,
                transition: "all 0.15s",
              }}
            >
              {loading ? "Đang cập nhật..." : cabinet.isFull ? "✓ Bỏ đánh dấu đầy" : "📦 Đánh dấu đã đầy"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
