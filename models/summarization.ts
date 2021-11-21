import type { ModelManager } from "../model_manager.ts";
import { Model } from "../model.ts";
import { encode } from "../utils/encode.ts";

export class SummarizationModel extends Model {
  constructor(manager: ModelManager, rid: number) {
    super(manager, rid);
  }

  async summarize(inputs: string[]): Promise<string[]> {
    const { bindings, helpers, assertCode } = this.manager;
    const bytes = encode(JSON.stringify(inputs));
    const len = await bindings
      .summarization_summarize(this.rid, bytes, bytes.length)
      .then(assertCode);
    const labels = await helpers.getResultString(len);
    return JSON.parse(labels);
  }
}
