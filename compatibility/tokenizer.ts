export const TOKENIZER = () => game.modules.get('vtta-tokenizer')?.active;
export const tokenize = (actor: Actor) => window.Tokenizer.autoToken(actor);
