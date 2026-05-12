import { Interjection } from "src/utility/interjection.js";
import { createHash } from "crypto";
import { DatabaseSync } from "node:sqlite";

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
    console.log("tset running");
    if (!ctx.channel) return;
    const channelId = ctx.channel.id;

    const lastData = dbRequest.get({ id: channelId });

    const contentHash = createHash("SHA256").update(ctx.message.content).digest("base64");

    const authorId = ctx.user.id;
    const timestamp = ctx.message.createdTimestamp;

    dbUpdate.run({ 
      id: channelId, 
      data: JSON.stringify({
        contentHash,
        timestamp,
        authorId,
      })
    });

    if (lastData === undefined) return;

    const lastMessage = JSON.parse(lastData.data?.toString() ?? "{}") as jinxMessage;

    //the required tests
    const jinxCreatedCloseTogether = Math.abs(lastMessage.timestamp - ctx.message.createdTimestamp) <= JINX_WINDOW;
    const contentIsIdentical = lastMessage.contentHash === contentHash;
    const jinxFromDifferentPeople = lastMessage.authorId !== authorId;

    //only pass if all true
    if (jinxCreatedCloseTogether && contentIsIdentical && jinxFromDifferentPeople) {
      await ctx.send(ctx.message.content);
    }
  }
});

export default Jinx;