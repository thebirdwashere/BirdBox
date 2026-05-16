import { Interjection } from "src/utility/interjection.js";
import lyrics from "src/data/lyrics.json" with { type: "json" };
import { Lyrics } from "src/utility/types.js";
import { fetchConfigOption } from "src/utility/utility.js";
import { Database } from "src/utility/database.js";

const LYRICS = lyrics as Lyrics;

const FILTER_REGEX = /[^a-z\s!?]/g;
const lastWords = LYRICS.flat().map(lyric => lyric.split(" ").at(-1)).filter(lyric => lyric !== undefined);

const Lyrics = new Interjection({
  name: "lyrics",
  test: async (ctx) => {
    if (ctx.guild) {
      const settingValue = await fetchConfigOption(ctx.db, "server", "responses", ctx.guild.id);
      if (!settingValue) return false;
    }

    //filter and get message content for detection
    const content = ctx.message.content
      .toLowerCase()
      .replaceAll(FILTER_REGEX,"")
      .trim();

    if (!content) return false;

    const contentLastWord = content.split(" ").at(-1);
    if (contentLastWord === undefined || !lastWords.includes(contentLastWord)) return false;

    /*/
      * first, previous lyric detection
      * to explain what's going on here, consider the chorus of all-star
      *
      * -> hey now / you're an allstar
      *    get your game on / go play
      * -> hey now / you're a rockstar
      *    get the show on / get paid
      * 
      * notice how the same lyric appears twice?
      * without intervention, someone naively trying to recite the chorus
      * would reset back to the beginning every time "hey now" comes up
      * 
      * this can be fixed by considering the place we are in the song
      * here, before anything else, we're looking at the previous message
      * to determine our place
      * 
      * to demonstrate, all-star:
      * you: get your game on
      * birdbox: go play
      * you: hey now
      * 
      * birdbox checks the recorded previous lyric
      * and sees that this one comes right after it
      * so it correctly follows up with "you're a rockstar"
      * 
      * ok agentnebulator yapfest over
      * this comes to you from a vc on august 11th 2024, bisly and kek are in the back
      * listening to kirin j callinan's big enough, schlatt's my way, and assorted memes
      * good times all around
    /*/

    if (ctx.channel) {
      const responseLyric = checklyricIndex(ctx.db, ctx.channel.id, content);

      if (responseLyric == false) {
        //end the function completely, if the song was meant to be over
        return false;
      } else if (responseLyric !== undefined) {
        await ctx.reply(responseLyric);
        return true;
      }
    }

    //variables to store while iterating
    let compareLyric = "";
    let decidedLyric = "";
    let newLyricIndices: [number | null, number | null] 
      = [null, null];
    
    //iterate and check
    for (const [i, song] of lyrics.entries()) { 
      for (const [j, lyric] of song.entries()) {
        if (content.endsWith(lyric.replaceAll(FILTER_REGEX,"").trim())) {
          //ensure the chosen lyric is the longest one that fits
          if (lyric.length > compareLyric.length) {
            //set values for future iterations
            compareLyric = song[j];
            decidedLyric = song[j+1];
            newLyricIndices = [i, j+1];
          }
        }
      }
    }

    //update database with indices, or undefined if no indices exist
    if (ctx.channel) {
      ctx.db.channel.update(ctx.channel.id, "lyricIndices", newLyricIndices);
    };

    //send chosen lyric
    if (decidedLyric) {
      await ctx.reply(decidedLyric);
      return true;
    }

    return false;
  }
});

function checklyricIndex(db: Database, id: string, content: string): string | undefined | false {
  const lastLyricIndices = db.channel.fetchOrUndefined(id, "lyricIndices");

  //type guard for typescript's sake
  if (!Array.isArray(lastLyricIndices) || lastLyricIndices.length !== 2 || lastLyricIndices[0] == null) return;

  const songIndex = lastLyricIndices[0] as number;
  const lyricIndex = lastLyricIndices[1] as number;
  const lastLyric = LYRICS[songIndex]?.[lyricIndex] as string | undefined;
  const nextLyric = LYRICS[songIndex]?.[lyricIndex+1] as string | undefined;

  if (lastLyric == null || nextLyric == null) return undefined;

  //if this message matches what should come next...
  if (nextLyric.replaceAll(FILTER_REGEX,"").trim() === content) {
    //return the lyric after, if it exists
    const responseLyric = LYRICS[songIndex]?.[lyricIndex+2] as string | undefined;

    if (responseLyric == null) {
      db.channel.update(id, "lyricIndices", [null, null]);
      return false;
    } else {
      db.channel.update(id, "lyricIndices", [songIndex, lyricIndex+2]);
      return responseLyric;
    }
  }

  return undefined;
}

export default Lyrics;