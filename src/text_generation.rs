use crate::{exec, models, set_result, Model};
use anyhow::Context;
use rust_bert::pipelines::text_generation::TextGenerationModel;
use serde::Deserialize;

#[no_mangle]
pub extern "C" fn create_text_generation_model() -> isize {
    exec(|| {
        let model = TextGenerationModel::new(Default::default())
            .context("Failed to create text generation model.")?;

        models::allocate(Model::TextGenerationModel(model)).map(|a| a as isize)
    })
}

#[derive(Deserialize)]
pub struct TextGenerationInit {
    inputs: Vec<String>,
    prefix: Option<String>,
}

#[no_mangle]
pub extern "C" fn text_generation_generate(rid: usize, buf: *const u8, buf_len: usize) -> isize {
    exec(|| {
        let init: TextGenerationInit =
            serde_json::from_slice(unsafe { std::slice::from_raw_parts(buf, buf_len) })
                .context("Failed to parse text generation model init.")?;

        models::with_access(rid, |model| {
            let model = match model {
                Model::TextGenerationModel(m) => m,
                _ => {
                    return Err(anyhow::anyhow!(
                        "Expected text generation model at rid '{}'.",
                        rid
                    ))
                }
            };
            let data = model.generate(&init.inputs, init.prefix.as_deref());

            Ok(set_result(
                serde_json::to_vec(&data).context("Failed to serialize text generation data.")?,
            ) as isize)
        })
    })
}
