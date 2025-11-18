declare module "react-qr-scanner" {
  import * as React from "react";

  export interface QrScannerProps {
    delay?: number;
    onError?: (error: any) => void;
    onScan?: (result: string | null) => void;
    style?: React.CSSProperties;
  }

  const QrScanner: React.FC<QrScannerProps>;
  export default QrScanner;
}
