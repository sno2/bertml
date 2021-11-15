use crate::{exec, models, set_result, Model};
use anyhow::Context;
use rust_bert::pipelines::translation::{self, TranslationModelBuilder};
use serde::Deserialize;

macro_rules! copy_enum {
   (enum $A: ident union for $B: ty { $($Variant: ident),* }) => {
        #[repr(u8)]
        #[derive(Debug)]
        pub enum $A {
            $($Variant),*
        }

        impl $A {
            fn from(a: $A) -> $B {
                match a {
                    $(<$A>::$Variant => <$B>::$Variant),*
                }
            }

            fn from_u8(n: u8) -> Self {
                unsafe { std::mem::transmute::<u8, Self>(n) }
            }
        }
    }
}

copy_enum! {
    enum Language union for rust_bert::pipelines::translation::Language {
        Afrikaans,
        Danish,
        Dutch,
        German,
        English,
        Icelandic,
        Luxembourgish,
        Norwegian,
        Swedish,
        WesternFrisian,
        Yiddish,
        Asturian,
        Catalan,
        French,
        Galician,
        Italian,
        Occitan,
        Portuguese,
        Romanian,
        Spanish,
        Belarusian,
        Bosnian,
        Bulgarian,
        Croatian,
        Czech,
        Macedonian,
        Polish,
        Russian,
        Serbian,
        Slovak,
        Slovenian,
        Ukrainian,
        Estonian,
        Finnish,
        Hungarian,
        Latvian,
        Lithuanian,
        Albanian,
        Armenian,
        Georgian,
        Greek,
        Breton,
        Irish,
        ScottishGaelic,
        Welsh,
        Azerbaijani,
        Bashkir,
        Kazakh,
        Turkish,
        Uzbek,
        Japanese,
        Korean,
        Vietnamese,
        ChineseMandarin,
        Bengali,
        Gujarati,
        Hindi,
        Kannada,
        Marathi,
        Nepali,
        Oriya,
        Panjabi,
        Sindhi,
        Sinhala,
        Urdu,
        Tamil,
        Cebuano,
        Iloko,
        Indonesian,
        Javanese,
        Malagasy,
        Malay,
        Malayalam,
        Sundanese,
        Tagalog,
        Burmese,
        CentralKhmer,
        Lao,
        Thai,
        Mongolian,
        Arabic,
        Hebrew,
        Pashto,
        Farsi,
        Amharic,
        Fulah,
        Hausa,
        Igbo,
        Lingala,
        Luganda,
        NorthernSotho,
        Somali,
        Swahili,
        Swati,
        Tswana,
        Wolof,
        Xhosa,
        Yoruba,
        Zulu,
        HaitianCreole
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TranslationModelInit {
    source_languages: Vec<u8>,
    target_languages: Vec<u8>,
}

#[no_mangle]
extern "C" fn create_translation_model(init: *const u8, init_len: usize) -> isize {
    exec(|| {
        let init = unsafe { std::slice::from_raw_parts(init, init_len) };
        let TranslationModelInit {
            source_languages,
            target_languages,
        } = serde_json::from_slice(init).context("Failed to parse translation model config.")?;
        let source_languages: Vec<translation::Language> = source_languages
            .into_iter()
            .map(|l| Language::from(Language::from_u8(l)))
            .collect::<Vec<_>>();
        let target_languages: Vec<translation::Language> = target_languages
            .into_iter()
            .map(|l| Language::from(Language::from_u8(l)))
            .collect::<Vec<_>>();
        let model = TranslationModelBuilder::new()
            .with_source_languages(source_languages)
            .with_target_languages(target_languages)
            .create_model()
            .context("Failed to create model.")?;
        models::allocate(Model::TranslationModel(model)).map(|a| a as isize)
    })
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TranslationInit {
    inputs: Vec<String>,
    source_language: u8,
    target_language: u8,
}

#[no_mangle]
extern "C" fn translation_translate(rid: usize, init: *const u8, init_len: usize) -> isize {
    exec(|| {
        let TranslationInit {
            inputs,
            source_language,
            target_language,
        } = serde_json::from_slice(unsafe { std::slice::from_raw_parts(init, init_len) })
            .context("Failed to parse translation model init.")?;

        let source_language = Language::from(Language::from_u8(source_language));
        let target_language = Language::from(Language::from_u8(target_language));

        let res = models::with_access(rid, |model| {
            let model = match model {
                Model::TranslationModel(m) => m,
                _ => {
                    return Err(anyhow::anyhow!(
                        "Expected to find translation model at resource id '{}'",
                        rid
                    ))
                }
            };

            model
                .translate(&inputs, source_language, target_language)
                .context("Failed to translate.")
        })
        .context("Failed to access translation model.")??;

        Ok(
            set_result(serde_json::to_vec(&res).context("Failed to serialize translation data.")?)
                as isize,
        )
    })
}
