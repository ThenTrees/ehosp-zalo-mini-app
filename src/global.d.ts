declare interface Window {
  APP_ID?: string;
  BASE_PATH?: string;
  APP_CONFIG: any;
}

/**
 * `qrcode` không kèm khai báo kiểu và `@types/qrcode` chỉ kéo theo kiểu của
 * Node. Ta chỉ gọi đúng một hàm, nên khai ngay tại đây.
 */
declare module "qrcode" {
  export function toDataURL(
    text: string,
    options?: {
      width?: number;
      margin?: number;
      errorCorrectionLevel?: "L" | "M" | "Q" | "H";
      color?: { dark?: string; light?: string };
    },
  ): Promise<string>;
}
