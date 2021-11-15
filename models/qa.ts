import type { ModelManager } from "../model_manager.ts";
import { Model } from "../model.ts";
import { encode } from "../utils/encode.ts";
import { decode } from "../utils/decode.ts";

export interface QAQuestion {
  context: string;
  question: string;
}

export interface QAAnswer {
  score: number;
  start: number;
  end: number;
  answer: string;
}

export interface QAQueryInit {
  questionGroups: QAQuestion[];
  nTopAnswers?: number;
  /** The maxmimum batch size for the model forward pass. */
  batchSize?: number;
}

export class QAModel extends Model {
  constructor(manager: ModelManager, rid: number) {
    super(manager, rid);
  }

  /** Creates a query into the model with the given question(s) and returns the results with the n top answers. */
  async query(init: QAQueryInit): Promise<QAAnswer[][]> {
    const { questionGroups, nTopAnswers = 1, batchSize = 32 } = init;
    const { bindings, assertCode } = this.manager;

    const s = JSON.stringify(questionGroups);
    const bytes = encode(s);
    const len = await bindings.qa_query(
      this.rid,
      bytes,
      s.length,
      nTopAnswers,
      batchSize,
    ).then(assertCode);
    const buf = new Uint8Array(len);
    const res = await bindings.fill_result(buf, len);
    const json = decode(buf);
    return JSON.parse(json);
  }
}
