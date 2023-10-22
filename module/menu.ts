import { between, pick, sounds, warn } from './utils.js';
import { CharDraft } from './chardraft.js';
import * as names from './names.js';
import type { NameGenerator } from './names.js';
import { FILE_PATH, MODULE, TITLE } from './settings.js';
import DirectoryPicker from '../lib/DirectoryPicker.js';

interface PortraitData {
	tags: { [key: string]: boolean };
	files: string[];
	size: number;
}

class CharacterGeneratorPortraitFilter extends FormApplication<FormApplicationOptions, PortraitData> {
	declare object: { tags: { [key: string]: boolean }; files: string[]; size: number };
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			id: 'namegen-portrait',
			title: 'Portrait Filter',
			classes: ['sheet'],
			template: FILE_PATH + '/templates/tags.html',
			width: 600,
		});
	}
	/**
	 * Get all game settings related to the form, to display them
	 * @param _options
	 */
	async getData(_options: any) {
		return this.object;
	}
	async _updateObject(_event: Event, formData: { [key: string]: any }) {
		this.object.tags = formData;
	}
}

interface Data {}

export class CharacterGenerator extends FormApplication<FormApplicationOptions, Data> {
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			id: 'namegen',
			title: TITLE,
			classes: ['sheet'],
			template: FILE_PATH + '/templates/menu.html',
			width: 700,
		});
	}
	static selectOptionsNoEscape(choices, options) {
		let { localize = false, selected = null, blank = null, sort = false, nameAttr, labelAttr, inverted } = options.hash;
		selected = selected instanceof Array ? selected.map(String) : [String(selected)];

		// Prepare the choices as an array of objects
		const selectOptions: { name: string; label: string }[] = [];
		if (choices instanceof Array) {
			for (const choice of choices) {
				const name = String(choice[nameAttr]);
				let label = choice[labelAttr];
				if (localize) label = game.i18n.localize(label);
				selectOptions.push({ name, label });
			}
		} else {
			for (const choice of Object.entries(choices)) {
				const [key, value]: any = inverted ? choice.reverse() : choice;
				const name = String(nameAttr ? value[nameAttr] : key);
				let label = labelAttr ? value[labelAttr] : value;
				if (localize) label = game.i18n.localize(label);
				selectOptions.push({ name, label });
			}
		}

		// Sort the array of options
		if (sort) selectOptions.sort((a, b) => a.label.localeCompare(b.label));

		// Prepend a blank option
		if (blank !== null) {
			const label = localize ? game.i18n.localize(blank) : blank;
			selectOptions.unshift({ name: '', label });
		}

		// Create the HTML
		let html = '';
		for (const option of selectOptions) {
			const isSelected = selected.includes(option.name);
			html += `<option value="${option.name}" ${isSelected ? 'selected' : ''}>${option.label}</option>`;
		}
		return new Handlebars.SafeString(html);
	}
	_defaultData = {
		name1: '',
		name2: '',
		name3: '',
		locks: {
			name1: false,
			name2: false,
			name3: false,
			portrait: false,
		},
		selection: {
			names: 0,
		},
		indexes: {
			names: names.index,
		},
		portrait: '',
		token: '',
		data: {} as Object,
		folders: [] as Folder[],
		hasFolders: false,
		folder: '',
		hasTypes: game.documentTypes['Actor'].length > 1,
		types: game.documentTypes['Actor'].reduce((obj, t) => {
			const label = CONFIG['Actor']?.typeLabels?.[t] ?? t;
			obj[t] = game.i18n.has(label) ? game.i18n.localize(label) : t;
			return obj;
		}, {}),
		type: CONFIG['Actor']?.defaultType || game.documentTypes['Actor'][0],
		isTemplate: false,
	};
	data = mergeObject({}, this._defaultData);

	/**
	 * Get all game settings related to the form, to display them
	 * @param _options
	 */
	async getData(_options: any) {
		this.data.folders = game.folders.filter((f) => f.type === 'Actor' && f.displayed);
		this.data.hasFolders = this.data.folders.length >= 1;

		return this.data;
	}
	updateNameBoxes(generators: NameGenerator[]) {
		const checkboxes = this.element.find('#names :checkbox') as JQuery<HTMLInputElement>;
		for (let i = 0; i < checkboxes.length; i++) {
			const show = generators.length > i;
			const checkbox = checkboxes[i];
			const target = (this.element as JQuery<HTMLInputElement>).find(`#${checkbox.getAttribute('for')}`);
			if (!checkbox.checked && !show) {
				if (!target.hasClass('hide')) target.addClass('hide');
			} else if (target.hasClass('hide')) target.removeClass('hide');
		}
		for (let i = 0; i < generators.length; i++) {
			const input = this.element.find(`input[name=name${i + 1}]`) as JQuery<HTMLInputElement>;
			input[0].placeholder = generators[i].label;
		}
	}
	_updateSheetOptions() {
		//@ts-ignore
		const el = this.form!.elements['type'];
		//@ts-ignore
		const sheet = this.form!.elements['sheet'];
		sheet.innerHTML = '';
		const options = Object.values(CONFIG.Actor.sheetClasses[el.value])
			.map(({ id, label }) => `<option value="${id}">${label}</option>`)
			.join('');
		sheet.innerHTML = options;
	}

	/**
	 * Updates the settings to match the forms
	 * @param _event
	 * @param formData The form data to be saved
	 */
	async _updateObject(_event: Event, formData: { [key: string]: any }) {}
	_onChangeRange(event: any) {
		const field = event.target?.parentElement.querySelector('.range-value');
		if (field) {
			if (field.tagName === 'INPUT') {
				field.value = event.target?.value;
				return;
			}
			field.innerHTML = event.target?.value;
		}
	}
	async _onChangeInput(event: any) {
		// Handle changes to specific input types
		const el = event.currentTarget;
		const prev = el.previousElementSibling;
		if (prev && prev.children[0]?.classList.contains('lock-btn')) {
			prev.children[0].checked = false;
		}
		if (el.name === 'type') {
			this._updateSheetOptions();
		}
		if (el.tagName === 'INPUT' && el.name === 'portrait') {
			this._onSelectFile(el.value);
			if (el.value) this._lock('portrait', true);
		} else if (el.id === 'generator') {
			const generators = names.references[el.value];
			const group = !Array.isArray(generators);
			if (!group) {
				this.updateNameBoxes(generators);
			}
			this._randomizeName();
		}
		if (el.type === 'color' && el.dataset.edit) this._onChangeColorPicker(event);
		else if (el.type === 'range') this._onChangeRange(event);

		// Maybe submit the form
		if (this.options.submitOnChange) {
			return this._onSubmit(event);
		}
	}

	_onSelectFile(selection: string, filePicker?: FilePicker) {
		const el = this.element.find('div.picture img[title=Portrait]') as JQuery<HTMLImageElement>;
		el[0].src = selection || 'icons/svg/circle.svg';
	}

	_lock(input: string, checked?: boolean) {
		const lock = (this.element.find(`:checkbox[for=${input}]`) as JQuery<HTMLInputElement>)[0];
		if (!lock) return;
		const check = checked ?? !lock.checked;
		lock.checked = check;
	}

	_find_selection(selection: any, search: any): any {
		let found;
		if (!Array.isArray(selection) && !selection.apply) {
			for (const sel of Object.values(selection)) {
				found = this._find_selection(sel, search);
				if (found) break;
			}
		} else if (selection === search) found = selection;

		return found;
	}

	async _randomizeName() {
		const html = this.element,
			desc: string[] = ['', '', ''];
		let generators;
		if (!generators)
			generators = app._pick_selection(names.references[(html.find('#generator') as JQuery<HTMLInputElement>)[0].value]);
		app.updateNameBoxes(generators);

		const explanation = html.find('#explanation');

		for (let i = 0; i < 3; i++) {
			const generator = generators[i];
			const id = `name${i + 1}`;
			const checked = (html.find(`#${id} label input`) as JQuery<HTMLInputElement>)[0].checked;
			const hidden = (html.find(`#${id}`) as JQuery<HTMLInputElement>).hasClass('hide');

			if (hidden) {
				(html.find(`input[name=${id}]`) as JQuery<HTMLInputElement>)[0].value = '';
				desc[i] = '';
			} else if (!checked) {
				const gen = await generator.get();
				(html.find(`input[name=${id}]`) as JQuery<HTMLInputElement>)[0].value = gen[0];
				desc[i] = gen[1];
			}
		}
		if (!desc[0] && !desc[1] && !desc[2]) explanation[0].innerText = '...';
		else explanation[0].innerText = desc.join(' ');
	}

	_pick_selection(selection: any) {
		const list: any[] = [];
		const map = (selection: any) => {
			if (!Array.isArray(selection)) {
				for (const sel of Object.values(selection)) map(sel);
				return;
			}
			list.push(selection);
		};
		map(selection);
		const selected = pick(list);

		return selected;
	}

	getCheckBox(name: string): boolean {
		return (this.element.find(`:checkbox[for=${name}]`) as JQuery<HTMLInputElement>)[0].checked;
	}

	_renderCharacterGenerator(app: CharacterGenerator, html: JQuery, data: typeof this.data) {
		async function load_images(user_dir: string) {
			async function get_images(target: string): Promise<string[]> {
				const data = await FilePicker.browse('data', target, {
					extensions: ['.apng', '.avif', '.bmp', '.gif', '.jpg', '.jpeg', '.png', '.svg', '.tiff', '.webp'],
				});
				const files: string[] = data.files;

				// Recursevely search in subfolders as well
				for (const dir of data.dirs) {
					for (const file of await get_images(dir)) files.push(file);
				}

				return files;
			}
			function get_tags(imgs: string[]) {
				const tags: string[] = [];
				const file_pattern = /.+[\/](.+)/;
				const tag_pattern = /[^_.]+/g;
				imgs.forEach((file) => {
					const file_name = file_pattern.exec(file);
					let match: RegExpExecArray | null = null;
					if (file_name)
						while ((match = tag_pattern.exec(file_name[1]))) {
							if (!tags.includes(match[0]) && !['jpg', 'webp', 'png'].includes(match[0]) && isNaN(+match[0]))
								tags.push(match[0]);
						}
				});
				return tags;
			}
			let files: string[];
			try {
				files = await get_images(user_dir);
			} catch {
				warn(`No images found in ${user_dir}`);
				files = [];
			}
			let tokens: string[];
			try {
				tokens = await get_images(user_dir + '/tokens');
			} catch {
				tokens = [];
			}
			// Remove tokens from portraits, because of subfolder search
			for (const token of tokens) {
				const idx = files.indexOf(token);
				if (idx !== -1) files.splice(files.indexOf(token), 1);
			}
			const tags = get_tags(files);
			return { tags, files, tokens };
		}
		function filter(tags: string[]) {
			const file_pattern = /.+[\/](.+)/;
			const tag_pattern = /[^_.]+/gi;
			const filtered_imgs: string[] = [];

			//const tags_found = Object.keys(portraitFilter.object.tags);
			portraitFilter.object.files.forEach((file) => {
				const file_name = file_pattern.exec(file);
				let checks = 0;
				let match: RegExpExecArray | null = null;
				if (file_name) {
					while ((match = tag_pattern.exec(file_name[1]))) {
						const key = match[0].toLowerCase();
						if (tags.includes(key)) checks++;
						//if (!tags_found.includes(match[0]) && !['jpg', 'webp', 'png'].includes(match[0])) tags_found.push(match[0]);
					}
				}

				if (checks === tags.length) filtered_imgs.push(file);
			});
			return filtered_imgs;
		}
		async function randomize() {
			sounds.dice.play();

			// Randomize Portrait
			if (!app.getCheckBox('portrait')) {
				const filters: string[] = [];
				Object.entries(portraitFilter.object.tags).forEach(([key, value]) => {
					if (value) filters.push(key);
				});
				const file = pick(filter(filters));
				(html.find('input[name=portrait]') as JQuery<HTMLInputElement>)[0].value = file ?? '';
				app._onSelectFile(file);
			}

			// Randomize Names
			await app._randomizeName();
		}

		// Resize the app everytime it renders
		app.position.height = 'auto';

		app.filepickers.push(
			new FilePicker({
				type: 'image',
				field: app.element.find('input[name=portrait]')[0],
				callback: () => {
					app._onSelectFile.bind(app);
					app._lock('portrait', true);
				},
				displayMode: 'tiles',
			})
		);
		html.find('.file-picker2[data-target=portrait]').on('click', (ev) => app.filepickers[0].render(true));
		const portraitFilter = new CharacterGeneratorPortraitFilter({});
		let images: Awaited<ReturnType<typeof load_images>> | undefined;
		const user_dir = DirectoryPicker.parse(game.settings.get(MODULE, 'portrait-directory')).current;
		const checks: { [key: string]: boolean } = {};
		portraitFilter.object = { tags: checks, files: [], size: 0 };
		html.find('#portrait-filter').on('click', (ev) => portraitFilter.render(true));
		if (user_dir) {
			load_images(user_dir).then((res) => {
				const tags = res.tags.sort((a, b) => {
					if (a > b) return 1;
					if (a < b) return -1;
					return 0;
				});

				tags.forEach((el) => (checks[el] = false));
				portraitFilter.object = { tags: checks, files: res.files, size: res.files.length };
				images = res;
			});
		}

		app._updateSheetOptions();
		html.find('#randomizer').on('click', randomize);
		html.find('#create').on('click', () => {
			const names: string[] = [];
			for (let i = 0; i < 3; i++) {
				const id = `name${i + 1}`;
				const hidden = (html.find(`#${id}`) as JQuery<HTMLInputElement>).hasClass('hide');
				if (!hidden) {
					const value = (html.find(`input[name=${id}]`) as JQuery<HTMLInputElement>)[0].value;
					if (value) names.push(value);
				}
			}
			if (names.length < 1) {
				ui.notifications.warn('Cant generate a character without a name.');
				return;
			}

			data.portrait = (html.find('input[name=portrait]') as JQuery<HTMLInputElement>)[0].value;
			if (images) {
				const regex = /.+\/(.+)\./;
				const portrait = regex.exec(data.portrait)?.[1];
				const token = images.tokens.find((token_file) => regex.exec(token_file)?.[1] === portrait);
				if (token) data.token = token;
			}

			const type = (html.find('select[name=type]') as JQuery<HTMLSelectElement>)[0].value;
			const folder = (html.find('select[name=folder]') as JQuery<HTMLSelectElement>)[0]?.value;
			const updateNames = (html.find('input[name=update-names]') as JQuery<HTMLInputElement>)[0]?.checked;
			const sheet = (html.find('select[name=sheet]') as JQuery<HTMLSelectElement>)[0]?.value;

			CharDraft.create(
				{
					names,
					portrait: data.portrait,
					token: data.token,
					type,
					folder,
					updateNames,
					sheet,
				},
				data.data
			);
		});
	}
}

export const app = new CharacterGenerator({});

Handlebars.registerHelper({ selectOptionsNoEscape: CharacterGenerator.selectOptionsNoEscape });
