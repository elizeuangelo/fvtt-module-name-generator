export const TOKENIZER = () => game.modules.get('vtta-tokenizer')?.active;
export const tokenize = (actor) => window.Tokenizer.autoToken(actor);
