import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { register as registerApi } from "../../api/authApi";
import { Icon } from "../../components/UI";

export default function RegisterPage() {
  const navigate = useNavigate();

  /* ─── Giữ nguyên state và handlers ─── */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu không khớp");
      return;
    }

    try {
      setLoading(true);
      await registerApi({ name, email, password });
      alert("Đăng ký thành công");
      navigate("/login");
    } catch (err: unknown) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Đăng ký thất bại");
      } else {
        setError("Lỗi không xác định");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card animate-fade-in">
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div
          className="sig-gradient"
          style={{ width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          <Icon name="medical_services" size={22} fill style={{ color: "#fff" }} />
        </div>
        <div>
          <div
            className="font-headline"
            style={{ fontWeight: 800, fontSize: "1rem", background: "linear-gradient(135deg,#1e3a8a,#1d4ed8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          >
            Pharma WMS
          </div>
        </div>
      </div>

      {/* Back link */}
      <Link
        to="/login"
        style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--on-surface-variant)", fontSize: "0.8rem", textDecoration: "none", marginBottom: 20 }}
      >
        <Icon name="arrow_back" size={16} />
        Quay lại đăng nhập
      </Link>

      <h1
        className="font-headline"
        style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--on-surface)", marginBottom: 4, letterSpacing: "-0.02em" }}
      >
        Tạo tài khoản
      </h1>
      <p style={{ color: "var(--on-surface-variant)", fontSize: "0.875rem", marginBottom: 24 }}>
        Điền đầy đủ thông tin để đăng ký
      </p>

      <form
        className="wms-form"
        onSubmit={(e) => { e.preventDefault(); handleRegister(); }}
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        {/* Name */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Họ và tên</label>
          <input
            id="register-name"
            type="text"
            placeholder="Nguyễn Văn A"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
          />
        </div>

        {/* Email */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Email</label>
          <input
            id="register-email"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
          />
        </div>

        {/* Password */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Mật khẩu</label>
          <input
            id="register-password"
            type="password"
            placeholder="Tối thiểu 8 ký tự"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
          />
        </div>

        {/* Confirm Password */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Xác nhận mật khẩu</label>
          <input
            id="register-confirm"
            type="password"
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--error)", fontSize: "0.8rem", background: "var(--error-container)", padding: "8px 12px", borderRadius: 8 }}>
            <Icon name="error" size={14} />
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          id="register-submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ width: "100%", justifyContent: "center", padding: "12px 18px", borderRadius: 10, marginTop: 4 }}
        >
          {loading ? "Đang xử lý..." : (
            <><Icon name="person_add" size={18} /> Đăng ký</>
          )}
        </button>
      </form>
    </div>
  );
}
