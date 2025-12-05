import React from 'react';
import { RotateCcw } from 'lucide-react';

interface AiResponseData {
  success: boolean;
  data?: {
    aiData?: {
      form_id?: string;
      extracted?: Record<string, unknown>;
      confidence?: Record<string, number>;
      spans?: Record<string, unknown>;
      missing_required?: string[];
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
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-lg font-semibold">AI Processing Results</h3>
        <button
          onClick={onReset}
          className="rounded-lg bg-gray-100 px-3 py-1 text-sm text-gray-600 hover:bg-gray-200"
        >
          <RotateCcw className="mr-1 inline h-3 w-3" />
          Reset All
        </button>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <pre className="overflow-auto text-xs text-blue-800">
            {JSON.stringify(responseData, null, 2)}
          </pre>
        </div>

        {responseData.success && responseData.data?.aiData && (
          <div>
            <strong>Extracted Data:</strong>
            <div className="mt-2 space-y-1">
              {Object.entries(responseData.data.aiData.extracted || {}).map(
                ([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium">{key}:</span>
                    <span>{String(value)}</span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {responseData.data?.aiData?.confidence && (
          <div>
            <strong>Confidence Scores:</strong>
            <div className="mt-2 space-y-1">
              {Object.entries(responseData.data.aiData.confidence).map(
                ([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium">{key}:</span>
                    <span>{(value * 100).toFixed(1)}%</span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {responseData.data?.metrics && (
          <div>
            <strong>Processing Metrics:</strong>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>Total Time: {responseData.data.metrics.total_seconds}s</div>
              <div>Cost: ${responseData.data.metrics.cost_usd}</div>
              <div>Model: {responseData.data.metrics.model}</div>
              <div>
                Tokens: {responseData.data.metrics.tokens_in}/
                {responseData.data.metrics.tokens_out}
              </div>
            </div>
          </div>
        )}

        {(responseData.data?.aiData?.missing_required?.length ?? 0) > 0 && (
          <div className="text-sm text-red-600">
            <strong>Missing Required Fields:</strong>
            <ul className="mt-1 list-inside list-disc">
              {responseData.data?.aiData?.missing_required?.map(
                (field: string, index: number) => (
                  <li key={index}>{field}</li>
                )
              )}
            </ul>
          </div>
        )}

        {!responseData.success && responseData.error && (
          <div className="text-sm text-red-600">
            <strong>Error:</strong>
            <div className="mt-1">{responseData.error}</div>
          </div>
        )}
      </div>
    </div>
  );
}
