use crate::{exec, models, set_result, Model};
use anyhow::Context;
use rust_bert::pipelines::summarization::SummarizationModel;

#[no_mangle]
pub extern "C" fn create_summarization_model() -> isize {
    exec(|| {
        let model = SummarizationModel::new(Default::default())
            .context("Failed to create summarization model.")?;

        models::allocate(Model::SummarizationModel(model)).map(|a| a as isize)
    })
}

#[no_mangle]
pub extern "C" fn summarization_summarize(rid: usize, buf: *const u8, buf_len: usize) -> isize {
    exec(|| {
        let inputs: Vec<String> =
            serde_json::from_slice(unsafe { std::slice::from_raw_parts(buf, buf_len) })
                .context("Failed to deserialize summarization input.")?;

        let outputs = models::with_access(rid, |model| {
            let model = match model {
                Model::SummarizationModel(m) => m,
                _ => {
                    return Err(anyhow::anyhow!(
                        "Expected to find summarization model at rid '{}'.",
                        rid
                    ))
                }
            };

            Ok(model.summarize(&inputs))
        })?;

        Ok(set_result(
            serde_json::to_vec(&outputs)
                .context("Failed to serialize summarization model output.")?,
        ) as isize)
    })
}
