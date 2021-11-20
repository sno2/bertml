import type { ModelManager } from "../model_manager.ts";
import { Model } from "../model.ts";
import { encode } from "../utils/encode.ts";
import { decode } from "../utils/decode.ts";

interface NEREntity {
  word: string;
  score: number;
  label: string;
}

export class NERModel extends Model {
  constructor(manager: ModelManager, rid: number) {
    super(manager, rid);
  }

  async predict(text: string[]): Promise<NEREntity[][]> {
    const { bindings, assertCode, helpers } = this.manager;
    const bytes = encode(JSON.stringify(text));
    const len = await bindings
      .ner_predict(this.rid, bytes, bytes.length)
      .then(assertCode);
    return JSON.parse(await helpers.getResultString(len));
  }
}
