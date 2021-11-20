import type { ModelManager } from "../../model_manager.ts";
import type { Language } from "./language.ts";
import { Model } from "../../model.ts";
import { encode } from "../../utils/encode.ts";
import { decode } from "../../utils/decode.ts";

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

export class TranslationModel<T extends TranslationModelInit> extends Model {
  #init: T;

  constructor(manager: ModelManager, rid: number, init: T) {
    super(manager, rid);
    this.#init = init;
  }

  async translate(init: TranslateInit<T>): Promise<string[]> {
    const { bindings, assertCode } = this.manager;
    const bytes = encode(JSON.stringify(init));
    const len = await bindings
      .translation_translate(this.rid, bytes, bytes.length)
      .then(assertCode);
    const buf = new Uint8Array(len);
    await bindings.fill_result(buf, len);
    const json = decode(buf);
    return JSON.parse(json);
  }
}
