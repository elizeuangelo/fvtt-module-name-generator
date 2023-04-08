import { app } from './menu.js';
const convertCR = (cr) => {
    if (cr >= 1)
        return cr;
    const conversion = {
        0.125: '1/8',
        0.25: '1/4',
        0.5: '1/2',
    };
    return conversion[cr];
};
export default function contextMenu(html, entryOptions) {
    entryOptions.push({
        name: 'Rename Character',
        icon: '<i class="fas fa-users-cog"></i>',
        callback: (li) => {
            const actor = game.actors.get(li[0].dataset.documentId ?? '');
            const data = mergeObject({}, app._defaultData);
            const name = actor.name.split(' ');
            data.name1 = name[0] ?? '';
            data.name2 = name.slice(1).join(' ');
            data.name3 = '';
            data.portrait = actor.img ?? '';
            data.token = actor.prototypeToken.texture.src ?? '';
            if (data.name1)
                data.locks.name1 = false;
            if (data.name2)
                data.locks.name2 = false;
            if (data.name3)
                data.locks.name3 = false;
            if (data.portrait)
                data.locks.portrait = true;
            if (actor.folder)
                data.folder = actor.folder.id;
            data.isTemplate = true;
            data.type = actor.type;
            data.data = actor.toObject();
            app.data = data;
            app.render(true);
        },
    });
}
