import { Model } from "../model.ts";
import type { ModelManager } from "../model_manager.ts";
import { encode } from "../utils/encode.ts";

export interface ConversationInit {
  /** Specifies whether the `Conversation.history` array should be updated for every message / response. */
  includeHistory?: boolean;
}

/** A structure for holding a conversation and its history. */
export class Conversation {
  #conversationManager: ConversationManager;
  #rid: number;
  #history: [string, string][] = [];
  #init: ConversationInit;

  /** The resource id of the Uuid that references this conversation in native memory. */
  get rid() {
    return this.#rid;
  }

  get conversationManager(): ConversationManager {
    return this.#conversationManager;
  }

  /** Gets the history of all messages sent and responses in this conversation's history. */
  get history(): readonly (readonly [string, string])[] {
    return this.#history;
  }

  constructor(
    conversationManager: ConversationManager,
    rid: number,
    init: ConversationInit = {},
  ) {
    this.#conversationManager = conversationManager;
    this.#rid = rid;
    init.includeHistory ??= false;
    this.#init = init;
  }

  /** Sends the given text to the model and retreives a response from the model. */
  async sendMessage(message: string): Promise<string> {
    const {
      rid: convoRid,
      conversationManager: {
        rid: convoManagerRid,
        model: { rid: modelRid, manager },
      },
    } = this;
    const { bindings, helpers, assertCode } = manager;
    const bytes = encode(message);
    const len = await bindings
      .conversation_send(
        modelRid,
        convoManagerRid,
        convoRid,
        bytes,
        bytes.length,
      )
      .then(assertCode);
    const response = await helpers.getResultString(len);
    if (this.#init.includeHistory === true) {
      this.#history.push([message, response]);
    }
    return response;
  }
}

/** A class for managing conversations. */
export class ConversationManager {
  #model: ConversationModel;
  #rid: number;

  get rid(): number {
    return this.#rid;
  }

  get model(): ConversationModel {
    return this.#model;
  }

  constructor(model: ConversationModel, rid: number) {
    this.#model = model;
    this.#rid = rid;
  }

  async createConversation(init?: ConversationInit): Promise<Conversation> {
    const { assertCode, bindings } = this.model.manager;

    const rid = await bindings.create_conversation(this.rid).then(assertCode);
    return new Conversation(this, rid, init);
  }
}

/** A class for interacting with the conversation model. */
export class ConversationModel extends Model {
  constructor(manager: ModelManager, rid: number) {
    super(manager, rid);
  }

  async createConversationManager(): Promise<ConversationManager> {
    const { bindings, assertCode } = this.manager;
    const rid = await bindings.create_conversation_manager().then(assertCode);
    return new ConversationManager(this, rid);
  }
}
