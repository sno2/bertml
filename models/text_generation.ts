import type { ModelManager } from "../model_manager.ts";
import { Model } from "../model.ts";
import { encode } from "../utils/encode.ts";

export interface TextGenerationInit {
  inputs: string[];
  prefix?: string;
}

export class TextGenerationModel extends Model {
  constructor(manager: ModelManager, rid: number) {
    super(manager, rid);
  }

  async generate(init: TextGenerationInit): Promise<string[]> {
    const { bindings, helpers, assertCode } = this.manager;
    const bytes = encode(JSON.stringify(init));
    const len = await bindings
      .text_generation_generate(this.rid, bytes, bytes.length)
      .then(assertCode);
    const labels = await helpers.getResultString(len);
    return JSON.parse(labels);
  }
}
