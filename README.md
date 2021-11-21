# bertml

High-level non-blocking Deno bindings to the
[`rust-bert` machine learning crate](https://crates.io/crates/rust-bert).

## Guide

### Introduction

The `ModelManager` class manages the FFI bindings and all of your models that
connect to the bindings. You create models from the manager and then use the
methods on those classes. The creation of a `ModelManager` is synchronous as the
loading of binaries with the Deno FFI API is synchronous. Therefore, make sure
you create your `ModelManager` before asynchronous logic begins to not cause any
unexpected behavior.

```ts
const manager = await ModelManager.create();
```

## Creating Models

To create models, simply call the corresponding `create*Model` method on the
`ModelManager` class and store the model as a variable. For this example, we'll
be creating a question answering model:

```ts
const manager = await ModelManager.create();

const qaModel = await manager.createQAModel();

const answers = await qaModel.query({
  questionGroups: [
    {
      context: "Amy lives in Canada.",
      question: "Where does Amy live?",
    },
  ],
});

console.log(answers);
```

Output:

```
[ [ { score: 0.985611081123352, start: 13, end: 19, answer: "Canada" } ] ]
```

If you need to learn more about creating instances of models, then simply check
out the docs.

### Supported Pipelines

> Note: we do not currently support any model-level configuration except for the
> different languages for the `TranslationModel`.

- `SummarizationModel`
- `ConversationModel`
- `TranslationModel`
- `NERModel`
- `QAModel`
- `SentimentModel`
- `POSModel`
- `ZeroShotClassificationModel`
- `TextGenerationModel`

To test out these pipelines, you can try and run the `dev.ts` file. However,
this will automatically install the necessary models so I advise you comment out
the models you don't want to download.

### [`rust-bert` citations](https://github.com/guillaume-be/rust-bert#citation)

```
@inproceedings{becquin-2020-end,
    title = "End-to-end {NLP} Pipelines in Rust",
    author = "Becquin, Guillaume",
    booktitle = "Proceedings of Second Workshop for NLP Open Source Software (NLP-OSS)",
    year = "2020",
    publisher = "Association for Computational Linguistics",
    url = "https://www.aclweb.org/anthology/2020.nlposs-1.4",
    pages = "20--25",
}
```

### Acknowledgements

`rust-bert` loads the models from [Hugging Face](https://huggingface.co/) and
`bertml` also has a huge thanks to [Hugging Face](https://huggingface.co/) for
making these models public and interfaceable with Rust (+ Deno).

### License

[MIT](./LICENSE)
