import { log } from './utils.js';
import { TOKENIZER, tokenize } from '../compatibility/tokenizer.js';
import { ActorData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/module.mjs.js';

export type Data = typeof CharDraft.prototype.data;
interface Config {
	names: string[];
	portrait?: string;
	token?: string;
	type: string;
	folder?: string;
	updateNames?: boolean;
}

/**
 * Base Class for NPC Drafting
 */
export class CharDraft {
	/**
	 * Creates an Actor
	 * @returns Actor
	 */
	static async create(data: Config, original = {}) {
		const draft = new CharDraft(data, original);
		return draft.createActor();
	}
	static identifyNames(fullName: string) {
		const regex = /(\w+)(?: (\w+,?(?: of the)?))?(?: (\w+))?/i;
		return regex.exec(fullName);
	}
	static cleanData(original: Object) {
		const cleanse = Object.keys(original).filter((i) => i[0] === '_');
		for (const property of cleanse) delete original[property];
	}

	data = {
		type: '',
		name: '',
		img: 'icons/svg/mystery-man.svg',
		prototypeToken: {
			name: '',
			texture: {
				src: 'icons/svg/mystery-man.svg',
			},
		},
		folder: '',
	};

	constructor(data: Config, original = {}) {
		CharDraft.cleanData(original);
		mergeObject(this.data, original);

		const fullName = data.names!.join(' '),
			firstName = data.names[0];

		if (data.updateNames && this.data.name) {
			const oldName = CharDraft.identifyNames(this.data.name);
			if (oldName) this.renameCharData([oldName[0], oldName[1]], [fullName, firstName]);
		}

		this.data.name = fullName;
		this.data.prototypeToken.name = firstName;
		this.data.img = data.portrait || this.data.img;
		this.data.prototypeToken.texture.src = data.token || this.data.img;

		this.data.type = data.type;
		this.data.folder = data.folder || this.data.folder;
	}

	/**
	 * Replace the oldName in all inner strings for the newName
	 * @param oldName
	 * @param newName
	 */
	renameCharData<T extends readonly [] | readonly string[]>(oldName: T, newName: { [K in keyof T]: string }) {
		function renameAll(obj: Object) {
			const flat = flattenObject(obj);
			for (const [key, value] of Object.entries(flat)) {
				if (typeof value !== 'string') continue;
				for (let i = 0; i < oldName.length; i++) {
					flat[key] = value.replaceAll(oldName[i], newName[i]);
				}
			}
			return mergeObject(Array.isArray(obj) ? [] : {}, flat);
		}

		for (const obj of [...Object.values(Actor.metadata.embedded), 'system'] as string[]) {
			if (obj in this.data) {
				this.data[obj] = renameAll(this.data[obj]);
			}
		}
	}

	/**
	 * Creates an actor based on the Draft
	 */
	async createActor() {
		const actor = (await Actor.create(this.data as any)) as StoredDocument<Actor> as any;

		const tokenEqualPortrait = actor.img === actor.prototypeToken.texture.src;
		if (tokenEqualPortrait && actor.img !== 'icons/svg/mystery-man.svg' && TOKENIZER() && game.settings.get('name-generator', 'tokenizer'))
			await tokenize(actor);
		log(`NPC Generated: ${actor.name}`);
		ui.notifications.notify(`Character created! ${actor.name}`);
		return actor;
	}
}
