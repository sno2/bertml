use crate::{exec, models, set_result, Model};
use anyhow::{anyhow, Context};
use rust_bert::pipelines::question_answering::{self, QaInput, QuestionAnsweringModel};
use serde::{Deserialize, Serialize};

/// Creates a QA model and returns the resource number.
#[no_mangle]
extern "C" fn create_qa_model() -> isize {
    exec(|| {
        let model = QuestionAnsweringModel::new(Default::default())
            .context("Failed to create question answering model.")?;

        models::allocate(Model::QuestionAnsweringModel(model)).map(|rid| rid as isize)
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JSQaInput {
    pub question: String,
    pub context: String,
}

impl From<QaInput> for JSQaInput {
    fn from(i: QaInput) -> Self {
        Self {
            context: i.context,
            question: i.question,
        }
    }
}

impl From<JSQaInput> for QaInput {
    fn from(i: JSQaInput) -> Self {
        Self {
            context: i.context,
            question: i.question,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JsQaAnswer {
    score: f64,
    start: usize,
    end: usize,
    answer: String,
}

impl From<question_answering::Answer> for JsQaAnswer {
    fn from(a: question_answering::Answer) -> JsQaAnswer {
        Self {
            score: a.score,
            start: a.start,
            end: a.end,
            answer: a.answer,
        }
    }
}

#[no_mangle]
extern "C" fn qa_query(
    rid: usize,
    inputs: *const u8,
    inputs_len: usize,
    answers_len: usize,
    batch_size: usize,
) -> isize {
    exec(|| {
        let inputs = unsafe { std::slice::from_raw_parts(inputs, inputs_len) };
        let inputs: Vec<JSQaInput> = serde_json::from_slice(inputs)
            .context("Failed to parse question answering model inputs.")?;
        let inputs = inputs
            .into_iter()
            .map(|i| QaInput::from(i))
            .collect::<Vec<_>>();

        let answers = models::with_access(rid, move |model| {
            let model = match model {
                Model::QuestionAnsweringModel(model) => model,
                _ => {
                    return Err(anyhow!(
                        "Expected question answering model at resource id {}.",
                        rid
                    ))
                }
            };

            let res = model.predict(&inputs, answers_len as i64, batch_size);

            Ok(res)
        })??;

        let js_answers: Vec<Vec<JsQaAnswer>> = answers
            .into_iter()
            .map(|answers| answers.into_iter().map(|a| a.into()).collect())
            .collect();

        let serialized = serde_json::to_vec(&js_answers).context("Failed to serialize answers.")?;

        Ok(set_result(serialized) as isize)
    })
}
