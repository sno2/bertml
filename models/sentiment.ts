import type { ModelManager } from "../model_manager.ts";
import { Model } from "../model.ts";
import { encode } from "../utils/encode.ts";
import { decode } from "../utils/decode.ts";

export enum Polarity {
  Negative,
  Positive,
}

export interface Sentiment {
  polarity: Polarity;
  score: number;
}

export class SentimentModel extends Model {
  constructor(manager: ModelManager, rid: number) {
    super(manager, rid);
  }

  async predict(input: string[]): Promise<Sentiment[]> {
    const { bindings, assertCode, helpers } = this.manager;
    const bytes = encode(JSON.stringify(input));
    const len = await bindings
      .sentiment_predict(this.rid, bytes, bytes.length)
      .then(assertCode);
    return JSON.parse(await helpers.getResultString(len));
  }
}
