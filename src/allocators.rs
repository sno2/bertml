use crate::create_allocator;
use rust_bert::pipelines::{ner, question_answering, sentiment, translation};

pub enum Model {
    TranslationModel(translation::TranslationModel),
    QuestionAnsweringModel(question_answering::QuestionAnsweringModel),
    NERModel(ner::NERModel),
    SentimentModel(sentiment::SentimentModel),
}

impl Model {
    pub fn name(&self) -> &str {
        match self {
            Self::TranslationModel(_) => "TranslationModel",
            Self::QuestionAnsweringModel(_) => "QuestionAnsweringModel",
            Self::NERModel(_) => "NERModel",
            Self::SentimentModel(_) => "SentimentModel",
        }
    }
}

create_allocator! { pub alloc models for super::Model }

mod macros {
    #[macro_export]
    macro_rules! create_allocator {
    ($vis: vis alloc $namespace: ident for $itm: ty) => {
        $vis mod $namespace {
            use once_cell::sync::Lazy;
            use std::collections::HashMap;
            use std::sync::Mutex;
            use anyhow::Context;

            pub static ALLOCATOR: Lazy<Mutex<HashMap<usize, $itm>>> =
                Lazy::new(|| Mutex::new(HashMap::new()));
            pub static COUNTER: Lazy<Mutex<usize>> = Lazy::new(|| Mutex::new(0));

            pub fn allocate(itm: $itm) -> Result<usize, anyhow::Error> {
                let mut counter = COUNTER.lock().unwrap();
                let mut allocator = ALLOCATOR.lock().unwrap();
                let rid = *counter;
                allocator.insert(rid, itm);
                *counter += 1;
                Ok(rid)
            }

            pub fn deallocate(rid: usize) -> Result<$itm, anyhow::Error> {
                let mut allocator = ALLOCATOR.lock().unwrap();
                allocator.remove(&rid).with_context(|| format!("Failed to deallocate item with resource id of {}.", rid))
            }

            pub fn with_access<T, F>(rid: usize, f: F) -> Result<T, anyhow::Error>
            where
                F: FnOnce(&$itm) -> T,
            {
                let allocator = ALLOCATOR.lock().unwrap();
                match allocator.get(&rid) {
                    Some(guard) => Ok(f(guard)),
                    None => Err(anyhow::anyhow!("Failed to get resource with id.")),
                }
            }
        }
    };
}
}
