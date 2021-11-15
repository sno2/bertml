import type { TypedDLOpenDynamicLib } from "https://deno.land/x/typedffi@v0.1.2/mod.ts";
import type { Model } from "./model.ts";
import { QAModel } from "./models/qa.ts";
import { NERModel } from "./models/ner.ts";
import { SentimentModel } from "./models/sentiment.ts";
import { TranslationModel } from "./models/translation/mod.ts";
import type { TranslationModelInit } from "./models/translation/mod.ts";
import { encode } from "./utils/encode.ts";

const symbolDefinitions = {
  create_qa_model: { parameters: [], result: "isize", nonblocking: true },
  qa_query: {
    parameters: ["usize", "buffer", "usize", "usize", "usize"],
    result: "isize",
    nonblocking: true,
  },
  create_ner_model: { parameters: [], result: "isize", nonblocking: true },
  ner_predict: {
    parameters: ["usize", "buffer", "usize"],
    result: "isize",
    nonblocking: true,
  },
  create_sentiment_model: {
    parameters: [],
    result: "isize",
    nonblocking: true,
  },
  sentiment_predict: {
    parameters: ["usize", "buffer", "usize"],
    result: "isize",
    nonblocking: true,
  },
  create_translation_model: {
    parameters: ["buffer", "usize"],
    result: "isize",
    nonblocking: true,
  },
  translation_translate: {
    parameters: ["usize", "buffer", "usize"],
    result: "isize",
    nonblocking: true,
  },
  error_len: { parameters: [], result: "usize", nonblocking: true },
  fill_result: {
    parameters: ["buffer", "usize"],
    result: "void",
    nonblocking: true,
  },
  fill_error: { parameters: ["buffer"], result: "void", nonblocking: true },
  delete_model: { parameters: ["usize"], result: "isize", nonblocking: true },
} as const;

type FFISymbols = TypedDLOpenDynamicLib<typeof symbolDefinitions>["symbols"];

const BINARY_LOCATION = (() => {
  const [prefix, ext] = {
    windows: ["", "dll"],
    darwin: ["lib", "dylib"],
    linux: ["lib", "so"],
  }[Deno.build.os];

  const name = "libffi";
  const path = "./target/debug/";

  return `${path}${prefix}${name}.${ext}`;
})();

export class BertMLError extends Error {
  constructor(name: string) {
    super(name);
    this.name = name;
  }
}

/** Provides an abstraction for creating models that run on the same native thread (but don't block the JS thread). */
export class ModelManager {
  #symbols: FFISymbols;
  #close: () => void;
  #models: Model[] = [];
  #isClosed = false;

  isClosed(): boolean {
    return this.#isClosed;
  }

  #assertCode = async (code: number) => {
    if (code < 0) {
      const { bindings } = this;
      const len = await bindings.error_len();
      const buf = new Uint8Array(len);
      await bindings.fill_error(buf);
      throw new BertMLError(new TextDecoder().decode(buf));
    }
    return code;
  };

  /** Asserts a value returned from a FFI function and throws with the error pulled from Rust stack if present. */
  get assertCode(): (code: number) => Promise<number> {
    return this.#assertCode.bind(this);
  }

  /** The native FFI functions - only use this if you know what you're doing. */
  get bindings(): FFISymbols {
    return this.#symbols;
  }

  constructor() {
    const lib = Deno.dlopen(BINARY_LOCATION, symbolDefinitions as any);
    this.#symbols = lib.symbols as any;
    this.#close = lib.close.bind(lib);
  }

  async createQAModel(): Promise<QAModel> {
    const rid = await this.bindings.create_qa_model().then(this.assertCode);
    const model = new QAModel(this, rid);
    this.#models.push(model);
    return model;
  }

  async createNERModel(): Promise<NERModel> {
    const rid = await this.bindings.create_ner_model().then(this.assertCode);
    const model = new NERModel(this, rid);
    this.#models.push(model);
    return model;
  }

  async createSentimentModel(): Promise<SentimentModel> {
    const rid = await this.bindings.create_sentiment_model().then(
      this.assertCode,
    );
    const model = new SentimentModel(this, rid);
    this.#models.push(model);
    return model;
  }

  async createTranslationModel(
    init: TranslationModelInit,
  ): Promise<TranslationModel> {
    const bytes = encode(JSON.stringify(init));
    const rid = await this.bindings.create_translation_model(
      bytes,
      bytes.length,
    ).then(this.assertCode);
    const model = new TranslationModel(this, rid, init);
    this.#models.push(model);
    return model;
  }

  close() {
    this.#close();
    this.#isClosed = true;
  }
}