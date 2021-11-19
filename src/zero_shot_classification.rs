use crate::{exec, models, Model};
use anyhow::Context;
use rust_bert::pipelines::zero_shot_classification::ZeroShotClassificationModel;
use serde::Deserialize;

#[no_mangle]
pub extern "C" fn create_zero_shot_model() -> isize {
    exec(|| {
        let model = ZeroShotClassificationModel::new(Default::default())
            .context("Failed to create zero shot classification model.")?;

        models::allocate(Model::ZeroShotClassificationModel(model)).map(|a| a as isize)
    })
}

#[derive(Deserialize)]
pub struct ZeroShotInput {}

#[no_mangle]
pub extern "C" fn zero_shot_predict(rid: usize, buf: *const u8, buf_len: usize) -> isize {
    exec(|| {
        let inputs: Vec<String> =
            serde_json::from_slice(unsafe { std::slice::from_raw_parts(buf, buf_len) })
                .context("Failed to parse zero shot input.")?;

        Ok(0)
    })
}
