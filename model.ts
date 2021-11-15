import type { ModelManager } from "./model_manager.ts";

export abstract class Model {
  #rid: number;
  #manager: ModelManager;

  get rid(): number {
    return this.#rid;
  }

  get manager(): ModelManager {
    return this.#manager;
  }

  constructor(manager: ModelManager, rid: number) {
    this.#manager = manager;
    this.#rid = rid;
  }

  close() {
    this.manager.bindings.delete_model(this.#rid);
  }
}
