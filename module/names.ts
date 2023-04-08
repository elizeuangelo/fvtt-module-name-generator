import { MODULE } from './settings.js';
import { log, warn, error, pick, recursive_menu, seeder } from './utils.js';

export class DB {
	name: string;
	loaded = false;
	data: string[][] = [];
	constructor(name: string) {
		this.name = name;
	}
	load = async () => {
		this.data = (await readDB(this.name)) ?? [];
		if (!this.data.length) {
			throw new Error(`Failed to load ${this.name} database.`);
		}
		return (this.loaded = true);
	};
}

class NameGenerator {
	_source: any;
	label: string;
	get: (option?: number) => Promise<[string, string]>;
	constructor(label = '', data: any, fn = genericNameGen) {
		this._source = data;
		this.label = label;
		this.get = fn;
	}
}

async function readDB(db: string) {
	const response = await fetch(`modules/${MODULE}/${db}.csv`);
	if (!response.ok) {
		error(`Failed to fetch ./${db}.csv: ${response.status}`);
		return;
	}
	const pattern = new RegExp(
		// Delimiters.
		'(\\,|\\r?\\n|\\r|^)' +
			// Quoted fields.
			'(?:"([^"]*(?:""[^"]*)*)"|' +
			// Standard fields.
			'([^"\\,\\r\\n]*))',
		'gi'
	);
	const data = await (await response.blob()).text();
	let array: string[][] = [[]];
	let arrMatches: RegExpExecArray | null = null;
	while ((arrMatches = pattern.exec(data))) {
		var strMatchedDelimiter = arrMatches[1];
		if (strMatchedDelimiter.length && strMatchedDelimiter !== ',') array.push([]);
		var strMatchedValue;
		if (arrMatches[2]) strMatchedValue = arrMatches[2].replace(new RegExp('""', 'g'), '"');
		else strMatchedValue = arrMatches[3];
		array[array.length - 1].push(strMatchedValue);
	}
	log(`Fetched ./${db}.csv`);
	return array;
}

async function genericNameGen(this: NameGenerator, option = 0, prefix = 'The first name means'): Promise<[string, string]> {
	const db = this._source as DB;
	if (!(await loadDB(db))) return ['', ''];

	let data = db.data;
	let sex_index = 0;
	let meaning_index = 0;
	if (Array.isArray(data[0])) {
		for (let i = 1; i < data[0].length; i++) {
			if (['m', 'f', 'u'].includes(data[0][i])) {
				sex_index = i;
				continue;
			}
			meaning_index = i;
		}
	}

	if (sex_index) {
		if (option === 1) {
			data = db.data.filter((name) => name[sex_index] !== 'f');
		} else if (option === 2) {
			data = db.data.filter((name) => name[sex_index] !== 'm');
		}
	}

	const item = pick(data);
	let meaning = '';
	if (meaning_index) meaning = item[meaning_index];

	if (meaning) meaning = prefix + ' "' + meaning + '".';

	return [item[0], meaning];
}

async function genericNameGen2(this: NameGenerator): Promise<[string, string]> {
	const db = this._source;
	if (!(await loadDB(db))) return ['', ''];
	const item = pick(db.data);
	return [item[0], item[1] ?? ''];
}

async function dwarvenSurnameGen(this: NameGenerator): Promise<[string, string]> {
	const db = this._source as DB;
	if (!(await loadDB(db))) return ['', ''];
	return [pick(db.data[0]) + pick(db.data[1]), ''];
}

async function loadDB(db: any) {
	if ('loaded' in db && !db.loaded && !(await db.load())) return false;
	return true;
}

const DBs = {
	arabic_names: new DB('names/arabicnames'),
	arabic_surnames: new DB('names/arabicsurnames'),
	english_names: new DB('names/englishnames'),
	english_surnames: new DB('names/englishsurnames'),
	french_names: new DB('names/frenchnames'),
	french_surnames: new DB('names/frenchsurnames'),
	german_names: new DB('names/germannames'),
	german_surnames: new DB('names/germansurnames'),
	hindi_names: new DB('names/hindinames'),
	hindi_surnames: new DB('names/hindisurnames'),
	italian_names: new DB('names/italiannames'),
	italian_surnames: new DB('names/italiansurnames'),
	japanese_names: new DB('names/japanesenames'),
	japanese_surnames: new DB('names/japanesesurnames'),
	korean_names: new DB('names/koreannames'),
	korean_surnames: new DB('names/koreansurnames'),
	chinese_names: new DB('names/chinesenames'),
	chinese_surnames: new DB('names/chinesesurnames'),
	russian_names: new DB('names/russiannames'),
	russian_surnames: new DB('names/russiansurnames'),
	spanish_names: new DB('names/spanishnames'),
	spanish_surnames: new DB('names/spanishsurnames'),
	swahili_names: new DB('names/swahilinames'),
	swahili_surnames: new DB('names/swahilisurnames'),
	turkish_names: new DB('names/turkishnames'),
	turkish_surnames: new DB('names/turkishsurnames'),
	welsh_names: new DB('names/welshnames'),
	welsh_surnames: new DB('names/welshsurnames'),
	oldnorse_names: new DB('names/oldnorsenames'),
	oldgerman_names: new DB('names/oldgermannames'),
	oldgerman_surnames: new DB('names/oldgermansurnames'),
	oldroman_names: new DB('names/oldromannames'),
	oldroman_surnames: new DB('names/oldromansurnames'),
	oldceltic_names: new DB('names/oldcelticnames'),
	oldceltic_surnames: new DB('names/oldcelticsurnames'),
	oldenglish_names: new DB('names/oldenglishnames'),
	oldenglish_surnames: new DB('names/oldenglishsurnames'),
	fr_drow_names: new DB('names/forgotten/drownames'),
	fr_drow_houses: new DB('names/forgotten/drowhouses'),
	dwarven_names: new DB('names/fantasy/dwarvennames'),
	dwarven_surnames: new DB('names/fantasy/dwarvensurnames'),
	fr_dwarven_clans: new DB('names/forgotten/dwarvenclans'),
	duergar_names: new DB('names/fantasy/duergarnames'),
	duergar_surnames: new DB('names/fantasy/duergarsurnames'),
	elven_names: new DB('names/fantasy/elvennames'),
	elven_surnames: new DB('names/fantasy/elvensurnames'),
	halfling_names: new DB('names/fantasy/halflingnames'),
	halfling_surnames: new DB('names/fantasy/halflingsurnames'),
};

const generators: { [key: string]: NameGenerator } = {
	arabic_names: new NameGenerator('Name', DBs.arabic_names),
	arabic_surnames: new NameGenerator('Surname', DBs.arabic_surnames),
	english_names: new NameGenerator('Name', DBs.english_names),
	english_surnames: new NameGenerator('Surname', DBs.english_surnames),
	french_names: new NameGenerator('Name', DBs.french_names),
	french_surnames: new NameGenerator('Surname', DBs.french_surnames),
	german_names: new NameGenerator('Name', DBs.german_names),
	german_surnames: new NameGenerator('Surname', DBs.german_surnames),
	hindi_names: new NameGenerator('Name', DBs.hindi_names),
	hindi_surnames: new NameGenerator('Surname', DBs.hindi_surnames),
	italian_names: new NameGenerator('Name', DBs.italian_names),
	italian_surnames: new NameGenerator('Surname', DBs.italian_surnames),
	japanese_names: new NameGenerator('Name', DBs.japanese_names),
	japanese_surnames: new NameGenerator('Surname', DBs.japanese_surnames),
	korean_names: new NameGenerator('Name', DBs.korean_names),
	korean_surnames: new NameGenerator('Surname', DBs.korean_surnames),
	chinese_names: new NameGenerator('Name', DBs.chinese_names),
	chinese_surnames: new NameGenerator('Surname', DBs.chinese_surnames),
	russian_names: new NameGenerator('Name', DBs.russian_names),
	russian_surnames: new NameGenerator('Surname', DBs.russian_surnames),
	spanish_names: new NameGenerator('Name', DBs.spanish_names),
	spanish_surnames: new NameGenerator('Surname', DBs.spanish_surnames),
	swahili_names: new NameGenerator('Name', DBs.swahili_names),
	swahili_surnames: new NameGenerator('Surname', DBs.swahili_surnames),
	turkish_names: new NameGenerator('Name', DBs.turkish_names),
	turkish_surnames: new NameGenerator('Surname', DBs.turkish_surnames),
	welsh_names: new NameGenerator('Name', DBs.welsh_names),
	welsh_surnames: new NameGenerator('Surname', DBs.welsh_surnames),
	oldnorse_names: new NameGenerator('Name', DBs.oldnorse_names),
	oldgerman_names: new NameGenerator('Name', DBs.oldgerman_names),
	oldgerman_surnames: new NameGenerator('Surname', DBs.oldgerman_surnames),
	oldroman_names: new NameGenerator('Name', DBs.oldroman_names),
	oldroman_surnames: new NameGenerator('Surname', DBs.oldroman_surnames),
	oldceltic_names: new NameGenerator('Name', DBs.oldceltic_names),
	oldceltic_surnames: new NameGenerator('Surname', DBs.oldceltic_surnames),
	oldenglish_names: new NameGenerator('Name', DBs.oldenglish_names),
	oldenglish_surnames: new NameGenerator('Surname', DBs.oldenglish_surnames),
	fr_drow_names: new NameGenerator('Name', DBs.fr_drow_names),
	fr_drow_houses: new NameGenerator('House', DBs.fr_drow_houses),
	dwarven_names: new NameGenerator('Name', DBs.dwarven_names, async function (this: NameGenerator) {
		const db = this._source as DB;
		let item;
		if (!(await loadDB(db))) return ['', ''];
		if (seeder.rnd() > 0.5) {
			item = [pick(db.data[0]), pick(db.data[1]), pick(db.data[2])];
		} else {
			item = [pick(db.data[3]), pick(db.data[4]), pick(db.data[5])];
		}
		return [item.join(''), ''];
	}),
	dwarven_surnames: new NameGenerator('Surname', DBs.dwarven_surnames, dwarvenSurnameGen),
	fr_dwarven_surnames: new NameGenerator('Family', [], async function (this: NameGenerator) {
		if (seeder.rnd() > 0.1) {
			return [(await generators.dwarven_surnames.get())[0] + ', of the', ''];
		}
		return ['', ''];
	}),
	fr_dwarven_clans: new NameGenerator('Clan', DBs.fr_dwarven_clans, async function (this: NameGenerator) {
		const item = await genericNameGen2.apply(this, []);
		if (item[1]) item[1] = `This is a dwarven clan from ${item[1]}ern Faerûn.`;
		return item;
	}),
	duergar_names: new NameGenerator('Name', DBs.duergar_names, async function (this: NameGenerator) {
		const db = this._source as DB;
		let item;
		if (!(await loadDB(db))) return ['', ''];
		if (seeder.rnd() > 0.5) {
			item = [pick(db.data[0]), pick(db.data[1])];
		} else {
			item = [pick(db.data[2]), pick(db.data[3])];
		}
		return [item.join(''), ''];
	}),
	duergar_surnames: new NameGenerator('Surname', DBs.duergar_surnames, dwarvenSurnameGen),
	elven_names: new NameGenerator('Name', DBs.elven_names),
	elven_houses: new NameGenerator('House', DBs.elven_surnames, async function (this: NameGenerator) {
		const name = await genericNameGen2.apply(this, []);
		if (name[1] && name[1].split(' ').length === 1) name[1] = 'The house name means "' + name[1] + '".';
		return name;
	}),
	halfling_names: new NameGenerator('Name', DBs.halfling_names),
	halfling_surnames: new NameGenerator('House', DBs.halfling_surnames),
};

const menu = {
	All: {
		Contemporany: {
			Arabic: [generators.arabic_names, generators.arabic_surnames],
			English: [generators.english_names, generators.english_surnames],
			French: [generators.french_names, generators.french_surnames],
			German: [generators.german_names, generators.german_surnames],
			Hindi: [generators.hindi_names, generators.hindi_surnames],
			Italian: [generators.italian_names, generators.italian_surnames],
			Japanese: [generators.japanese_names, generators.japanese_surnames],
			Korean: [generators.korean_names, generators.korean_surnames],
			Chinese: [generators.chinese_names, generators.chinese_surnames],
			Russian: [generators.russian_names, generators.russian_surnames],
			Spanish: [generators.spanish_names, generators.spanish_surnames],
			Swahili: [generators.swahili_names, generators.swahili_surnames],
			Turkish: [generators.turkish_names, generators.turkish_surnames],
			Welsh: [generators.welsh_names, generators.welsh_surnames],
		},
		Medieval: {
			OldNorse: [generators.oldnorse_names],
			OldGerman: [generators.oldgerman_names, generators.oldgerman_surnames],
			OldRoman: [generators.oldroman_names, generators.oldroman_surnames],
			OldCeltic: [generators.oldceltic_names, generators.oldceltic_surnames],
			OldEnglish: [generators.oldenglish_names, generators.oldenglish_surnames],
		},
		Fantasy: {
			Generic: {
				Dwarf: [generators.dwarven_names, generators.dwarven_surnames],
				Duergar: [generators.duergar_names, generators.duergar_surnames],
				Elven: [generators.elven_names, generators.elven_houses],
				Halfling: [generators.halfling_names, generators.halfling_surnames],
			},
			ForgottenRealms: {
				Drow: [generators.fr_drow_names, generators.fr_drow_houses],
				Dwarf: [generators.dwarven_names, generators.fr_dwarven_surnames, generators.fr_dwarven_clans],
				Duergar: [generators.duergar_names, generators.duergar_surnames],
				Elven: [generators.elven_names, generators.elven_houses],
				Halfling: [generators.halfling_names, generators.halfling_surnames],
			},
		},
	},
};

const [index, references] = recursive_menu(menu);

export { menu, index, references };
export type { NameGenerator };
