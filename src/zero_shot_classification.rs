use crate::{exec, models, set_result, Model};
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
#[serde(rename_all = "camelCase")]
pub struct ZeroShotInput {
    inputs: Vec<String>,
    labels: Vec<String>,
    max_length: usize,
}

#[no_mangle]
pub extern "C" fn zero_shot_predict(rid: usize, buf: *const u8, buf_len: usize) -> isize {
    exec(|| {
        let buf = unsafe { std::slice::from_raw_parts(buf, buf_len) };
        let input: ZeroShotInput =
            serde_json::from_slice(buf).context("Failed to deserialize zero shot model config.")?;

        let labels = models::with_access(rid, |model| {
            let model = match model {
                Model::ZeroShotClassificationModel(m) => m,
                _ => {
                    return Err(anyhow::anyhow!(
                        "Expected zero shot classification model at rid '{}'.",
                        rid
                    ))
                }
            };
            let inputs = &input.inputs.iter().map(|a| a.as_str()).collect::<Vec<_>>();
            let labels = &input.labels.iter().map(|a| a.as_str()).collect::<Vec<_>>();
            Ok(model.predict(inputs, labels, None, input.max_length))
        })?;
        Ok(
            set_result(
                serde_json::to_vec(&labels).context("Failed to serialize zero shot output.")?,
            ) as isize,
        )
    })
}

#[no_mangle]
pub extern "C" fn zero_shot_predict_multilabel(
    rid: usize,
    buf: *const u8,
    buf_len: usize,
) -> isize {
    exec(|| {
        let input: ZeroShotInput =
            serde_json::from_slice(unsafe { std::slice::from_raw_parts(buf, buf_len) })
                .context("Failed to deserialize zero shot model multilabel config.")?;

        let label_groups = models::with_access(rid, |model| {
            let model = match model {
                Model::ZeroShotClassificationModel(m) => m,
                _ => {
                    return Err(anyhow::anyhow!(
                        "Expected zero shot classification model at rid '{}'.",
                        rid
                    ))
                }
            };

            let inputs = &input.inputs.iter().map(|a| a.as_str()).collect::<Vec<_>>();

            let labels = &input.labels.iter().map(|a| a.as_str()).collect::<Vec<_>>();

            Ok(model.predict_multilabel(inputs, labels, None, input.max_length))
        })?;

        Ok(set_result(
            serde_json::to_vec(&label_groups)
                .context("Failed to serialize zero shot label groups output.")?,
        ) as isize)
    })
}
