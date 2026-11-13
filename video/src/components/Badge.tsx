import React from "react";

type BadgeProps = {
  text: string;
  icon?: string;
  variant?: "primary" | "success" | "danger" | "neutral";
  scale?: number;
};

export const Badge: React.FC<BadgeProps> = ({
  text,
  icon,
  variant = "primary",
  scale = 1,
}) => {
  const styles: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    primary: {
      bg: "rgba(130, 143, 255, 0.12)",
      border: "rgba(130, 143, 255, 0.35)",
      text: "#96a1ff",
      glow: "rgba(130, 143, 255, 0.25)",
    },
    success: {
      bg: "rgba(30, 215, 96, 0.12)",
      border: "rgba(30, 215, 96, 0.35)",
      text: "#1ed760",
      glow: "rgba(30, 215, 96, 0.25)",
    },
    danger: {
      bg: "rgba(239, 68, 68, 0.15)",
      border: "rgba(239, 68, 68, 0.4)",
      text: "#f87171",
      glow: "rgba(239, 68, 68, 0.25)",
    },
    neutral: {
      bg: "rgba(255, 255, 255, 0.06)",
      border: "rgba(255, 255, 255, 0.15)",
      text: "#e2e8f0",
      glow: "transparent",
    },
  };

  const current = styles[variant] || styles.primary;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 22px",
        borderRadius: 9999,
        backgroundColor: current.bg,
        border: `1px solid ${current.border}`,
        boxShadow: `0 0 16px ${current.glow}`,
        color: current.text,
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: 22,
        fontWeight: 600,
        letterSpacing: "0.02em",
        scale: scale,
      }}
    >
      {icon && <span style={{ fontSize: 24 }}>{icon}</span>}
      <span>{text}</span>
    </div>
  );
};
