import { ModelManager } from "../mod.ts";

const manager = await ModelManager.create();

const convoModel = await manager.createConversationModel();
const convoManager = await convoModel.createConversationManager();
const convo1 = await convoManager.createConversation();
const convo2 = await convoManager.createConversation();

const [initialText] = Deno.args;

if (initialText === undefined) {
  throw new Error("Expected initial text as first argument.");
}

console.log(`> ${initialText}`);
const responses: [string, string] = [undefined!, initialText];

while (1) {
  responses[0] = await convo2.sendMessage(responses[1]);
  console.log(`< ${responses[0]}\n`);
  responses[1] = await convo1.sendMessage(responses[0]);
  console.log(`> ${responses[1]}`);
}
