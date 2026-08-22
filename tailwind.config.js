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
        "primary-gradient": "var(--primary-gradient)",
        highlight: "var(--highlight)",
        background: "var(--background)",
        disabled: "var(--disabled)",
      },
      spacing: {
        st: "var(--safe-top)",
        sb: "var(--safe-bottom)",
      },
      fontSize: {
        "4xs": ["10px", "14px"],
        "3xs": ["11px", "16px"],
        "2xs": ["12px", "16px"],
        xs: ["13px", "18px"],
        sm: ["14px", "18px"],
        base: ["15px", "20px"],
        lg: ["16px", "22px"],
        xl: ["18px", "24px"],
      },
    },
  },
};
