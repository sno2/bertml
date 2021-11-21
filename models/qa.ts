import type { ModelManager } from "../model_manager.ts";
import { Model } from "../model.ts";
import { encode } from "../utils/encode.ts";

export interface QAQuestion {
  /** The context to find the answer within. */
  context: string;
  /** The question to try to solve. */
  question: string;
}

export interface QAAnswer {
  /** The confidence score. */
  score: number;
  /** The start in the input of the answer. */
  start: number;
  /** The end of the input of the answer. */
  end: number;
  /** The answer text. */
  answer: string;
}

/** A query for the prediction. */
export interface QAQueryInit {
  /** The groups of questions to calculate for. */
  questionGroups: QAQuestion[];
  /** The number of top answers to include (e.g. 1 will include top result). */
  nTopAnswers?: number;
  /** The maxmimum batch size for the model forward pass. */
  batchSize?: number;
}

/** A model used for finding the answer within a context for inputs. */
export class QAModel extends Model {
  constructor(manager: ModelManager, rid: number) {
    super(manager, rid);
  }

  /** Creates a query into the model with the given question(s) and returns the results with the n top answers. */
  async query(init: QAQueryInit): Promise<QAAnswer[][]> {
    const { questionGroups, nTopAnswers = 1, batchSize = 32 } = init;
    const { bindings, assertCode, helpers } = this.manager;

    const s = JSON.stringify(questionGroups);
    const bytes = encode(s);
    const len = await bindings
      .qa_query(this.rid, bytes, s.length, nTopAnswers, batchSize)
      .then(assertCode);
    return JSON.parse(await helpers.getResultString(len));
  }
}
