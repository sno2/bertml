import { Language, ModelManager } from "./mod.ts";

const SECTION = (name: string) => console.log(`\n${name}\n`);

const manager = new ModelManager();

SECTION("SUMMARIZATION MODEL");

const summarizationModel = await manager.createSummarizationModel();

const longInput = `In findings published Tuesday in Cornell University's arXiv by a team of scientists from the University of Montreal and a separate report published Wednesday in Nature Astronomy by a team from University College London (UCL), the presence of water vapour was confirmed in the atmosphere of K2-18b, a planet circling a star in the constellation Leo. This is the first such discovery in a planet in its star's habitable zone — not too hot and not too cold for liquid water to exist. The Montreal team, led by Björn Benneke, used data from the NASA's Hubble telescope to assess changes in the light coming from K2-18b's star as the planet passed between it and Earth. They found that certain wavelengths of light, which are usually absorbed by water, weakened when the planet was in the way, indicating not only does K2-18b have an atmosphere, but the atmosphere contains water in vapour form. The team from UCL then analyzed the Montreal team's data using their own software and confirmed their conclusion. This was not the first time scientists have found signs of water on an exoplanet, but previous discoveries were made on planets with high temperatures or other pronounced differences from Earth. "This is the first potentially habitable planet where the temperature is right and where we now know there is water," said UCL astronomer Angelos Tsiaras. "It's the best candidate for habitability right now." "It's a good sign", said Ryan Cloutier of the Harvard–Smithsonian Center for Astrophysics, who was not one of either study's authors. "Overall," he continued, "the presence of water in its atmosphere certainly improves the prospect of K2-18b being a potentially habitable planet, but further observations will be required to say for sure. K2-18b was first identified in 2015 by the Kepler space telescope. It is about 110 light-years from Earth and larger but less dense. Its star, a red dwarf, is cooler than the Sun, but the planet's orbit is much closer, such that a year on K2-18b lasts 33 Earth days. According to The Guardian, astronomers were optimistic that NASA's James Webb space telescope — scheduled for launch in 2021 — and the European Space Agency's 2028 ARIEL program, could reveal more about exoplanets like K2-18b.`;

console.log(await summarizationModel.summarize([longInput]));

SECTION("TEXT GENERATION MODEL");

const textGenerationModel = await manager.createTextGenerationModel();

console.log(
  await textGenerationModel.generate({
    inputs: ["The black hole is a wonder of space."],
  })
);

SECTION("ZERO SHOT CLASSIFICATION MODEL");

const zeroShotModel = await manager.createZeroShotClassificationModel();

const zeroShotInput = {
  inputs: [
    "Who are you voting for in 2024?",
    "10,000 people have died from covid-19.",
  ],
  labels: ["politics", "public health"],
};

console.log(await zeroShotModel.predict(zeroShotInput));
console.log(await zeroShotModel.predictMultilabel(zeroShotInput));

SECTION("POS TAGGING MODEL");

const posModel = await manager.createPOSModel();

console.log(await posModel.predict(["What are the parts in this?"]));

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
