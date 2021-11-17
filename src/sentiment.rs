use crate::{exec, models, set_result, Model};
use anyhow::Context;
use rust_bert::pipelines::sentiment::{self, SentimentModel};
use serde::{Deserialize, Serialize};

#[no_mangle]
extern "C" fn create_sentiment_model() -> isize {
    exec(|| {
        let model =
            SentimentModel::new(Default::default()).context("Failed to load sentiment model.")?;
        models::allocate(Model::SentimentModel(model)).map(|rid| rid as isize)
    })
}

#[derive(Serialize, Deserialize)]
pub struct JSSentiment {
    polarity: u8,
    score: f64,
}

impl From<sentiment::Sentiment> for JSSentiment {
    fn from(s: sentiment::Sentiment) -> Self {
        Self {
            polarity: match s.polarity {
                sentiment::SentimentPolarity::Negative => 0,
                _ => 1,
            },
            score: s.score,
        }
    }
}

#[no_mangle]
extern "C" fn sentiment_predict(rid: usize, input: *const u8, input_len: usize) -> isize {
    exec(|| {
        let input: Vec<&str> =
            serde_json::from_slice(unsafe { std::slice::from_raw_parts(input, input_len) })
                .context("Failed to parse sentiment model input.")?;
        let sentiments = models::with_access(rid, move |model| {
            let model = match model {
                Model::SentimentModel(m) => m,
                _ => {
                    return Err(anyhow::anyhow!(
                        "Expected Sentiment Model at resource id {}.",
                        rid
                    ))
                }
            };

            Ok(model.predict(input.as_slice()))
        })?;

        let sentiments: Vec<JSSentiment> = sentiments.into_iter().map(|s| s.into()).collect();
        let json =
            serde_json::to_vec(&sentiments).context("Failed to serialize sentiment model data.")?;

        Ok(set_result(json) as isize)
    })
}
