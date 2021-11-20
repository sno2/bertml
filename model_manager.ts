import type { TypedDLOpenDynamicLib } from "https://deno.land/x/typedffi@v0.1.2/mod.ts";
import type { Model } from "./model.ts";
import { QAModel } from "./models/qa.ts";
import { NERModel } from "./models/ner.ts";
import { SentimentModel } from "./models/sentiment.ts";
import { TranslationModel } from "./models/translation/mod.ts";
import { ConversationModel } from "./models/conversation.ts";
import { ZeroShotClassificationModel } from "./models/zero_shot_classification.ts";
import type { TranslationModelInit } from "./models/translation/mod.ts";
import { POSModel } from "./models/pos.ts";
import { encode } from "./utils/encode.ts";
import { decode } from "./utils/decode.ts";
import { BertMLError } from "./error.ts";

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
  create_conversation_model: {
    parameters: [],
    result: "isize",
    nonblocking: true,
  },
  create_conversation_manager: {
    parameters: [],
    result: "isize",
    nonblocking: true,
  },
  create_conversation: {
    parameters: ["usize"],
    result: "isize",
    nonblocking: true,
  },
  conversation_send: {
    parameters: ["usize", "usize", "usize", "buffer", "usize"],
    result: "isize",
    nonblocking: true,
  },
  create_pos_model: {
    parameters: [],
    result: "isize",
    nonblocking: true,
  },
  pos_predict: {
    parameters: ["usize", "buffer", "usize"],
    result: "isize",
    nonblocking: true,
  },
  create_zero_shot_model: {
    parameters: [],
    result: "isize",
    nonblocking: true,
  },
  zero_shot_predict: {
    parameters: ["usize", "buffer", "usize"],
    result: "isize",
    nonblocking: true,
  },
  zero_shot_predict_multilabel: {
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
  const path = "./target/release/";

  return `${path}${prefix}${name}.${ext}`;
})();

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
      throw new BertMLError(decode(buf));
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

  #helpers = {
    getResult: async (len: number): Promise<Uint8Array> => {
      const buf = new Uint8Array(len);
      await this.bindings.fill_result(buf, len);
      return buf;
    },
    getResultString: async (len: number): Promise<string> => {
      return decode(await this.helpers.getResult(len));
    },
  } as const;

  get helpers() {
    return this.#helpers;
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
    const rid = await this.bindings
      .create_sentiment_model()
      .then(this.assertCode);
    const model = new SentimentModel(this, rid);
    this.#models.push(model);
    return model;
  }

  async createTranslationModel<T extends TranslationModelInit>(
    init: T,
  ): Promise<TranslationModel<T>> {
    const bytes = encode(JSON.stringify(init));
    const rid = await this.bindings
      .create_translation_model(bytes, bytes.length)
      .then(this.assertCode);
    const model = new TranslationModel(this, rid, init);
    this.#models.push(model);
    return model;
  }

  async createConversationModel(): Promise<ConversationModel> {
    const rid = await this.bindings
      .create_conversation_model()
      .then(this.assertCode);
    const model = new ConversationModel(this, rid);
    this.#models.push(model);
    return model;
  }

  async createPOSModel(): Promise<POSModel> {
    const rid = await this.bindings.create_pos_model().then(this.assertCode);
    const model = new POSModel(this, rid);
    this.#models.push(model);
    return model;
  }

  async createZeroShotClassificationModel(): Promise<
    ZeroShotClassificationModel
  > {
    const rid = await this.bindings
      .create_zero_shot_model()
      .then(this.assertCode);
    const model = new ZeroShotClassificationModel(this, rid);
    this.#models.push(model);
    return model;
  }

  close() {
    this.#close();
    this.#isClosed = true;
  }
}
