export type TapeWidth = 6 | 9 | 12 | 19;

export interface DeviceDescriptor {
  name: string;
  vid: number;
  pid: number;
  supportedTapes: TapeWidth[];
  experimental?: boolean;
}

export interface PrintOptions {
  density?: 'normal' | 'high';
  copies?: number;
  tapeWidth?: TapeWidth;
}
