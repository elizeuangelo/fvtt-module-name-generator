import DirectoryPicker from '../lib/DirectoryPicker.js';

export const TITLE = 'Name Generator';
export const ABREV = 'Name Gen';
export const MODULE = 'name-generator';
export const FILE_PATH = `/modules/${MODULE}/`; //\/\/[^\/]+\/(.*\/)module\//.exec(import.meta.url)![1];
export let DEBUG_LEVEL = 0;

export function registerSettings() {
	game.settings.register(MODULE, 'debug', {
		name: 'Debug Level',
		scope: 'client',
		config: false,
		type: Number,
		default: 1,
		hint: 'Sets the debug level',
	});

	game.settings.register(MODULE, 'portrait-directory', {
		name: 'Portrait Directory',
		scope: 'world',
		config: true,
		//@ts-ignore
		type: DirectoryPicker.Directory,
		default: '[data]',
		hint: 'Art directory to sample portrais from. The name of every file should be a concatenation of its tags, separated by "_"',
	});

	game.settings.register(MODULE, 'tokenizer', {
		name: 'Tokenizer',
		scope: 'world',
		config: true,
		type: Boolean,
		default: true,
		hint: 'Automatically tokenize tokens?',
	});

	game.settings.register(MODULE, 'default-folder', {
		name: 'Default Folder',
		hint: 'Sets the default folder for the application. Page needs to be reloaded to update the list.',
		scope: 'world',
		config: true,
		default: '',
		type: String,
		choices: Object.fromEntries([
			['', ''],
			...game.folders.filter((f) => f.type === 'Actor' && f.displayed).map((folder) => [folder.id, folder.name]),
		]) as Record<string, string>,
	});

	DEBUG_LEVEL = game.settings.get(MODULE, 'debug') as number;
}

export function getDefaultFolder() {
	return game.folders.get(game.settings.get(MODULE, 'default-folder') as string)?.id ?? '';
}
