declare module 'qrcode.react' {
  import { FC } from 'react';

  type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

  interface QRProps {
    value: string;
    size?: number;
    level?: ErrorCorrectionLevel;
    bgColor?: string;
    fgColor?: string;
    marginSize?: number;
    title?: string;
    minVersion?: number;
    maxVersion?: number;
    includeMargin?: boolean;
    imageSettings?: {
      src: string;
      height: number;
      width: number;
      excavate?: boolean;
      x?: number;
      y?: number;
    };
  }

  export const QRCodeSVG: FC<QRProps>;
  export const QRCodeCanvas: FC<QRProps>;
}
