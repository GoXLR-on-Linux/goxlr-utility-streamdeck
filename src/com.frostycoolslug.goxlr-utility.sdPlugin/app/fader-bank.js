const faderBankAction = new Action('com.frostycoolslug.goxlr-utility.fader-bank');
const faderBankMonitors = {};
const faderBankSwitching = new Set();

const faderBankDefaults = {
    serial: '',
    bank1_name: 'STANDARD',
    bank2_name: 'EXTRA',
    bank1_button_color: '#007C91',
    bank2_button_color: '#9B3D91',
    update_goxlr_appearance: 'yes',
    use_a: 'yes',
    bank1_a: 'Mic',
    bank2_a: 'Game',
    use_b: 'yes',
    bank1_b: 'Chat',
    bank2_b: 'Console',
    use_c: 'yes',
    bank1_c: 'Music',
    bank2_c: 'LineIn',
    use_d: 'yes',
    bank1_d: 'System',
    bank2_d: 'Sample'
};

const faderChannelAppearance = {
    Mic: {label: 'Mic', short: 'MIC', faderColour: '00FFFF', scribbleColour: '00FFFF', icon: 'mic.png'},
    Chat: {label: 'Voice Chat', short: 'CHAT', faderColour: 'FF2800', scribbleColour: 'FF1D00', icon: 'person.png'},
    Music: {label: 'Music', short: 'MUSIC', faderColour: 'FFC300', scribbleColour: 'FFC300', icon: 'music.png'},
    System: {label: 'System', short: 'SYS', faderColour: '533CFF', scribbleColour: 'B2ABFF', icon: 'level.png'},
    Game: {label: 'Game', short: 'GAME', faderColour: '00E676', scribbleColour: '00E676', icon: 'scale.png'},
    Console: {label: 'Console', short: 'CONS', faderColour: 'FF4F81', scribbleColour: 'FF4F81', icon: 'headphone.png'},
    LineIn: {label: 'Line In', short: 'LINE', faderColour: '00B8D4', scribbleColour: '00B8D4', icon: 'level.png'},
    Sample: {label: 'Samples', short: 'SAMP', faderColour: 'FF8C00', scribbleColour: 'FF8C00', icon: 'music.png'},
    Headphones: {label: 'Headphones', short: 'PHONE', faderColour: '00AEEF', scribbleColour: '00AEEF', icon: 'headphone.png'},
    MicMonitor: {label: 'Mic Monitor', short: 'MON', faderColour: '00FFFF', scribbleColour: '00FFFF', icon: 'mic3.png'},
    LineOut: {label: 'Line Out', short: 'OUT', faderColour: '8D6E63', scribbleColour: '8D6E63', icon: 'level.png'}
};

const faderNames = ['A', 'B', 'C', 'D'];

function faderBankExternalStateChange() {
    for (let monitor of Object.values(faderBankMonitors)) {
        monitor.setDisplay();
    }
}

function normaliseFaderBankSettings(settings) {
    let result = Object.assign({}, faderBankDefaults, settings || {});
    if (!result.serial && status && status.mixers) {
        result.serial = Object.keys(status.mixers)[0] || '';
    }
    return result;
}

function selectedFaders(settings) {
    return faderNames.filter((fader) => settings[`use_${fader.toLowerCase()}`] !== 'no');
}

function getBankChannel(settings, bank, fader) {
    return settings[`bank${bank}_${fader.toLowerCase()}`];
}

function activeFaderBank(settings) {
    if (!status || !status.mixers || !status.mixers[settings.serial]) {
        return 0;
    }

    let faders = selectedFaders(settings);
    if (faders.length === 0) {
        return 0;
    }

    let faderStatus = status.mixers[settings.serial].fader_status;
    let bankOne = faders.every((fader) => faderStatus[fader] && faderStatus[fader].channel === getBankChannel(settings, 1, fader));
    let bankTwo = faders.every((fader) => faderStatus[fader] && faderStatus[fader].channel === getBankChannel(settings, 2, fader));

    if (bankOne) return 1;
    if (bankTwo) return 2;
    return 0;
}

async function applyFaderBank(settings, bank) {
    let commands = [];

    for (let fader of selectedFaders(settings)) {
        let channel = getBankChannel(settings, bank, fader);
        let appearance = faderChannelAppearance[channel] || {
            label: channel,
            short: channel,
            faderColour: 'FFFFFF',
            scribbleColour: 'FFFFFF',
            icon: ''
        };

        commands.push({SetFader: [fader, channel]});

        if (settings.update_goxlr_appearance !== 'no') {
            let scribble = `Scribble${faderNames.indexOf(fader) + 1}`;
            commands.push({SetScribbleText: [fader, appearance.label]});
            commands.push({SetScribbleIcon: [fader, appearance.icon]});
            commands.push({SetFaderColours: [fader, 'FFFFFF', appearance.faderColour]});
            commands.push({SetSimpleColour: [scribble, appearance.scribbleColour]});
        }
    }

    for (let command of commands) {
        await websocket.send_command(settings.serial, command);
    }
}

faderBankAction.onKeyUp(async ({context, payload}) => {
    let settings = normaliseFaderBankSettings(payload.settings);
    if (!status || !status.mixers || !status.mixers[settings.serial] || selectedFaders(settings).length === 0) {
        $SD.showAlert(context);
        return;
    }

    if (faderBankSwitching.has(context)) {
        return;
    }

    faderBankSwitching.add(context);
    let bank = activeFaderBank(settings) === 1 ? 2 : 1;
    try {
        await applyFaderBank(settings, bank);
        if (faderBankMonitors[context]) {
            faderBankMonitors[context].setDisplay();
        }
        $SD.showOk(context);
    } catch (error) {
        console.error('Unable to switch GoXLR fader bank', error);
        $SD.showAlert(context);
    } finally {
        faderBankSwitching.delete(context);
    }
});

faderBankAction.onDidReceiveSettings(({context, payload}) => {
    createFaderBankMonitor(context, payload.settings);
});

faderBankAction.onWillAppear(({context, payload}) => {
    createFaderBankMonitor(context, payload.settings);
});

faderBankAction.onWillDisappear(({context}) => {
    if (faderBankMonitors[context]) {
        faderBankMonitors[context].destroy();
        delete faderBankMonitors[context];
    }
    faderBankSwitching.delete(context);
});

function createFaderBankMonitor(context, rawSettings) {
    let settings = normaliseFaderBankSettings(rawSettings);
    if (faderBankMonitors[context]) {
        faderBankMonitors[context].destroy();
    }
    faderBankMonitors[context] = new FaderBankMonitor(context, settings);
    faderBankMonitors[context].setDisplay();
}

class FaderBankMonitor {
    context = undefined;
    settings = undefined;
    faderPath = undefined;
    #eventHandle = () => {};

    constructor(context, settings) {
        this.context = context;
        this.settings = settings;
        this.faderPath = `/mixers/${settings.serial}/fader_status`;

        let self = this;
        this.#eventHandle = function(event) {
            if (event.patch.path.startsWith(self.faderPath)) {
                self.setDisplay();
            }
        };
        eventTarget.addEventListener('patch', this.#eventHandle);
    }

    destroy() {
        eventTarget.removeEventListener('patch', this.#eventHandle);
    }

    setDisplay() {
        if (!status || !status.mixers || !status.mixers[this.settings.serial]) {
            $SD.setImage(this.context, RedIcon);
            return;
        }

        let bank = activeFaderBank(this.settings);
        let mixer = status.mixers[this.settings.serial];
        let background = bank === 1 ? this.settings.bank1_button_color :
            (bank === 2 ? this.settings.bank2_button_color : '#343A40');
        let bankName = bank === 1 ? this.settings.bank1_name :
            (bank === 2 ? this.settings.bank2_name : 'MIXED');
        let rows = [];

        for (let fader of selectedFaders(this.settings)) {
            let channel = mixer.fader_status[fader] ? mixer.fader_status[fader].channel : '?';
            let appearance = faderChannelAppearance[channel] || {short: channel};
            rows.push(`${fader}  ${appearance.short}`);
        }

        let lineHeight = rows.length > 3 ? 19 : 22;
        let startY = rows.length > 3 ? 65 : 70;
        let rowMarkup = rows.map((row, index) =>
            `<text x="72" y="${startY + index * lineHeight}" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="${rows.length > 3 ? 14 : 16}" font-weight="700">${escapeFaderBankXml(row)}</text>`
        ).join('');

        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">` +
            `<rect width="144" height="144" rx="12" fill="${escapeFaderBankXml(background)}"/>` +
            `<rect x="7" y="7" width="130" height="130" rx="9" fill="none" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="3"/>` +
            `<text x="72" y="28" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="13" font-weight="700">BANK ${bank || '?'}</text>` +
            `<text x="72" y="49" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="16" font-weight="800">${escapeFaderBankXml(bankName)}</text>` +
            rowMarkup + `</svg>`;

        let svgBase64 = btoa(unescape(encodeURIComponent(svg)));
        $SD.setImage(this.context, `data:image/svg+xml;base64,${svgBase64}`);
    }
}

function escapeFaderBankXml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;'
    })[character]);
}
