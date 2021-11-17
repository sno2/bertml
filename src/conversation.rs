use crate::{
    exec, model_resource_accessors, model_resources, models, set_result, Model, ModelResource,
    ModelResourceAccessor,
};
use anyhow::Context;
use rust_bert::pipelines::conversation::{ConversationManager, ConversationModel};

#[no_mangle]
extern "C" fn create_conversation_model() -> isize {
    exec(|| {
        let model = ConversationModel::new(Default::default())?;
        models::allocate(Model::ConversationModel(model))
            .context("Failed to allocate conversation model.")
            .map(|a| a as isize)
    })
}

#[no_mangle]
extern "C" fn create_conversation_manager() -> isize {
    exec(|| {
        let manager = ConversationManager::new();
        model_resources::allocate(ModelResource::ConversationManager(manager))
            .context("Failed to allocate conversation manager.")
            .map(|a| a as isize)
    })
}

#[no_mangle]
extern "C" fn create_conversation(rid: usize) -> isize {
    exec(|| {
        let convo_id = model_resources::with_access(rid, |resource| {
            let conversation_manager = match resource {
                ModelResource::ConversationManager(m) => m,
                _ => {
                    return Err(anyhow::anyhow!(
                        "Expected conversation manager at resource id '{}'.",
                        rid
                    ))
                }
            };
            Ok(conversation_manager.create_empty())
        })?;

        model_resource_accessors::allocate(ModelResourceAccessor::ConversationId(convo_id))
            .map(|a| a as isize)
    })
}

#[no_mangle]
extern "C" fn conversation_send(
    model_rid: usize,
    manager_rid: usize,
    convo_rid: usize,
    text: *const u8,
    text_len: usize,
) -> isize {
    exec(|| {
        let text =
            unsafe { std::str::from_utf8_unchecked(std::slice::from_raw_parts(text, text_len)) };

        model_resource_accessors::with_access(convo_rid, |res| {
            let convo_id = match res {
                ModelResourceAccessor::ConversationId(id) => id,
                _ => {
                    return Err(anyhow::anyhow!(
                        "Expected conversation id at resource id '{}'.",
                        convo_rid
                    ))
                }
            };

            model_resources::with_access(manager_rid, |model| {
                let mut conversation_manager = match model {
                    ModelResource::ConversationManager(d) => d,
                    _ => {
                        return Err(anyhow::anyhow!(
                            "Expected dialogue at resource id '{}'.",
                            manager_rid,
                        ))
                    }
                };

                let convo = conversation_manager
                    .get(convo_id)
                    .context("Failed to conversation.")?;

                convo.add_user_input(text)?;

                drop(convo);

                models::with_access(model_rid, |model| {
                    let model = match model {
                        Model::ConversationModel(m) => m,
                        _ => {
                            return Err(anyhow::anyhow!(
                                "Expected to find conversation model at rid '{}'.",
                                model_rid
                            ))
                        }
                    };

                    let responses = model.generate_responses(&mut conversation_manager);

                    Ok(set_result(
                        String::from(
                            responses
                                .get(convo_id)
                                .context("Failed to get conversation model response.")?
                                .clone(),
                        )
                        .into_bytes(),
                    ) as isize)
                })
            })
        })
    })
}
