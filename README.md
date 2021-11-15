# bertml

High-level non-blocking Deno bindings to the
[`rust-bert` machine learning crate](https://crates.io/crates/rust-bert).

## Guide

### Introduction

The `ModelManager` class manages the FFI bindings and all of your models that
connect to the bindings. You create models from the manager and then use the
methods on those classes.

### Supported Pipelines

> Note: we do not currently support any model-level configuration except for the different languages for the `TranslationModel`.

- `TranslationModel`
- `NERModel`
- `QAModel`
- `SentimentModel`

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

MIT
