import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import type { RootState } from "../../app/store";
import { logout } from "../../features/auth/authSlice";
import { ROUTES } from "../../constants/routes";
import { Icon } from "../../components/UI";

const PAGE_TITLES: Record<string, string> = {
  [ROUTES.DASHBOARD]: "Tổng quan",
  [ROUTES.INVENTORY]: "Kho thuốc",
  [ROUTES.INVENTORY_MAP]: "Sơ đồ kho",
  [ROUTES.STOCK_HISTORY]: "Lịch sử kho",
  [ROUTES.STOCK_EXPORT]: "Yêu cầu xuất kho",
  [ROUTES.STOCK_IMPORT]: "Thông báo nhập kho",
  [ROUTES.MEDICINE]: "Danh sách thuốc",
  [ROUTES.MEDICINE_REQUEST]: "Yêu cầu lấy thuốc",
  [ROUTES.MEDICINE_REQUEST_CREATE]: "Tạo yêu cầu lấy thuốc",
  [ROUTES.AUDIT]: "Kiểm kê kho",
  [ROUTES.AUDIT_CREATE]: "Tạo đợt kiểm kê",
  [ROUTES.PROFILE]: "Hồ sơ cá nhân",
};

const ROLE_LABEL: Record<string, string> = {
  REQUESTER: "Trình dược viên",
  STOREKEEPER: "Thủ kho",
  MANAGER: "Quản lý kho",
  requestor: "Trình dược viên",
};

export default function Topbar() {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const title = PAGE_TITLES[location.pathname] ?? "Pharma WMS";

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const initials = user?.name
    ?.split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase() ?? "U";

  return (
    <header className="wms-topbar">
      {/* Page title */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          className="font-headline"
          style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--on-surface)" }}
        >
          {title}
        </span>
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Notifications stub */}
        <button
          className="btn btn-ghost"
          style={{ padding: 8, borderRadius: 8, position: "relative" }}
        >
          <Icon name="notifications" size={22} />
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              background: "var(--error)",
              borderRadius: "50%",
            }}
          />
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 32, background: "var(--outline-variant)" }} />

        {/* User info */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
          onClick={() => navigate(ROUTES.PROFILE)}
        >
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--on-surface)" }}>
              {user?.name ?? "—"}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--outline)" }}>
              {ROLE_LABEL[user?.role ?? ""] ?? user?.role}
            </div>
          </div>
          <div className="avatar">{initials}</div>
        </div>

        {/* Logout */}
        <button
          className="btn btn-ghost"
          style={{ padding: 8, borderRadius: 8, color: "var(--error)" }}
          onClick={handleLogout}
          title="Đăng xuất"
        >
          <Icon name="logout" size={20} />
        </button>
      </div>
    </header>
  );
}
