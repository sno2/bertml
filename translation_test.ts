import { Language, ModelManager } from "./mod.ts";

async function _typeCheckOnly() {
  const manager = new ModelManager();

  const translationModel = await manager.createTranslationModel({
    sourceLanguages: [Language.English, Language.German],
    targetLanguages: [Language.German],
  });

  translationModel.translate({
    inputs: ["hello, world!"],
    // @ts-expect-error this should fail
    sourceLanguage: Language.Amharic,
    // @ts-expect-error this should fail
    targetLanguage: Language.English,
  });

  translationModel.translate({
    inputs: ["hello, world!"],
    sourceLanguage: Language.English,
    targetLanguage: Language.German,
  });
}
