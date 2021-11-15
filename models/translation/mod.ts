import type { ModelManager } from "../../model_manager.ts";
import type { Language } from "./language.ts";
import { Model } from "../../model.ts";
import { encode } from "../../utils/encode.ts";

export interface TranslationModelInit {
  sourceLanguages: Language[];
  targetLanguages: Language[];
}

export interface TranslateInit {
  inputs: string[];
  sourceLanguage: Language;
  targetLanguage: Language;
}

export class TranslationModel extends Model {
  #init: TranslationModelInit;

  constructor(manager: ModelManager, rid: number, init: TranslationModelInit) {
    super(manager, rid);
    this.#init = init;
  }

  async translate(init: TranslateInit) {
    const { sourceLanguage, targetLanguage } = init;
    const { bindings, assertCode } = this.manager;
    const bytes = encode(JSON.stringify(init));
    const len = await bindings.translation_translate(
      this.rid,
      bytes,
      bytes.length,
    ).then(assertCode);
    const buf = new Uint8Array(len);
    await bindings.fill_result(buf, len);
    const json = new TextDecoder().decode(buf);
    return JSON.parse(json);
  }
}