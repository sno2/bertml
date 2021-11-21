import { ModelManager } from "../mod.ts";

const sleep = (t: number): Promise<void> =>
  new Promise((resolve) => setTimeout(() => resolve(), t));

const manager = await ModelManager.create();

console.log("Loading conversation model...");

const convoModel = await manager.createConversationModel();

console.log("Creating conversation...");

const convoManager = await convoModel.createConversationManager();
const convo = await convoManager.createConversation();

await sleep(500);

console.log("Chat started! Type 'exit' to exit.");

while (1) {
  await sleep(1000);

  const response = prompt("\n >");

  if (response === null) {
    throw new Error("Expected user response.");
  }

  if (response.trim() === "exit" || response.trim() === "'exit'" /* lol */) {
    break;
  }

  await sleep(500);

  console.log(` < ${await convo.sendMessage(response)}`);
}

console.log("\nAlright, bye! Thanks for chatting!");
