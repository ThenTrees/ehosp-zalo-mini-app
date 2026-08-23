/**
 * Ánh xạ các biến CSS ở `src/css/app.scss` thành lớp tiện ích Tailwind.
 * Con số ở đây khớp trực tiếp với bộ design "Clinical Clarity" (DESIGN.md),
 * nên đọc design thấy 16px thì trong mã là `text-base`, thấy 12px bo góc thì
 * là `rounded-md`.
 */
module.exports = {
  darkMode: ["selector", '[zaui-theme="dark"]'],
  purge: {
    enabled: true,
    content: ["./src/**/*.{js,jsx,ts,tsx,vue}"],
  },
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        "primary-ink": "var(--primary-ink)",
        "primary-soft": "var(--primary-soft)",
        "primary-gradient": "var(--primary-gradient)",
        background: "var(--background)",
        surface: "var(--surface)",
        "surface-sunken": "var(--surface-sunken)",
        ink: "var(--ink)",
        "ink-muted": "var(--ink-muted)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        success: "var(--success)",
        "success-soft": "var(--success-soft)",
        warning: "var(--warning)",
        "warning-soft": "var(--warning-soft)",
        error: "var(--error)",
        "error-soft": "var(--error-soft)",
        disabled: "var(--disabled)",
        highlight: "var(--highlight)",
      },
      spacing: {
        st: "var(--safe-top)",
        sb: "var(--safe-bottom)",
      },
      // Thang chữ của design. `base` là 16px — cỡ thân bài, đọc được cho người
      // lớn tuổi ở phòng khám phường.
      fontSize: {
        "3xs": ["11px", "14px"], // label-sm
        "2xs": ["12px", "16px"], // label-md
        xs: ["13px", "18px"],
        sm: ["14px", "20px"], // body-md
        base: ["16px", "24px"], // body-lg
        lg: ["17px", "24px"], // headline-sm
        xl: ["20px", "28px"], // headline-md
        "2xl": ["24px", "32px"], // headline-lg
        "5xl": ["48px", "52px"],
        "6xl": ["64px", "68px"], // số thứ tự
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.5rem", // nút, ô nhập
        md: "0.75rem", // thẻ
        lg: "1rem",
        xl: "1.5rem",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0, 0, 0, 0.05)",
        overlay: "0 8px 24px rgba(0, 0, 0, 0.12)",
        action: "0 6px 16px rgba(0, 102, 255, 0.28)",
      },
      letterSpacing: {
        tightest: "-0.02em",
      },
    },
  },
};
