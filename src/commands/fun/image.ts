import "dotenv/config";
import { Command, Subcommand, CommandOption } from "@src/utility/command.js";
import { EmbedBuilder, Colors } from "discord.js";

const CAT_LINK = "api.thecatapi.com";
const DOG_LINK = "api.thedogapi.com";

const CAT_API_KEY = process.env.CAT_API_KEY;
const DOG_API_KEY = process.env.DOG_API_KEY;

if (CAT_API_KEY === undefined)
  console.log("Warning: API key to thecatapi.com is not present. The image command will not work without this key, but other commands should function as normal.");
if (DOG_API_KEY === undefined)
  console.log("Warning: API key to thedogapi.com is not present. The image command will not work without this key, but other commands should function as normal.");

const Image = new Command({
  name: "image",
  description: "Enjoy some images handpicked (randomly) by BirdBox.",
  subcommands: [
    new Subcommand({
      name: "cat",
      description: "Picks a random cat from TheCatAPI.",
      options: [
        new CommandOption({ //MARK: image cat
          name: "type",
          description: "Which result format you want. Must be one of \"image\" or \"gif\".",
          type: "string",
          optional: true,
          choices: ["image", "gif"]
        }),
        new CommandOption({
          name: "breed",
          description: "Which breed you want images of. If not specified, will choose from all available breeds.",
          type: "string",
          optional: true,
          autocomplete: true,
        }),
      ],
      autocomplete: async (ctx) => {
        if (CAT_API_KEY === undefined) {
          await ctx.respond([]);
          return;
        }

        const petBreeds = await getPetBreeds(CAT_LINK, CAT_API_KEY);
        const formattedBreeds = petBreeds.map(breed => {
          return {
            name: breed.name,
            value: breed.id,
          };
        });

        await ctx.respond(formattedBreeds);
      },
      execute: async (ctx, opts) => {
        if (CAT_API_KEY === undefined)
          throw new Error("API key is not present in `.env`.");

        const imageType = opts.string.get("type") ?? "image";
        const selectedBreed = opts.string.get("breed") ?? null;

        const imageURL = await getPetImage(imageType, selectedBreed, CAT_LINK, CAT_API_KEY);

        const catEmbed = new EmbedBuilder()
          .setTitle("Random Cat")
          .setAuthor({ name: "TheCatAPI", iconURL: "https://i.natgeofe.com/n/eb0f9db1-8b29-4598-ad7e-89716501189f/cat-whisperers-nationalgeographic_1048225_square.jpg" })
          .setColor(Colors.Blue)
          .setImage(imageURL);

        await ctx.reply({ embeds: [catEmbed] });
      }
    }),
    new Subcommand({ //MARK: image dog
      name: "dog",
      description: "Picks a random dog from TheDogAPI.",
      options: [
        new CommandOption({
          name: "type",
          description: "Which result format you want. Must be one of `image` or `gif`.",
          type: "string",
          optional: true,
          choices: ["image", "gif"]
        }),
        new CommandOption({
          name: "breed",
          description: "Which breed you want images of. If not specified, will choose from all available breeds.",
          type: "string",
          optional: true,
          autocomplete: true,
        }),
      ],
      autocomplete: async (ctx) => {
        if (DOG_API_KEY === undefined) {
          await ctx.respond([]);
          return;
        }

        const petBreeds = await getPetBreeds(DOG_LINK, DOG_API_KEY);
        const formattedBreeds = petBreeds.map(breed => {
          return {
            name: breed.name,
            value: breed.id,
          };
        });

        await ctx.respond(formattedBreeds);
      },
      execute: async (ctx, opts) => {
        if (DOG_API_KEY === undefined)
          throw new Error("API key is not present in `.env`.");

        const imageType = opts.string.get("type") ?? "image";
        const selectedBreed = opts.string.get("breed") ?? null;

        const imageURL = await getPetImage(imageType, selectedBreed, DOG_LINK, DOG_API_KEY);

        const dogEmbed = new EmbedBuilder()
          .setTitle("Random Dog")
          .setAuthor({ name: "TheDogAPI", iconURL: "https://i.natgeofe.com/n/225bafe4-88e7-4f91-ad60-7ff43277ec4b/Conan2_square.jpg" })
          .setColor(Colors.Blue)
          .setImage(imageURL);

        await ctx.reply({ embeds: [dogEmbed] });
      },
    })
  ],
});

//MARK: utils
async function getPetImage(type: string, breed: string | null, link: string, key: string): Promise<string> {
  let fetchString = `https://${link}/v1/images/search?mime_types=${type}`;

  if (breed !== null) {
    const petBreeds = await getPetBreeds(link, key);

    //console.log(JSON.stringify(petBreeds, null, 2));

    const petIds = petBreeds.map(breed => breed.id);
    const petNames = petBreeds.map(breed => breed.name);

    let breedId;
    if (petIds.includes(breed)) {
      breedId = breed;
      fetchString += `&breed_ids=${breedId}`;
    } else if (petNames.includes(breed)) {
      breedId = petIds[petNames.indexOf(breed)];
      fetchString += `&breed_ids=${breedId}`;
    } else {
      throw new Error(`Breed "${breed}" could not be found.`);
    }
  }

  interface PetData {
    url?: string;
  };

  const petFetch: JsonList<PetData> = await fetch(fetchString, {
    headers: {
      "x-api-key": key,
    }
  }) as JsonList<PetData>;
  const petData: PetData[] = await petFetch.json();

  if (petData[0]?.url === undefined) throw new Error(`Could not find ${type} of the requested breed. Try broadening your specifications.`);

  return petData[0].url;
}

async function getPetBreeds(link: string, key: string): Promise<PetBreed[]> {
  const list: JsonList<PetBreed> = await fetch(`https://${link}/v1/breeds`, {
    headers: {
      "x-api-key": key,
    }
  });

  if (!instanceOfJsonList(list))
    throw new Error("Unexpected return from breeds call.");

  const breeds: PetBreed[] = await list.json();

  if ("error" in breeds && "message" in breeds)
    throw new Error(String(breeds.message));

  return breeds;
};
  
interface JsonList<T> {
  json(): Promise<T[]>;
};

function instanceOfJsonList<T>(object: unknown): object is JsonList<T> {
  return (
    typeof object === "object" 
      && object != null 
      && "json" in object 
      && typeof object.json === "function"
  );
}

interface PetBreed {
  id: string;
  name: string;
};

export default Image;