/**
 * A stand-in for the model that records whether it was called.
 *
 * The point of this file is the counter. Asserting a 401 proves the response
 * was right; it does not prove the spend was avoided. Only counting does.
 */
import type { ModelClient, ModelRequest, ModelReply } from "../../src/types.ts";

export type RecordingModel = ModelClient & {
  calls: number;
  lastRequest: ModelRequest | null;
};

export function recordingModel(reply?: Partial<ModelReply>): RecordingModel {
  const m: RecordingModel = {
    id: "recording-model",
    calls: 0,
    lastRequest: null,
    async complete(request: ModelRequest): Promise<ModelReply> {
      m.calls += 1;
      m.lastRequest = request;
      return {
        model: "recording-model",
        json: { created: [], modified: [], unparsed: [] },
        ...reply,
      };
    },
  };
  return m;
}
