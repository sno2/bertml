export class BertMLError extends Error {
  constructor(name: string) {
    super(name);
    this.name = name;
  }
}
