import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ─── Video Background ─── */}
      <video
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260228_065522_522e2295-ba22-457e-8fdb-fbcd68109c73.mp4"
      />



      {/* ─── Hero Content ─── */}
      <div style={{
        position: "relative",
        zIndex: 10,
        minHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "120px 24px 60px",
        gap: 0,
      }}>
        {/* Headline */}
        <div style={{ marginBottom: 32 }}>
          <p style={{
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 600,
            fontSize: "clamp(24px, 4vw, 44px)",
            color: "#fff",
            letterSpacing: "-4px",
            lineHeight: 1.1,
            margin: "0 0 4px 0",
            textShadow: "0 2px 20px rgba(0,0,0,0.3)",
          }}>
            Hệ thống quản lý giúp
          </p>
          <p style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "clamp(52px, 9vw, 84px)",
            color: "#fff",
            lineHeight: 1.05,
            margin: 0,
            textShadow: "0 4px 32px rgba(0,0,0,0.25)",
            letterSpacing: "-1px",
          }}>
            kho thuốc hiệu quả
          </p>
        </div>

        {/* Subtext */}
        <p style={{
          fontFamily: "'Barlow', sans-serif",
          fontWeight: 500,
          fontSize: 18,
          color: "rgba(255,255,255,0.88)",
          marginBottom: 36,
          maxWidth: 520,
          lineHeight: 1.6,
          textShadow: "0 1px 8px rgba(0,0,0,0.2)",
        }}>
          Quản lý thuốc, nhập xuất kho, kiểm kê và báo cáo cho Dược sĩ, Thủ kho và Quản lý
        </p>

        {/* Secondary CTA pill */}
        <button
          onClick={() => document.getElementById("auth-form-section")?.scrollIntoView({ behavior: "smooth" })}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(255,255,255,0.97)",
            color: "#111",
            border: "none",
            borderRadius: 999,
            padding: "14px 28px",
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 600,
            fontSize: 16,
            cursor: "pointer",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.2)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.15)";
          }}
        >
          {/* Play icon */}
          <span style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "#111",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
              <path d="M1 1L9 6L1 11V1Z" fill="white"/>
            </svg>
          </span>
          Truy cập hệ thống
        </button>

        {/* Scroll indicator */}
        <div style={{
          position: "absolute",
          bottom: 32,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          animation: "auth-bounce 2s ease-in-out infinite",
        }}>
          <span style={{
            fontFamily: "'Barlow', sans-serif",
            fontSize: 11,
            fontWeight: 500,
            color: "rgba(255,255,255,0.6)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}>Cuộn xuống</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 5L8 11L14 5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* ─── Auth Form Section ─── */}
      <div
        id="auth-form-section"
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "60px 24px 80px",
          minHeight: "60vh",
        }}
      >
        {/* Glass card wrapper */}
        <div style={{
          width: "100%",
          maxWidth: 440,
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(32px)",
          borderRadius: 24,
          boxShadow: "0 24px 80px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.08)",
          padding: "40px 36px",
          border: "1px solid rgba(255,255,255,0.6)",
        }}>
          <Outlet />
        </div>
      </div>

      {/* ─── Google Fonts ─── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Instrument+Serif:ital@0;1&display=swap');

        @keyframes auth-bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(6px); }
        }

        @media (max-width: 640px) {
          .auth-nav-links {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
