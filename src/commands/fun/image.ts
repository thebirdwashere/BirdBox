import { Command, Subcommand, CommandOption } from "src/utility/command.js";
import { EmbedBuilder, Colors } from "discord.js";

const CAT_LINK = "api.thecatapi.com";
const DOG_LINK = "api.thedogapi.com";

const Image = new Command({
  name: "image",
  description: "Enjoy some images handpicked (randomly) by BirdBox.",
  subcommands: [
    new Subcommand({
      name: "cat",
      description: "Picks a random cat from TheCatAPI.",
      options: [
        new CommandOption({
          name: "type",
          description: "Which result format you want. Must be one of \"image\" or \"gif\".",
          type: "string",
          required: false,
          autocomplete: true,
        }),
        new CommandOption({
          name: "breed",
          description: "Which breed you want images of. If not specified, will choose from all available breeds.",
          type: "string",
          required: false,
          autocomplete: true,
        }),
      ],
      autocomplete: async (ctx) => {
        switch (ctx.option.name) {
          case "type": {
            await ctx.respondStrings(["image", "gif"]);
            break;
          }
          case "breed": {
            const petBreeds = await getPetBreeds(CAT_LINK);
            const formattedBreeds = petBreeds.map(breed => {
              return {
                name: breed.name,
                value: breed.id,
              };
            });

            await ctx.respond(formattedBreeds);
            break;
          }
        }
      },
      execute: async (ctx, opts) => {
        const imageType = opts.string.get("type") ?? "image";
        const selectedBreed = opts.string.get("breed") ?? "";

        const imageURL = await getPetImage(imageType, selectedBreed, CAT_LINK);

        const catEmbed = new EmbedBuilder()
          .setTitle("Random Cat")
          .setAuthor({ name: "TheCatAPI", iconURL: "https://i.natgeofe.com/n/eb0f9db1-8b29-4598-ad7e-89716501189f/cat-whisperers-nationalgeographic_1048225_square.jpg" })
          .setColor(Colors.Blue)
          .setImage(imageURL);

        await ctx.reply({ embeds: [catEmbed] });
      }
    }),
    new Subcommand({
      name: "dog",
      description: "Picks a random dog from TheDogAPI.",
      options: [
        new CommandOption({
          name: "type",
          description: "Which result format you want. Must be one of `image` or `gif`.",
          type: "string",
          required: false,
        }),
        new CommandOption({
          name: "breed",
          description: "Which breed you want images of. If not specified, will choose from all available breeds.",
          type: "string",
          required: false,
          autocomplete: true,
        }),
      ],
      autocomplete: async (ctx) => {
        switch (ctx.option.name) {
          case "type": {
            await ctx.respondStrings(["image", "gif"]);
            break;
          }
          case "breed": {
            const petBreeds = await getPetBreeds(DOG_LINK);
            const formattedBreeds = petBreeds.map(breed => {
              return {
                name: breed.name,
                value: breed.id,
              };
            });

            await ctx.respond(formattedBreeds);
            break;
          }
        }
      },
      execute: async (ctx, opts) => {
        const imageType = opts.string.get("type") ?? "image";
        const selectedBreed = opts.string.get("breed") ?? "";

        const imageURL = await getPetImage(imageType, selectedBreed, DOG_LINK);

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

async function getPetImage(type: string, breed: string, link: string): Promise<string> {
  let fetchString = `https://${link}/v1/images/search?mime_types=${type}`;

  if (breed !== "") {
    const petBreeds = await getPetBreeds(link);

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
      throw new Error(`Breed ${breed} could not be found.`);
    }
  }

  interface PetData {
    url?: string;
  };

  const petFetch: JsonList<PetData> = await fetch(fetchString) as unknown as JsonList<PetData>;
  const petData: PetData[] = await petFetch.json();

  if (petData[0]?.url === undefined) throw new Error(`Could not find ${type} of the requested breed. Try broadening your specifications.`);

  return petData[0].url;
}

async function getPetBreeds(link: string): Promise<PetBreed[]> {
  const list: JsonList<PetBreed> = await fetch(`https://${link}/v1/breeds`) as JsonList<PetBreed>;
  const breeds: PetBreed[] = await list.json();

  return breeds;
};
  
interface JsonList<T> {
  json(): Promise<T[]>;
};

interface PetBreed {
  id: string;
  name: string;
};

export default Image;