import type { ModelManager } from "../model_manager.ts";
import { Model } from "../model.ts";
import { encode } from "../utils/encode.ts";

/** Describes the spectrum that the sentiment points towards. */
export enum Polarity {
  Negative,
  Positive,
}

/** Describes the sentiment of a given input. */
export interface Sentiment {
  /** The polarity of the statement. */
  polarity: Polarity;
  /** The confidence score of the polarity. */
  score: number;
}

/** A model used to calculate the given sentiment of inputs. */
export class SentimentModel extends Model {
  constructor(manager: ModelManager, rid: number) {
    super(manager, rid);
  }

  /** Predicts the sentiments of the given inputs. */
  async predict(input: string[]): Promise<Sentiment[]> {
    const { bindings, assertCode, helpers } = this.manager;
    const bytes = encode(JSON.stringify(input));
    const len = await bindings
      .sentiment_predict(this.rid, bytes, bytes.length)
      .then(assertCode);
    return JSON.parse(await helpers.getResultString(len));
  }
}
