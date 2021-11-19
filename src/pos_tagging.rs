use crate::{exec, models, set_result, Model};
use anyhow::Context;
use rust_bert::pipelines::pos_tagging::POSModel;

#[no_mangle]
pub extern "C" fn create_pos_model() -> isize {
    exec(|| {
        let model = POSModel::new(Default::default())
            .context("Failed to load Parts of Speech Tagging model.")?;

        models::allocate(Model::POSModel(model)).map(|a| a as isize)
    })
}

#[no_mangle]
pub extern "C" fn pos_predict(rid: usize, buf: *const u8, buf_len: usize) -> isize {
    exec(|| {
        let inputs: Vec<String> =
            serde_json::from_slice(unsafe { std::slice::from_raw_parts(buf, buf_len) })?;

        models::with_access(rid, |model| {
            let model = match model {
                Model::POSModel(m) => m,
                _ => return Err(anyhow::anyhow!("Expected POS Model at rid '{}'.", rid)),
            };

            let outputs = model.predict(&inputs);
            let outputs = serde_json::to_vec(&outputs).context("Failed to serialize POS tags.")?;
            Ok(set_result(outputs) as isize)
        })
    })
}
