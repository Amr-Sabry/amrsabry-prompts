export interface SavedPrompt {
  id: string;
  plainText: string;
  jsonText: string;
  imageThumbnail: string; // base64 small preview
  language: string;
  confidence: number;
  createdAt: string; // ISO timestamp
}

export interface OCRResult {
  plainText: string;
  language: string;
  confidence: number;
}
