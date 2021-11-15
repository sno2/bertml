import { Language, ModelManager } from "./mod.ts";

const manager = new ModelManager();

// ==== NER MODEL ==== //

const nerModel = await manager.createNERModel();
const [entity] = await nerModel.predict(["My name is Amy. I live in Paris."]);
console.log(entity);

// ==== SENTIMENT MODEL ==== //

const sentimentModel = await manager.createSentimentModel();
const [sentiment] = await sentimentModel.predict([
  "The dog vaulted over the lake.",
]);
console.log(sentiment);

// ==== QA MODEL ===== //

const qaModel = await manager.createQAModel();

const [answer] = await qaModel.query({
  questionGroups: [
    {
      context: "My best friend's name is tejas and they are cool.",
      question: "Who is your best friend?",
    },
  ],
});

console.log(answer);

// ==== TRANSLATION MODEL ==== //

const translationModel = await manager.createTranslationModel({
  sourceLanguages: [Language.English],
  targetLanguages: [Language.German],
});

const [translated] = await translationModel.translate({
  inputs: ["Hello everyone! My name is Jon and I am 22 years old."],
  sourceLanguage: Language.English,
  targetLanguage: Language.German,
});

console.log(translated);
