import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import { login as loginApi } from "../../api/authApi";
import { loginSuccess } from "../../features/auth/authSlice";
import { Icon } from "../../components/UI";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /* ─── Giữ nguyên state và handlers ─── */
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername) {
      setError("Vui lòng nhập tài khoản");
      return;
    }
    if (!trimmedPassword) {
      setError("Vui lòng nhập mật khẩu");
      return;
    }

    try {
      setLoading(true);
      const res = await loginApi({ username: trimmedUsername, password: trimmedPassword });
      const { token, user } = res.data;

      localStorage.setItem("token", token);
      dispatch(loginSuccess({ user, token }));

      if (user.role === "REQUESTER") {
        navigate("/medicine");
        return;
      }
      navigate("/dashboard");
    } catch (err) {
      console.log(err);
      setError("Sai tài khoản hoặc mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <div
          className="sig-gradient"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon name="medical_services" size={24} fill style={{ color: "#fff" }} />
        </div>
        <div>
          <div
            className="font-headline"
            style={{
              fontWeight: 800,
              fontSize: "1.1rem",
              background: "linear-gradient(135deg, #1e3a8a, #1d4ed8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Pharma WMS
          </div>
          <div className="text-label-sm" style={{ color: "var(--outline)" }}>
            Kho thuốc
          </div>
        </div>
      </div>

      {/* Title */}
      <h1
        className="font-headline"
        style={{
          fontSize: "1.75rem",
          fontWeight: 800,
          color: "var(--on-surface)",
          marginBottom: 6,
          letterSpacing: "-0.02em",
        }}
      >
        Đăng nhập
      </h1>
      <p style={{ color: "var(--on-surface-variant)", fontSize: "0.875rem", marginBottom: 28 }}>
        Nhập thông tin tài khoản để tiếp tục
      </p>

      {/* Form */}
      <form
        className="wms-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        {/* Username */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>
            Tên đăng nhập
          </label>
          <div style={{ position: "relative" }}>
            <Icon
              name="person"
              size={18}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--outline)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Nhập username"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(""); }}
              style={{ paddingLeft: 38 }}
              autoComplete="username"
              id="login-username"
            />
          </div>
        </div>

        {/* Password */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>
            Mật khẩu
          </label>
          <div style={{ position: "relative" }}>
            <Icon
              name="lock"
              size={18}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--outline)",
                pointerEvents: "none",
              }}
            />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              style={{ paddingLeft: 38, paddingRight: 40 }}
              autoComplete="current-password"
              id="login-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--outline)",
                padding: 0,
              }}
            >
              <Icon name={showPassword ? "visibility_off" : "visibility"} size={18} />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "var(--error)",
              fontSize: "0.8rem",
              background: "var(--error-container)",
              padding: "8px 12px",
              borderRadius: 8,
            }}
          >
            <Icon name="error" size={14} />
            {error}
          </div>
        )}

        {/* Forgot password */}
        <div style={{ textAlign: "right", marginTop: -8 }}>
          <Link
            to="/forgot-password"
            style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}
          >
            Quên mật khẩu?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          id="login-submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ width: "100%", justifyContent: "center", padding: "12px 18px", borderRadius: 10 }}
        >
          {loading ? (
            <>
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                  animation: "spin 0.8s linear infinite",
                  display: "inline-block",
                }}
              />
              Đang đăng nhập...
            </>
          ) : (
            <>
              <Icon name="login" size={18} />
              Đăng nhập
            </>
          )}
        </button>
      </form>

      {/* Register link */}
      <p style={{ textAlign: "center", marginTop: 24, fontSize: "0.875rem", color: "var(--on-surface-variant)" }}>
        Chưa có tài khoản?{" "}
        <Link
          to="/register"
          style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}
        >
          Tạo tài khoản
        </Link>
      </p>
    </div>
  );
}
