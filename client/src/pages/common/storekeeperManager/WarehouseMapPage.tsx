import { useState } from "react";
import { PageHeader, Icon, StatusPill, EmptyState } from "../../../components/UI";

/* ===== TYPES ===== */
type Status = "safe" | "near" | "expired" | "empty";

interface ShelfCell {
  id: string;
  label: string;
  status: Status;
  special?: "miss";
}

interface Drug {
  name: string;
  batch: string;
  exp: string;
  status: Status;
  qty: string;
}

interface CellDetail {
  title: string;
  zone: string;
  lots: number;
  drugs: Drug[];
  alert?: boolean;
}

interface FloorData {
  cold: ShelfCell[];
  cool: ShelfCell[];
  special: ShelfCell[];
}

type Floor = "floor1" | "floor2" | "special";

/* ===== DATA ===== */
const FLOORS: Record<Floor, FloorData> = {
  floor1: {
    cold: [{ id: "F1-C1", label: "C1", status: "safe" }, { id: "F1-C2", label: "C2", status: "safe" }, { id: "F1-C3", label: "C3", status: "near" }, { id: "F1-C4", label: "C4", status: "safe" }, { id: "F1-C5", label: "C5", status: "expired" }, { id: "F1-C6", label: "C6", status: "safe" }],
    cool: [{ id: "F1-M1", label: "M1", status: "safe" }, { id: "F1-M2", label: "M2", status: "safe" }, { id: "F1-M3", label: "M3", status: "near" }, { id: "F1-M5", label: "M5", status: "empty" }, { id: "F1-M6", label: "M6", status: "safe" }],
    special: [{ id: "F1-S1", label: "Q1", status: "near" }, { id: "F1-S2", label: "R1", status: "expired" }, { id: "F1-S3", label: "H1", status: "safe" }],
  },
  floor2: {
    cold: [{ id: "F2-C1", label: "C1", status: "safe" }, { id: "F2-C2", label: "C2", status: "safe" }, { id: "F2-C3", label: "C3", status: "safe" }, { id: "F2-C4", label: "C4", status: "near" }],
    cool: [{ id: "F2-M1", label: "M1", status: "safe" }, { id: "F2-M2", label: "M2", status: "near" }, { id: "F2-M3", label: "M3", status: "safe" }, { id: "F2-M4", label: "M4", status: "safe" }, { id: "F2-M5", label: "M5", status: "expired" }, { id: "F2-M6", label: "M6", status: "safe" }],
    special: [{ id: "F2-S1", label: "Q1", status: "safe" }, { id: "F2-S2", label: "R1", status: "near" }, { id: "F2-S3", label: "H1", status: "expired" }],
  },
  special: {
    cold: [{ id: "F2-C1", label: "C1", status: "safe" }, { id: "F2-C4", label: "C4", status: "near" }],
    cool: [{ id: "F2-M1", label: "M1", status: "safe" }, { id: "F2-M2", label: "M2", status: "near" }, { id: "F2-M3", label: "M3", status: "safe" }],
    special: [{ id: "SP1", label: "QUAR", status: "near" }],
  },
};

const CELL_DETAILS: Record<string, CellDetail> = {
  "F1-C1": { title: "C1 (Tầng 1)", zone: "KHO LẠNH", lots: 2, drugs: [{ name: "Insulin Aspart", batch: "#AST2300", exp: "12/2026", status: "safe", qty: "Đủ" }] },
  "F1-C3": { title: "C3 (Tầng 1)", zone: "KHO LẠNH", lots: 1, drugs: [{ name: "Vaccine X", batch: "#VX111", exp: "05/2026", status: "near", qty: "Cần chú ý" }] },
};

/* ===== COMPONENT ===== */
export default function WarehouseMap() {
  const [floor, setFloor] = useState<Floor>("floor1");
  const [selected, setSelected] = useState<string | null>(null);

  const data = FLOORS[floor];
  const detail = selected ? (CELL_DETAILS[selected] || { title: selected, zone: "Chưa phân loại", lots: 0, drugs: [] }) : null;

  return (
    <div className="page animate-fade-in" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <PageHeader
        title="Sơ đồ Kho & Điều kiện Bảo quản"
        subtitle="Quản lý không gian lưu trữ và giám sát môi trường theo chuẩn GSP"
      />

      {/* KPI Dashboard */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div className="metric-card" style={{ borderBottom: "4px solid var(--error)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>KHO LẠNH</div>
            <StatusPill status="expired" label="NGUY CẤP" />
          </div>
          <div className="font-headline" style={{ fontSize: "2rem", fontWeight: 800, color: "var(--error)" }}>8.2°C</div>
          <div style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)", marginTop: 4 }}>Vượt ngưỡng cho phép (2–8°C)</div>
        </div>
        <div className="metric-card" style={{ borderBottom: "4px solid var(--primary)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>ĐỘ ẨM TRUNG BÌNH</div>
            <StatusPill status="safe" label="ỔN ĐỊNH" />
          </div>
          <div className="font-headline" style={{ fontSize: "2rem", fontWeight: 800, color: "var(--on-surface)" }}>54%</div>
          <div style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)", marginTop: 4 }}>Cập nhật 2 phút trước</div>
        </div>
        <div className="metric-card" style={{ borderBottom: "4px solid #059669" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>HIỆU SUẤT SỬ DỤNG</div>
            <StatusPill status="safe" label="TỐT" />
          </div>
          <div className="font-headline" style={{ fontSize: "2rem", fontWeight: 800, color: "var(--on-surface)" }}>84.2%</div>
          <div style={{ marginTop: 8 }} className="progress-bar">
            <div className="progress-fill" style={{ width: "84.2%", background: "#059669" }} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 20, flex: 1, minHeight: 0 }}>
        {/* Left: Map */}
        <div className="metric-card" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Tabs and Legend */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid var(--outline-variant)", paddingBottom: 16 }}>
            <div className="tab-group">
              <button className={`tab${floor === "floor1" ? " active" : ""}`} onClick={() => { setFloor("floor1"); setSelected(null); }}>Tầng 1</button>
              <button className={`tab${floor === "floor2" ? " active" : ""}`} onClick={() => { setFloor("floor2"); setSelected(null); }}>Tầng 2</button>
              <button className={`tab${floor === "special" ? " active" : ""}`} onClick={() => { setFloor("special"); setSelected(null); }}>Đặc biệt</button>
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: "0.75rem", fontWeight: 600, color: "var(--on-surface-variant)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 2, background: "var(--surface-container-high)", border: "1px dashed var(--outline)" }} /> Trống</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 2, background: "#059669" }} /> Tốt</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 2, background: "#F59E0B" }} /> Cận date</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 2, background: "var(--error)" }} /> Hết date/Đầy</div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 24, flex: 1 }}>
            {/* Zone blocks */}
            {[
              { id: "cold", title: "KHO LẠNH", color: "var(--primary)", items: data.cold },
              { id: "cool", title: "KHO MÁT", color: "#059669", items: data.cool },
              { id: "special", title: "KHU ĐẶC BIỆT", color: "#F59E0B", items: data.special }
            ].map((zone) => (
              <div key={zone.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", background: "var(--surface-container-lowest)", border: `1px solid ${zone.color}30`, borderRadius: 16, padding: 20 }}>
                <h3 className="font-headline" style={{ color: zone.color, fontWeight: 800, marginBottom: 24 }}>{zone.title}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                  {zone.items.map((c) => {
                    let bg = "var(--surface-container-high)";
                    let border = "none";
                    let color = "#fff";
                    if (c.status === "safe") bg = "#059669";
                    else if (c.status === "near") bg = "#F59E0B";
                    else if (c.status === "expired") bg = "var(--error)";
                    else if (c.status === "empty") { bg = "var(--surface-container-highest)"; border = "1px dashed var(--outline)"; color = "var(--on-surface-variant)"; }

                    const isSelected = selected === c.id;

                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelected(c.id)}
                        style={{
                          width: 64, height: 64, borderRadius: 12,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 800, fontSize: "0.9rem", cursor: "pointer",
                          background: bg, border, color,
                          boxShadow: isSelected ? "0 0 0 3px rgba(30,64,175,0.4)" : "0 4px 6px rgba(0,0,0,0.05)",
                          transform: isSelected ? "scale(1.05)" : "none",
                          transition: "all 0.2s"
                        }}
                      >
                        {c.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Details */}
        <div className="metric-card" style={{ width: 320, flexShrink: 0, padding: 0, display: "flex", flexDirection: "column" }}>
          {detail ? (
            <>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--outline-variant)" }}>
                <div className="text-label-sm" style={{ color: "var(--on-surface-variant)", marginBottom: 4 }}>{detail.zone}</div>
                <div className="font-headline" style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--on-surface)" }}>{detail.title}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--on-surface-variant)", marginTop: 4 }}>Tình trạng: {detail.lots} lô thuốc</div>
              </div>
              <div style={{ padding: 20, flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
                {detail.drugs.length === 0 ? (
                  <EmptyState icon="inventory_2" message="Ô trống" />
                ) : (
                  detail.drugs.map((d, i) => (
                    <div key={i} style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)", borderRadius: 10, padding: 16 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 2 }}>{d.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)", fontFamily: "monospace", marginBottom: 8 }}>{d.batch}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: "var(--on-surface-variant)" }}>
                          <Icon name="event" size={14} /> {d.exp}
                        </div>
                        <StatusPill status={d.status} label={d.qty} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
              <EmptyState icon="touch_app" message="Nhấn vào một ô trên sơ đồ để xem chi tiết lô thuốc" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
