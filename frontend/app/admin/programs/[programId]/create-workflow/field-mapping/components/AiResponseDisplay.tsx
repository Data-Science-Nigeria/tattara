import React from 'react';
import { RotateCcw } from 'lucide-react';

interface AiResponseData {
  success: boolean;
  data?: {
    aiData?: {
      form_id?: string;
      total_rows?: number;
      rows?: Array<{
        row_index: number;
        extracted: Record<string, unknown>;
        missing_required: string[];
      }>;
      confidence?: Record<string, number>;
      meta?: {
        asr_provider?: string;
        language?: string;
        transcript_length?: number;
        cost_breakdown?: {
          asr_cost_usd?: number;
          translation_cost_usd?: number;
          llm_cost_usd?: number;
        };
      };
      metrics?: {
        asr_seconds?: number;
        vision_seconds?: number;
        llm_seconds?: number;
        total_seconds?: number;
        tokens_in?: number;
        tokens_out?: number;
        cost_usd?: number;
        model?: string;
        provider?: string;
      };
    };
    aiProcessingLogId?: string;
  };
  timestamp?: string;
  error?: string;
}

interface AiResponseDisplayProps {
  responseData: AiResponseData;
  onReset: () => void;
}

export default function AiResponseDisplay({
  responseData,
  onReset,
}: AiResponseDisplayProps) {
  return (
    <div className="rounded-lg border border-gray-300 bg-white p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h3 className="text-lg font-semibold">AI Processing Results</h3>
        <button
          onClick={onReset}
          className="self-start rounded-lg bg-gray-100 px-3 py-1 text-sm text-gray-600 hover:bg-gray-200"
        >
          <RotateCcw className="mr-1 inline h-3 w-3" />
          Reset All
        </button>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <pre className="overflow-auto text-xs break-all text-blue-800">
            {JSON.stringify(responseData, null, 2)}
          </pre>
        </div>

        {responseData.success && responseData.data?.aiData?.rows && (
          <div>
            <strong>
              Extracted Data ({responseData.data.aiData.total_rows} row
              {responseData.data.aiData.total_rows !== 1 ? 's' : ''}):
            </strong>
            {responseData.data.aiData.rows.map((row, idx) => (
              <div
                key={idx}
                className="mt-2 rounded border border-gray-200 p-2"
              >
                {(responseData.data?.aiData?.total_rows ?? 0) > 1 && (
                  <div className="mb-2 text-sm font-semibold text-gray-600">
                    Row {row.row_index + 1}
                  </div>
                )}
                <div className="space-y-1">
                  {Object.entries(row.extracted).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex flex-col gap-1 text-sm sm:flex-row sm:justify-between"
                    >
                      <span className="font-medium break-words">{key}:</span>
                      <span className="min-w-0 break-words sm:text-right">
                        {Array.isArray(value)
                          ? value.join(', ')
                          : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
                {row.missing_required.length > 0 && (
                  <div className="mt-2 text-xs break-words text-red-600">
                    Missing: {row.missing_required.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {responseData.data?.aiData?.confidence && (
          <div>
            <strong>Confidence Scores:</strong>
            <div className="mt-2 space-y-1">
              {Object.entries(responseData.data.aiData.confidence).map(
                ([key, value]) => (
                  <div
                    key={key}
                    className="flex flex-col gap-1 text-sm sm:flex-row sm:justify-between"
                  >
                    <span className="font-medium break-words">{key}:</span>
                    <span className="break-words">
                      {(value * 100).toFixed(1)}%
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {responseData.data?.aiData?.meta && (
          <div>
            <strong>Processing Info:</strong>
            <div className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              {responseData.data.aiData.meta.language && (
                <div className="break-words">
                  Language: {responseData.data.aiData.meta.language}
                </div>
              )}
              {responseData.data.aiData.meta.asr_provider && (
                <div className="break-words">
                  ASR: {responseData.data.aiData.meta.asr_provider}
                </div>
              )}
              {responseData.data.aiData.meta.transcript_length && (
                <div className="break-words">
                  Transcript: {responseData.data.aiData.meta.transcript_length}{' '}
                  chars
                </div>
              )}
            </div>
          </div>
        )}

        {responseData.data?.aiData?.metrics && (
          <div>
            <strong>Performance Metrics:</strong>
            <div className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div className="break-words">
                Total:{' '}
                {responseData.data.aiData.metrics.total_seconds?.toFixed(2)}s
              </div>
              <div className="break-words">
                Cost: ${responseData.data.aiData.metrics.cost_usd?.toFixed(6)}
              </div>
              <div className="break-words">
                Model: {responseData.data.aiData.metrics.model}
              </div>
              <div className="break-words">
                Tokens: {responseData.data.aiData.metrics.tokens_in}/
                {responseData.data.aiData.metrics.tokens_out}
              </div>
              {(responseData.data?.aiData?.metrics?.asr_seconds ?? 0) > 0 && (
                <div className="break-words">
                  ASR:{' '}
                  {responseData.data.aiData.metrics.asr_seconds?.toFixed(2)}s
                </div>
              )}
              <div className="break-words">
                LLM: {responseData.data.aiData.metrics.llm_seconds?.toFixed(2)}s
              </div>
            </div>
          </div>
        )}

        {!responseData.success && responseData.error && (
          <div className="text-sm text-red-600">
            <strong>Error:</strong>
            <div className="mt-1 break-words">{responseData.error}</div>
          </div>
        )}
      </div>
    </div>
  );
}
