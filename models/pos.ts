import type { ModelManager } from "../model_manager.ts";
import { Model } from "../model.ts";
import { encode } from "../utils/encode.ts";

/** An entity that describes the part of speech of a word. */
export interface POSEntity {
  /** The given word. */
  word: string;
  /** The confidence score. */
  score: number;
  /** The label that defines the part of speech of the word. */
  label: string;
}

/** A model for finding the part of speech of words in a centain. */
export class POSModel extends Model {
  constructor(manager: ModelManager, rid: number) {
    super(manager, rid);
  }

  /** Predicts the parts of speech for the words in the given inputs. */
  async predict(inputs: string[]): Promise<POSEntity[]> {
    const { bindings, assertCode, helpers } = this.manager;
    const bytes = encode(JSON.stringify(inputs));
    const len = await bindings
      .pos_predict(this.rid, bytes, bytes.length)
      .then(assertCode);
    return JSON.parse(await helpers.getResultString(len));
  }
}
