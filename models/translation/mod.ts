import type { ModelManager } from "../../model_manager.ts";
import type { Language } from "./language.ts";
import { Model } from "../../model.ts";
import { encode } from "../../utils/encode.ts";

export interface TranslationModelInit<
  SourceLanguages extends Language[] = Language[],
  TargetLanguages extends Language[] = Language[],
> {
  sourceLanguages: SourceLanguages;
  targetLanguages: TargetLanguages;
}

export interface TranslateInit<
  ModelInit extends TranslationModelInit = TranslationModelInit,
> {
  inputs: string[];
  sourceLanguage: ModelInit["sourceLanguages"][number];
  targetLanguage: ModelInit["targetLanguages"][number];
}

/**
 * A model for translating text from any of the given source languages to any
 * of the given target languages.
 */
export class TranslationModel<T extends TranslationModelInit> extends Model {
  #init: T;

  constructor(manager: ModelManager, rid: number, init: T) {
    super(manager, rid);
    this.#init = init;
  }

  /**
   * Translates the given text in the source language into the target language.
   */
  async translate(init: TranslateInit<T>): Promise<string[]> {
    const { bindings, assertCode, helpers } = this.manager;
    const bytes = encode(JSON.stringify(init));
    const len = await bindings
      .translation_translate(this.rid, bytes, bytes.length)
      .then(assertCode);
    return JSON.parse(await helpers.getResultString(len));
  }
}
