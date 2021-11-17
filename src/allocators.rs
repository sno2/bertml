use crate::create_allocator;
use rust_bert::pipelines::{conversation, ner, question_answering, sentiment, translation};

pub enum Model {
    TranslationModel(translation::TranslationModel),
    QuestionAnsweringModel(question_answering::QuestionAnsweringModel),
    NERModel(ner::NERModel),
    SentimentModel(sentiment::SentimentModel),
    ConversationModel(conversation::ConversationModel),
}

pub enum ModelResource {
    ConversationManager(conversation::ConversationManager),
}

/// For models that are required to use a model resource but cannot be a model resource due to
/// locks.
pub enum ModelResourceAccessor {
    ConversationId(uuid::Uuid),
}

create_allocator! { pub alloc models for super::Model }
create_allocator! { pub alloc model_resources for super::ModelResource }
create_allocator! { pub alloc model_resource_accessors for super::ModelResourceAccessor }

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
                F: FnOnce(&mut $itm) -> Result<T, anyhow::Error>,

            {
                let mut allocator = ALLOCATOR.lock().unwrap();
                match allocator.get_mut(&rid) {
                    Some(guard) => f(guard),
                    None => Err(anyhow::anyhow!("Failed to get resource with id.")),
                }
            }
        }
    };
}
}
