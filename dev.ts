import { Language, ModelManager } from "./mod.ts";

const SECTION = (name: string) => console.log(`\n${name}\n`);

const manager = new ModelManager();

const convoModel = await manager.createConversationModel();

const convoManager = await convoModel.createConversationManager();

const convo = await convoManager.createConversation();

SECTION("CONVERSATION MODEL");

const message1 = "Hello, what is your favorite color?";
console.log(`> ${message1}`);
console.log(`< ${await convo.sendMessage(message1)}`);

console.log();

const message2 = "Cool, why is that?"; // watch it actually continues the conversation
console.log(`> ${message2}`);
console.log(`< ${await convo.sendMessage(message2)}`);

SECTION("NER MODEL");

const nerModel = await manager.createNERModel();
const [entity] = await nerModel.predict(["My name is Amy. I live in Paris."]);
console.log(entity);

SECTION("SENTIMENT MODEL");

const sentimentModel = await manager.createSentimentModel();
const sentiments = await sentimentModel.predict([
  "I just love her blue hat.",
  "They should burn in the depths of hell.",
]);
console.log(sentiments);

SECTION("QA MODEL");

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

SECTION("TRANSLATION MODEL");

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
