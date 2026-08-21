const faderBankAction = new Action('com.frostycoolslug.goxlr-utility.fader-bank');
const faderBankMonitors = {};
const faderBankSwitching = new Set();

const faderBankDefaults = {
    serial: '',
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
    Mic: {label: 'Mic', faderColour: '00FFFF', scribbleColour: '00FFFF', icon: 'mic.png'},
    Chat: {label: 'Voice Chat', faderColour: 'FF2800', scribbleColour: 'FF1D00', icon: 'person.png'},
    Music: {label: 'Music', faderColour: 'FFC300', scribbleColour: 'FFC300', icon: 'music.png'},
    System: {label: 'System', faderColour: '533CFF', scribbleColour: 'B2ABFF', icon: 'level.png'},
    Game: {label: 'Game', faderColour: '00E676', scribbleColour: '00E676', icon: 'scale.png'},
    Console: {label: 'Console', faderColour: 'FF4F81', scribbleColour: 'FF4F81', icon: 'headphone.png'},
    LineIn: {label: 'Line In', faderColour: '00B8D4', scribbleColour: '00B8D4', icon: 'level.png'},
    Sample: {label: 'Samples', faderColour: 'FF8C00', scribbleColour: 'FF8C00', icon: 'music.png'},
    Headphones: {label: 'Headphones', faderColour: '00AEEF', scribbleColour: '00AEEF', icon: 'headphone.png'},
    MicMonitor: {label: 'Mic Monitor', faderColour: '00FFFF', scribbleColour: '00FFFF', icon: 'mic3.png'},
    LineOut: {label: 'Line Out', faderColour: '8D6E63', scribbleColour: '8D6E63', icon: 'level.png'}
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
        if (bank === 0) {
            $SD.setImage(this.context, RedIcon);
            return;
        }

        $SD.setImage(this.context);
        $SD.setState(this.context, bank === 2 ? 1 : 0);
    }
}
