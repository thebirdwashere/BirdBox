import { Interjection } from "src/utility/interjection.js";
import { createHash } from "crypto";
import { DatabaseSync } from "node:sqlite";
import { fetchConfigOption } from "src/utility/utility.js";

const JINX_WINDOW = 3000;

interface jinxMessage {
  contentHash: string,
  timestamp: number,
  authorId: string,
}

const db = new DatabaseSync(":memory:");
db.exec(`
  CREATE TABLE IF NOT EXISTS JinxData(
    channel_id TEXT PRIMARY KEY NOT NULL,
    data TEXT DEFAULT '{}'
  )
`);

const dbRequest = db.prepare(`
  SELECT data 
  FROM JinxData
  WHERE (channel_id == @id)
  LIMIT 1
`);

const dbUpdate = db.prepare(`
  INSERT INTO JinxData (channel_id, data)
  VALUES (@id, @data)
  ON CONFLICT(channel_id) DO 
  UPDATE SET data=excluded.data
`);

const Jinx = new Interjection({
  name: "jinx",
  test: async (ctx) => {
    if (!ctx.channel) return false;
    if (ctx.guild) {
      const jinxSetting = fetchConfigOption(ctx.db, "server", "jinxes", ctx.guild.id);
      if (!jinxSetting) return false;
    }

    const lastData = dbRequest.get({ id: ctx.channel.id });

    const contentHash = createHash("SHA256").update(ctx.message.content).digest("base64");

    dbUpdate.run({ 
      id: ctx.channel.id, 
      data: JSON.stringify({
        contentHash,
        timestamp: ctx.message.createdTimestamp,
        authorId: ctx.user.id,
      })
    });

    if (lastData === undefined) return false;

    const lastMessage = JSON.parse(lastData.data?.toString() ?? "{}") as jinxMessage;

    //only pass if all true
    if (
      Math.abs(lastMessage.timestamp - ctx.message.createdTimestamp) <= JINX_WINDOW
      && lastMessage.contentHash === contentHash 
      && lastMessage.authorId !== ctx.user.id
    ) {
      await ctx.send(ctx.message.content);
      return true;
    }

    return false;
  }
});

export default Jinx;