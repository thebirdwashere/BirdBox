import { MessageContext } from "./context.js";

//TODO: add notification support

export class Interjection {
  name: string;
  test: (ctx: MessageContext) => Promise<void> | void;

  constructor(
    args: {
      name: string;
      test: (ctx: MessageContext) => Promise<void> | void;
    },
  ) {
    this.name = args.name;
    this.test = args.test;
  }
}