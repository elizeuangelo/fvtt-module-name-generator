declare global {
	interface LenientGlobalVariableTypes {
		canvas: never;
		game: never;
		socket: never;
		ui: never;
	}
	interface Window {
		npcGen: any;
		Tokenizer: any;
		ForgeVTT: any;
	}
}

export {};
