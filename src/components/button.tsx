import { startViewTransition } from "@/utils/miscellaneous";
import React, {
  ButtonHTMLAttributes,
  FC,
  MouseEvent,
  ReactNode,
  useEffect,
  useState,
} from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
  onDisabledClick?: () => void;
}

export const Button: FC<ButtonProps> = ({
  children,
  className,
  loading,
  disabled,
  onDisabledClick,
  onClick,
  ...props
}) => {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled && onDisabledClick) {
      onDisabledClick();
      e.preventDefault();
      return;
    }
    if (loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <button
      className={`relative overflow-hidden bg-gradient-to-br from-primary to-primary-gradient shadow shadow-highlight flex w-full h-12 p-3 justify-center items-center text-white text-lg rounded-full active:scale-95 ${className || ""}`}
      onClick={handleClick}
      {...props}
    >
      {(loading || disabled) && (
        <div className="bg-[#E1E1E1CC] absolute inset-0 pointer-events-none" />
      )}
      <div className="relative w-full h-full flex items-center justify-center">
        <div className={`${loading ? "opacity-0" : ""}`}>{children}</div>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="spinner w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </button>
  );
};
