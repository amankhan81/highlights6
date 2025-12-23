
export enum EventType {
  SIX = 'SIX',
  FOUR = 'FOUR',
  WICKET = 'WICKET',
  OVER_END_UPDATE = 'OVER_END_UPDATE',
  NONE = 'NONE'
}

export interface Rect {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
}

export interface Highlight {
  id: string;
  type: EventType;
  timestamp: number; // in seconds
  thumbnail: string; // base64
  label: string;
  included: boolean;
}

export interface ScanSettings {
  scanSpeed: number; // 1x to 8x
  preRoll: number; // seconds
  clipDuration: number; // seconds
  detectSix: boolean;
  detectFour: boolean;
  detectWicket: boolean;
  detectOverEnd: boolean;
  detectionArea: Rect;
}

export interface DetectionResult {
  event: EventType;
  confidence: number;
}
