export interface CurriculumRecommendation {
    topic: string;
    confidencePercent: number;
    rationale: string;
    affectedBatchIds: string[];
    suggestedAction: 'add-module' | 'extend-session' | 'revise-content';
}
export interface CurriculumCopilotResponse {
    batchIds: string[];
    recommendations: CurriculumRecommendation[];
    generatedAt: string;
}
export interface CohortMetrics {
    feedbackCompletionPercent: number;
    quizAverage: number;
    readinessScore: number;
    streamDistribution: Record<string, number>;
}
export interface CohortComparisonResponse {
    batchA: {
        batchId: string;
        metrics: CohortMetrics;
    };
    batchB: {
        batchId: string;
        metrics: CohortMetrics;
    };
    metrics: {
        feedbackCompletion: {
            batchA: number;
            batchB: number;
            delta: number;
        };
        quizAverage: {
            batchA: number;
            batchB: number;
            delta: number;
        };
        readinessScore: {
            batchA: number;
            batchB: number;
            delta: number;
        };
    };
    insights: string[];
}
export interface TopPerformerEntry {
    maverickId: string;
    displayName: string;
    compositeScore: number;
    rank: number;
    sonicNominationEligible: boolean;
    strideFastTrackEligible: boolean;
}
export interface TopPerformersResponse {
    batchId: string;
    topPercentile: number;
    performers: TopPerformerEntry[];
    totalMavericks: number;
}
export interface MaverickReminderTiming {
    maverickId: string;
    optimalHourUtc: number;
    engagementScore: number;
    preferredChannel: 'email' | 'sms';
}
export interface ReminderTimingResponse {
    batchId: string;
    modelVersion: string;
    maverickTimings: MaverickReminderTiming[];
}
export type ExecutiveReportFormat = 'pdf' | 'excel';
export interface GenerateExecutiveReportPayload {
    batchId: string;
    format: ExecutiveReportFormat;
}
export interface GenerateExecutiveReportResult {
    batchId: string;
    format: ExecutiveReportFormat;
    narrativeParagraphs: string[];
    downloadUrl: string;
    generatedAt: string;
}
