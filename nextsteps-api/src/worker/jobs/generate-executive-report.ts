import type {
  GenerateExecutiveReportPayload,
  GenerateExecutiveReportResult,
} from '../../types/p7-analytics.js';

export interface GenerateExecutiveReportDeps {
  buildNarrativeParagraphs(batchId: string): Promise<string[]>;
  createDownloadUrl(batchId: string, format: GenerateExecutiveReportPayload['format']): Promise<string>;
}

export const createGenerateExecutiveReportHandler =
  (deps: GenerateExecutiveReportDeps) =>
  async (payload: GenerateExecutiveReportPayload): Promise<GenerateExecutiveReportResult> => {
    const narrativeParagraphs = await deps.buildNarrativeParagraphs(payload.batchId);
    const downloadUrl = await deps.createDownloadUrl(payload.batchId, payload.format);

    return {
      batchId: payload.batchId,
      format: payload.format,
      narrativeParagraphs,
      downloadUrl,
      generatedAt: new Date().toISOString(),
    };
  };

export const createStubGenerateExecutiveReportDeps = (): GenerateExecutiveReportDeps => ({
  buildNarrativeParagraphs: async (batchId) => [
    `Batch ${batchId} completed Phase 2 with strong feedback completion trends.`,
    'Top performers show readiness scores above cohort average; curriculum gaps identified in async patterns module.',
    'Deployment risk flags: 2 mavericks below readiness threshold — recommend targeted coaching before Hex ID activation.',
  ],
  createDownloadUrl: async (batchId, format) =>
    `https://reports.nextsteps.local/stub/${batchId}.${format}`,
});
