import type { ModelManager } from "../model_manager.ts";
import { Model } from "../model.ts";
import { encode } from "../utils/encode.ts";
import type { Label } from "./sequence_classification.ts";

export interface ZeroShotPredictInit {
  inputs: string[];
  labels: string[];
  /** defaults to '128' */
  maxLength?: number;
}

/**
 * A model for creating custom labels and checking to see if these labels can
 * be matched on certain inputs.
 */
export class ZeroShotClassificationModel extends Model {
  constructor(manager: ModelManager, rid: number) {
    super(manager, rid);
  }

  /**
   * Predicts the label that has the highest confidence score for each of the
   * inputs.
   */
  async predict(init: ZeroShotPredictInit): Promise<Label[]> {
    init.maxLength ??= 128;
    const { bindings, helpers, assertCode } = this.manager;
    const bytes = encode(JSON.stringify(init));
    const len = await bindings
      .zero_shot_predict(this.rid, bytes, bytes.length)
      .then(assertCode);
    const labels = await helpers.getResultString(len);
    return JSON.parse(labels);
  }

  /** Predicts the score of each label for each of the inputs. */
  async predictMultilabel(init: ZeroShotPredictInit): Promise<Label[][]> {
    init.maxLength ??= 128;
    const { bindings, helpers, assertCode } = this.manager;
    const bytes = encode(JSON.stringify(init));
    const len = await bindings
      .zero_shot_predict_multilabel(this.rid, bytes, bytes.length)
      .then(assertCode);
    const labels = await helpers.getResultString(len);
    return JSON.parse(labels);
  }
}
