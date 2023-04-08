import { log } from './module/utils.js';
log('Initializing...');
async function ready() {
    log('Firing "ready" hook...');
    if (!game.user.hasPermission('ACTOR_CREATE')) {
        log('User dont have permission to create actors.');
        log('Terminated.');
        return;
    }
    const { default: contextMenu } = await import('./module/contextmenu.js');
    const { CharDraft } = await import('./module/chardraft.js');
    const { app } = await import('./module/menu.js');
    const { registerSettings, getDefaultFolder } = await import('./module/settings.js');
    registerSettings();
    window.npcGen = {
        app,
        create: CharDraft.create,
    };
    Hooks.on('renderActorDirectory', (_app, html) => {
        const btn = jQuery(`<button class="create-character-btn" type="button"><i class="fas fa-users-cog"></i> Create Character</button>`);
        html.find('.create-character-btn').remove();
        html.find('.directory-footer').append(btn);
        btn.on('click', (ev) => {
            ev.preventDefault();
            app._defaultData.folder = getDefaultFolder();
            app.data = mergeObject({}, app._defaultData);
            app.render(true);
        });
    });
    Hooks.on('getActorDirectoryEntryContext', contextMenu);
    Hooks.on('renderCharacterGenerator', app._renderCharacterGenerator);
    ui.actors.render(true);
    log('Initialized.');
}
if (!game.ready)
    Hooks.once('ready', ready);
else
    ready();
