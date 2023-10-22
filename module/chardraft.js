import { log } from './utils.js';
import { TOKENIZER, tokenize } from '../compatibility/tokenizer.js';
export class CharDraft {
    static async create(data, original = {}) {
        const draft = new CharDraft(data, original);
        return draft.createActor();
    }
    static identifyNames(fullName) {
        const regex = /(\w+)(?: (\w+,?(?: of the)?))?(?: (\w+))?/i;
        return regex.exec(fullName);
    }
    static cleanData(original) {
        const cleanse = Object.keys(original).filter((i) => i[0] === '_');
        for (const property of cleanse)
            delete original[property];
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
        'flags.core.sheetClass': '',
    };
    constructor(data, original = {}) {
        CharDraft.cleanData(original);
        mergeObject(this.data, original);
        const fullName = data.names.join(' '), firstName = data.names[0];
        if (data.updateNames && this.data.name) {
            const oldName = CharDraft.identifyNames(this.data.name);
            if (oldName)
                this.renameCharData([oldName[0], oldName[1]], [fullName, firstName]);
        }
        this.data.name = fullName;
        this.data.prototypeToken.name = firstName;
        this.data.img = data.portrait || this.data.img;
        this.data.prototypeToken.texture.src = data.token || this.data.img;
        this.data.type = data.type;
        this.data.folder = data.folder || this.data.folder;
        if (data.sheet)
            this.data['flags.core.sheetClass'] = data.sheet;
    }
    renameCharData(oldName, newName) {
        function renameAll(obj) {
            const flat = flattenObject(obj);
            for (const [key, value] of Object.entries(flat)) {
                if (typeof value !== 'string')
                    continue;
                for (let i = 0; i < oldName.length; i++) {
                    flat[key] = value.replaceAll(oldName[i], newName[i]);
                }
            }
            return mergeObject(Array.isArray(obj) ? [] : {}, flat);
        }
        for (const obj of [...Object.values(Actor.metadata.embedded), 'system']) {
            if (obj in this.data) {
                this.data[obj] = renameAll(this.data[obj]);
            }
        }
    }
    async createActor() {
        const actor = (await Actor.create(this.data));
        const tokenEqualPortrait = actor.img === actor.prototypeToken.texture.src;
        if (tokenEqualPortrait &&
            actor.img !== 'icons/svg/mystery-man.svg' &&
            TOKENIZER() &&
            game.settings.get('name-generator', 'tokenizer'))
            await tokenize(actor);
        log(`NPC Generated: ${actor.name}`);
        ui.notifications.notify(`Character created! ${actor.name}`);
        return actor;
    }
}
