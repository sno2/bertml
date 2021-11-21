import type { ModelManager } from "../model_manager.ts";
import { Model } from "../model.ts";
import { encode } from "../utils/encode.ts";

export interface TextGenerationInit {
  /** The inputs to generate text for. */
  inputs: string[];
  /** A prefix added to each input that isn't included in the generation. */
  prefix?: string;
}

/** A model for generating text off of a given input. */
export class TextGenerationModel extends Model {
  constructor(manager: ModelManager, rid: number) {
    super(manager, rid);
  }

  /** Generates more text from a shorter piece of text. */
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
