import { MessageContext } from "./context.js";

export class Interjection {
  name: string;
  test: (ctx: MessageContext) => InterjectionState | undefined;
  respond: (ctx: MessageContext, state: InterjectionState) => Promise<void>;

  constructor(
    args: {
      name: string;
      test: (ctx: MessageContext) => InterjectionState | undefined,
      respond: (ctx: MessageContext, state: InterjectionState) => Promise<void>,
    },
  ) {
    this.name = args.name;
    this.test = args.test;
    this.respond = args.respond;
  }
}

export interface InterjectionState {
  text?: string[];
  values?: number[];
  flags?: boolean[];
}