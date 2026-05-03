import { Command, Subcommand, CommandOption } from "src/utility/command.js";
import { EmbedBuilder, Colors } from "discord.js";

const ALL_DOG_BREEDS = "https://dog.ceo/api/breeds/list/all";

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
        }),
        new CommandOption({
          name: "breed",
          description: "Which breed you want images of. If not specified, will choose from all available breeds.",
          type: "string",
          required: false,
        }),
      ],
      execute: async (ctx, opts) => {
        const imageType = opts.string.get("type") ?? "image";
        const selectedBreed = (opts.string.get("breed") ?? "").toLowerCase();

        let fetchString = `https://api.thecatapi.com/v1/images/search?mime_types=${imageType}`;
        
        interface JsonList<T> {
            json(): Promise<T[]>;
        };

        if (selectedBreed !== "") {
          interface PetBreed {
            id: string;
            name: string;
          };

          //is this really what banishes the squiggly lines??? type cast to unknown and then my desired type??? weird stuff
          const breedsList: JsonList<PetBreed> = await fetch("https://api.thecatapi.com/v1/breeds") as unknown as JsonList<PetBreed>;
          const petBreeds: PetBreed[] = await breedsList.json();

          //console.log(JSON.stringify(petBreeds, null, 2));

          const petIds = petBreeds.map(breed => breed.id);
          const petNames = petBreeds.map(breed => breed.name);

          const breedId = petNames.includes(selectedBreed) ? petIds[petNames.indexOf(selectedBreed)] : undefined;
          if (breedId !== undefined) {
            fetchString += `&breed_ids=${breedId}`;
          };
      }

        interface PetData {
            url?: string;
        };

        const petFetch: JsonList<PetData> = await fetch(fetchString) as unknown as JsonList<PetData>;
        const petData: PetData[] = await petFetch.json();

        if (petData[0]?.url === undefined) throw new Error("Request could not be found. Try broadening your specifications.");

        const imageURL = petData[0].url;

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
      description: "Picks a random dog from Dog API.",
      options: [
        new CommandOption({
          name: "breed",
          description: "Which breed you want images of. If not specified, will choose from all available breeds.",
          type: "string",
          required: false,
          autocomplete: true,
        }),
      ],
      autocomplete: async (ctx) => {
        interface BreedsResponse {
          message: Record<string, string[]>;
          status: string;
        };

        const breedsRawResponse = await fetch(ALL_DOG_BREEDS);
        const breedsJSON = await breedsRawResponse.json() as BreedsResponse;

        if (breedsJSON.status !== "success")
          throw new Error(`Recieved status ${breedsJSON.status} when fetching breeds for dogs.`);

        const petBreeds: string[] = Object.keys(breedsJSON.message);

        await ctx.respondStrings(petBreeds as [string, ...string[]]);
      },
      execute: async (ctx, opts) => {
        let breedString = "breeds/image";

        const selectedBreed = (opts.string.get("breed") ?? "").toLowerCase();

        if (selectedBreed) {
          interface BreedsResponse {
            message: Record<string, string[]>;
            status: string;
          };

          //TODO: Implement sub-breeds

          const breedsRawResponse = await fetch(ALL_DOG_BREEDS);
          const breedsJSON = await breedsRawResponse.json() as BreedsResponse;

          if (breedsJSON.status !== "success")
            throw new Error(`Recieved status ${breedsJSON.status} when fetching breeds for dogs.`);

          const petBreeds: string[] = Object.keys(breedsJSON.message);

          //console.log(petBreeds);

          if (!petBreeds.includes(selectedBreed))
            throw new Error(`Selected breed "${selectedBreed}" does not exist.`);

          breedString = `breed/${selectedBreed}/images`;
        }

        interface ImageResponse {
          message: string;
          status: string;
        };

        const imageRawResponse = await fetch(`https://dog.ceo/api/${breedString}/random`);
        const imageJSON = await imageRawResponse.json() as ImageResponse;

        if (imageJSON.status !== "success")
          throw new Error(`Recieved status ${imageJSON.status} when fetching breed ${selectedBreed}`);
        const imageURL = imageJSON.message;

        const dogEmbed = new EmbedBuilder()
            .setTitle("Random Dog")
            .setAuthor({ name: "Dog API (dog.ceo)", iconURL: "https://i.natgeofe.com/n/225bafe4-88e7-4f91-ad60-7ff43277ec4b/Conan2_square.jpg" })
            .setColor(Colors.Blue)
            .setImage(imageURL);

        await ctx.reply({ embeds: [dogEmbed] });
      },
    })
  ],
});

export default Image;