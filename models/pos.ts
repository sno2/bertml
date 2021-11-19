import type { ModelManager } from "../model_manager.ts";
import { Model } from "../model.ts";
import { encode } from "../utils/encode.ts";
import { decode } from "../utils/decode.ts";

export interface POSEntity {
  word: string;
  score: number;
  label: string;
}

export class POSModel extends Model {
  constructor(manager: ModelManager, rid: number) {
    super(manager, rid);
  }

  async predict(inputs: string[]): Promise<POSEntity[]> {
    const { bindings, assertCode } = this.manager;
    const bytes = encode(JSON.stringify(inputs));
    const len = await bindings
      .pos_predict(this.rid, bytes, bytes.length)
      .then(assertCode);
    const buf = new Uint8Array(len);
    await bindings.fill_result(buf, len);
    const json = decode(buf);
    return JSON.parse(json);
  }
}
