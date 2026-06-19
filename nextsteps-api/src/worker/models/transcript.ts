export interface ConfusionTimestamp {
  time: string;
  topic: string;
  clarityDip: number;
}

export interface TranscriptDocument {
  id: string;
  sessionId: string;
  rawTextRef: string;
  summary: string[];
  keyTerms: string[];
  confusionTimestamps: ConfusionTimestamp[];
  createdAt: Date;
  updatedAt: Date;
}
