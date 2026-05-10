import { Interjection } from "src/utility/interjection.js";

const JINX_WINDOW = 3000;

const Jinx = new Interjection({
  name: "jinx",
  test: async (ctx) => {
    if (!ctx.channel) return;

    const previousMessages = await ctx.channel.messages.fetch({limit:2});
    const lastMessage = previousMessages.last();

    if (lastMessage === undefined) return;

    //the required tests
    const jinxCreatedCloseTogether = Math.abs(lastMessage.createdTimestamp - ctx.message.createdTimestamp) <= JINX_WINDOW;
    const contentIsIdentical = lastMessage.content === ctx.message.content;
    const jinxFromDifferentPeople = lastMessage.author.id !== ctx.message.author.id;

    //only pass if all true
    if (jinxCreatedCloseTogether && contentIsIdentical && jinxFromDifferentPeople) {
      await ctx.send(lastMessage.content);
    }
  }
});

export default Jinx;