export interface User {
  id: string;
  username: string;
  role: "admin" | "user";
  createdAt: string;
}

export interface SavedPrompt {
  id: string;
  plainText: string;
  jsonText: string;
  imageThumbnail: string;
  language: string;
  confidence: number;
  createdAt: string;
  userId: string;
  userName: string;
}

export interface OCRResult {
  plainText: string;
  language: string;
  confidence: number;
}
