import { Interjection } from "@src/utility/interjection.js";
import { fetchConfigOption } from "@src/utility/utility.js";

const JINX_WINDOW = 3000;

interface JinxMessage {
  content: string,
  timestamp: number,
  authorId: string,
}

const jinxData: Record<string, JinxMessage> = {};

const Jinx = new Interjection({
  name: "jinx",
  test: async (ctx) => {
    if (!ctx.channel) return false;
    if (ctx.guild) {
      const jinxSetting = fetchConfigOption(ctx.db, "server", "jinxes", ctx.guild.id);
      if (!jinxSetting) return false;
    }

    const lastData = jinxData[ctx.channel.id] as JinxMessage | undefined;

    jinxData[ctx.channel.id] = {
      content: ctx.message.content,
      timestamp: ctx.message.createdTimestamp,
      authorId: ctx.user.id,
    };

    if (lastData === undefined) return false;

    //only pass if all true
    if (
      Math.abs(lastData.timestamp - ctx.message.createdTimestamp) <= JINX_WINDOW
      && lastData.content === ctx.message.content 
      && lastData.authorId !== ctx.user.id
    ) {
      await ctx.send(ctx.message.content);
      return true;
    }

    return false;
  }
});

export default Jinx;