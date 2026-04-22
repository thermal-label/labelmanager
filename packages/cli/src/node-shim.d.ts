declare module "@thermal-label/labelmanager-node" {
  export function listPrinters(): Promise<
    Array<{
      device: { name: string; vid: number; pid: number };
      serialNumber?: string;
      path: string;
    }>
  >;

  export function openPrinter(options?: {
    serialNumber?: string;
  }): Promise<{
    printText(text: string, options?: Record<string, unknown>): Promise<void>;
    printImage(image: string, options?: Record<string, unknown>): Promise<void>;
    getStatus(): Promise<Record<string, unknown>>;
    close(): void;
  }>;

  export function generateUdevRules(): string;
}
