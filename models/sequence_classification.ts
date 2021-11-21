export interface Label {
  text: string;
  /** The confidence score. */
  score: number;
  /** The index of the label. */
  id: number;
  sentence: number;
}
