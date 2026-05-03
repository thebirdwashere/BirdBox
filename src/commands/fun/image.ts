import { Command, Subcommand, CommandOption } from "src/utility/command.js";
import { EmbedBuilder, Colors } from "discord.js";

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
                const selectedBreed = opts.string.get("breed") ?? "test";

                const imageURL = await getPetImage(imageType, selectedBreed, "api.thecatapi.com");

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
                }),
            ],
            execute: async (ctx, opts) => {
                const imageType = opts.string.get("type") ?? "image";
                const selectedBreed = opts.string.get("breed") ?? "test";

                const imageURL = await getPetImage(imageType, selectedBreed, "api.thedogapi.com");

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
    
    interface JsonList<T> {
        json(): Promise<T[]>;
    };

    if (breed !== "") {
        interface PetBreed {
            id: string;
            name: string;
        };

        //is this really what banishes the squiggly lines??? type cast to unknown and then my desired type??? weird stuff
        const breedsList: JsonList<PetBreed> = await fetch(`https://${link}/v1/breeds`) as unknown as JsonList<PetBreed>;
        const petBreeds: PetBreed[] = await breedsList.json();

        //console.log(JSON.stringify(petBreeds, null, 2));

        const petIds = petBreeds.map(breed => breed.id);
        const petNames = petBreeds.map(breed => breed.name);

        let breedId;
        breedId = petIds.includes(breed) ? breed : undefined;
        breedId = petNames.includes(breed) ? petIds[petNames.indexOf(breed)] : undefined;
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

    return petData[0].url;
}

export default Image;