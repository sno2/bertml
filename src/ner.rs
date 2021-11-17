use crate::{exec, models, set_result, Model};
use anyhow::Context;
use rust_bert::pipelines::ner::{self, NERModel};
use serde::{Deserialize, Serialize};

#[no_mangle]
extern "C" fn create_ner_model() -> isize {
    exec(|| {
        let model = NERModel::new(Default::default()).context("Failed to create NER model.")?;

        models::allocate(Model::NERModel(model)).map(|rid| rid as isize)
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NEREntity {
    word: String,
    score: f64,
    label: String,
}

impl From<ner::Entity> for NEREntity {
    fn from(e: ner::Entity) -> NEREntity {
        Self {
            word: e.word,
            score: e.score,
            label: e.label,
        }
    }
}

#[no_mangle]
extern "C" fn ner_predict(rid: usize, input: *const u8, input_len: usize) -> isize {
    exec(|| {
        let input = unsafe { std::slice::from_raw_parts(input, input_len) };
        let input: Vec<String> =
            serde_json::from_slice(input).context("Failed to parse NER model input.")?;

        let entities = models::with_access(rid, move |model| {
            let model = match model {
                Model::NERModel(m) => m,
                _ => {
                    return Err(anyhow::anyhow!(
                        "Expected NER Model at resource id {}.",
                        rid
                    ))
                }
            };

            Ok(model.predict(&input))
        })?;

        let entities: Vec<Vec<NEREntity>> = entities
            .into_iter()
            .map(|v| v.into_iter().map(|e| e.into()).collect())
            .collect();

        let entities = serde_json::to_vec(&entities)
            .context("Failed to serialize entities response from NER model.")?;

        Ok(set_result(entities) as isize)
    })
}
