import { pick, sounds } from './utils.js';
import { CharDraft } from './chardraft.js';
import * as names from './names.js';
import { FILE_PATH, MODULE, TITLE } from './settings.js';
import DirectoryPicker from '../lib/DirectoryPicker.js';
class CharacterGeneratorPortraitFilter extends FormApplication {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: 'namegen-portrait',
            title: 'Portrait Filter',
            classes: ['sheet'],
            template: FILE_PATH + '/templates/tags.html',
            width: 600,
        });
    }
    async getData(_options) {
        return this.object;
    }
    async _updateObject(_event, formData) {
        this.object.tags = formData;
    }
}
export class CharacterGenerator extends FormApplication {
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
        const selectOptions = [];
        if (choices instanceof Array) {
            for (const choice of choices) {
                const name = String(choice[nameAttr]);
                let label = choice[labelAttr];
                if (localize)
                    label = game.i18n.localize(label);
                selectOptions.push({ name, label });
            }
        }
        else {
            for (const choice of Object.entries(choices)) {
                const [key, value] = inverted ? choice.reverse() : choice;
                const name = String(nameAttr ? value[nameAttr] : key);
                let label = labelAttr ? value[labelAttr] : value;
                if (localize)
                    label = game.i18n.localize(label);
                selectOptions.push({ name, label });
            }
        }
        if (sort)
            selectOptions.sort((a, b) => a.label.localeCompare(b.label));
        if (blank !== null) {
            const label = localize ? game.i18n.localize(blank) : blank;
            selectOptions.unshift({ name: '', label });
        }
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
        data: {},
        folders: [],
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
    async getData(_options) {
        this.data.folders = game.folders.filter((f) => f.type === 'Actor' && f.displayed);
        this.data.hasFolders = this.data.folders.length >= 1;
        return this.data;
    }
    updateNameBoxes(generators) {
        const checkboxes = this.element.find('#names :checkbox');
        for (let i = 0; i < checkboxes.length; i++) {
            const show = generators.length > i;
            const checkbox = checkboxes[i];
            const target = this.element.find(`#${checkbox.getAttribute('for')}`);
            if (!checkbox.checked && !show) {
                if (!target.hasClass('hide'))
                    target.addClass('hide');
            }
            else if (target.hasClass('hide'))
                target.removeClass('hide');
        }
        for (let i = 0; i < generators.length; i++) {
            const input = this.element.find(`input[name=name${i + 1}]`);
            input[0].placeholder = generators[i].label;
        }
    }
    updateSelectBox(name, result) {
        const box = this.element.find(`select[name=${name}]+span.npc-info`);
        if (box.length) {
            box.text(result);
        }
    }
    async _updateObject(_event, formData) { }
    _onChangeRange(event) {
        const field = event.target?.parentElement.querySelector('.range-value');
        if (field) {
            if (field.tagName === 'INPUT') {
                field.value = event.target?.value;
                return;
            }
            field.innerHTML = event.target?.value;
        }
    }
    async _onChangeInput(event) {
        const el = event.currentTarget;
        const prev = el.previousElementSibling;
        if (prev && prev.children[0]?.classList.contains('lock-btn')) {
            prev.children[0].checked = false;
        }
        if (el.tagName === 'INPUT' && el.name === 'portrait') {
            this._onSelectFile(el.value);
            if (el.value)
                this._lock('portrait', true);
        }
        else if (el.id === 'generator') {
            const generators = names.references[el.value];
            const group = !Array.isArray(generators);
            if (!group) {
                this.updateNameBoxes(generators);
            }
            this._randomizeName();
        }
        if (el.type === 'color' && el.dataset.edit)
            this._onChangeColorPicker(event);
        else if (el.type === 'range')
            this._onChangeRange(event);
        if (this.options.submitOnChange) {
            return this._onSubmit(event);
        }
    }
    _onSelectFile(selection, filePicker) {
        const el = this.element.find('div.picture img[title=Portrait]');
        el[0].src = selection || 'icons/svg/circle.svg';
    }
    _lock(input, checked) {
        const lock = this.element.find(`:checkbox[for=${input}]`)[0];
        if (!lock)
            return;
        const check = checked ?? !lock.checked;
        lock.checked = check;
    }
    _find_selection(selection, search) {
        let found;
        if (!Array.isArray(selection) && !selection.apply) {
            for (const sel of Object.values(selection)) {
                found = this._find_selection(sel, search);
                if (found)
                    break;
            }
        }
        else if (selection === search)
            found = selection;
        return found;
    }
    async _randomizeName() {
        const html = this.element, desc = ['', '', ''];
        let generators;
        if (!generators)
            generators = app._pick_selection(names.references[html.find('#generator')[0].value]);
        app.updateNameBoxes(generators);
        const explanation = html.find('#explanation');
        for (let i = 0; i < 3; i++) {
            const generator = generators[i];
            const id = `name${i + 1}`;
            const checked = html.find(`#${id} label input`)[0].checked;
            const hidden = html.find(`#${id}`).hasClass('hide');
            if (hidden) {
                html.find(`input[name=${id}]`)[0].value = '';
                desc[i] = '';
            }
            else if (!checked) {
                const gen = await generator.get();
                html.find(`input[name=${id}]`)[0].value = gen[0];
                desc[i] = gen[1];
            }
        }
        if (!desc[0] && !desc[1] && !desc[2])
            explanation[0].innerText = '...';
        else
            explanation[0].innerText = desc.join(' ');
    }
    _pick_selection(selection) {
        const list = [];
        const map = (selection) => {
            if (!Array.isArray(selection)) {
                for (const sel of Object.values(selection))
                    map(sel);
                return;
            }
            list.push(selection);
        };
        map(selection);
        const selected = pick(list);
        return selected;
    }
    getCheckBox(name) {
        return this.element.find(`:checkbox[for=${name}]`)[0].checked;
    }
    _renderCharacterGenerator(app, html, data) {
        async function load_images(user_dir) {
            async function get_images(target) {
                const data = await FilePicker.browse('data', target, {
                    extensions: ['.apng', '.avif', '.bmp', '.gif', '.jpg', '.jpeg', '.png', '.svg', '.tiff', '.webp'],
                });
                const files = data.files;
                for (const dir of data.dirs) {
                    for (const file of await get_images(dir))
                        files.push(file);
                }
                return files;
            }
            function get_tags(imgs) {
                const tags = [];
                const file_pattern = /.+[\/](.+)/;
                const tag_pattern = /[^_.]+/g;
                imgs.forEach((file) => {
                    const file_name = file_pattern.exec(file);
                    let match = null;
                    if (file_name)
                        while ((match = tag_pattern.exec(file_name[1]))) {
                            if (!tags.includes(match[0]) && !['jpg', 'webp', 'png'].includes(match[0]) && isNaN(+match[0]))
                                tags.push(match[0]);
                        }
                });
                return tags;
            }
            const files = await get_images(user_dir);
            const tokens = await get_images(user_dir + '/tokens');
            for (const token of tokens) {
                const idx = files.indexOf(token);
                if (idx !== -1)
                    files.splice(files.indexOf(token), 1);
            }
            const tags = get_tags(files);
            return { tags, files, tokens };
        }
        function filter(tags) {
            const file_pattern = /.+[\/](.+)/;
            const tag_pattern = /[^_.]+/gi;
            const filtered_imgs = [];
            portraitFilter.object.files.forEach((file) => {
                const file_name = file_pattern.exec(file);
                let checks = 0;
                let match = null;
                if (file_name) {
                    while ((match = tag_pattern.exec(file_name[1]))) {
                        const key = match[0].toLowerCase();
                        if (tags.includes(key))
                            checks++;
                    }
                }
                if (checks === tags.length)
                    filtered_imgs.push(file);
            });
            return filtered_imgs;
        }
        async function randomize() {
            sounds.dice.play();
            if (!app.getCheckBox('portrait')) {
                const filters = [];
                Object.entries(portraitFilter.object.tags).forEach(([key, value]) => {
                    if (value)
                        filters.push(key);
                });
                const file = pick(filter(filters));
                html.find('input[name=portrait]')[0].value = file ?? '';
                app._onSelectFile(file);
            }
            await app._randomizeName();
        }
        app.position.height = 'auto';
        app.filepickers.push(new FilePicker({
            type: 'image',
            field: app.element.find('input[name=portrait]')[0],
            callback: () => {
                app._onSelectFile.bind(app);
                app._lock('portrait', true);
            },
            displayMode: 'tiles',
        }));
        html.find('.file-picker2[data-target=portrait]').on('click', (ev) => app.filepickers[0].render(true));
        const portraitFilter = new CharacterGeneratorPortraitFilter({});
        let images;
        const user_dir = DirectoryPicker.parse(game.settings.get(MODULE, 'portrait-directory')).current;
        const checks = {};
        portraitFilter.object = { tags: checks, files: [], size: 0 };
        html.find('#portrait-filter').on('click', (ev) => portraitFilter.render(true));
        if (user_dir) {
            load_images(user_dir).then((res) => {
                const tags = res.tags.sort((a, b) => {
                    if (a > b)
                        return 1;
                    if (a < b)
                        return -1;
                    return 0;
                });
                tags.forEach((el) => (checks[el] = false));
                portraitFilter.object = { tags: checks, files: res.files, size: res.files.length };
                images = res;
            });
        }
        html.find('#randomizer').on('click', randomize);
        html.find('#create').on('click', () => {
            const names = [];
            for (let i = 0; i < 3; i++) {
                const id = `name${i + 1}`;
                const hidden = html.find(`#${id}`).hasClass('hide');
                if (!hidden) {
                    const value = html.find(`input[name=${id}]`)[0].value;
                    if (value)
                        names.push(value);
                }
            }
            if (names.length < 1) {
                ui.notifications.warn('Cant generate a character without a name.');
                return;
            }
            data.portrait = html.find('input[name=portrait]')[0].value;
            if (images) {
                const regex = /.+\/(.+)\./;
                const portrait = regex.exec(data.portrait)?.[1];
                const token = images.tokens.find((token_file) => regex.exec(token_file)?.[1] === portrait);
                if (token)
                    data.token = token;
            }
            const type = html.find('select[name=type]')[0].value;
            const folder = html.find('select[name=folder]')[0]?.value;
            const updateNames = html.find('input[name=update-names]')[0]?.checked;
            CharDraft.create({
                names,
                portrait: data.portrait,
                token: data.token,
                type,
                folder,
                updateNames,
            }, data.data);
        });
    }
}
export const app = new CharacterGenerator({});
Handlebars.registerHelper({ selectOptionsNoEscape: CharacterGenerator.selectOptionsNoEscape });
