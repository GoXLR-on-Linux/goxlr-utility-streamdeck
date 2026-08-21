/// <reference path="../../../../libs/js/property-inspector.js" />
/// <reference path="../../../../libs/js/utils.js" />

const websocket = new Websocket();
let pluginSettings;
let initialising = true;

const inspectorDefaults = {
    serial: '',
    update_goxlr_appearance: 'yes',
    use_a: 'yes', bank1_a: 'Mic', bank2_a: 'Game',
    use_b: 'yes', bank1_b: 'Chat', bank2_b: 'Console',
    use_c: 'yes', bank1_c: 'Music', bank2_c: 'LineIn',
    use_d: 'yes', bank1_d: 'System', bank2_d: 'Sample'
};

const channelOptions = [
    ['Mic', 'Mic'],
    ['Chat', 'Chat'],
    ['Music', 'Music'],
    ['System', 'System'],
    ['Game', 'Game'],
    ['Console', 'Console'],
    ['LineIn', 'Line In'],
    ['Sample', 'Samples'],
    ['Headphones', 'Headphones'],
    ['MicMonitor', 'Mic Monitor'],
    ['LineOut', 'Line Out']
];

function runPlugin() {
    let mixers = Object.keys(device.mixers || {});
    if (mixers.length === 0) {
        document.querySelector('#no-mixers').classList.remove('hidden');
        return;
    }

    let serialList = document.querySelector('#mixers');
    serialList.innerHTML = '';
    for (let serial of mixers) {
        let option = document.createElement('option');
        option.text = serial;
        option.value = serial;
        serialList.add(option);
    }
    serialList.disabled = false;
    if (mixers.length > 1) {
        document.querySelector('#mixer').classList.remove('hidden');
    }

    for (let select of document.querySelectorAll('.channel-select')) {
        select.innerHTML = '';
        for (let [value, label] of channelOptions) {
            let option = document.createElement('option');
            option.value = value;
            option.text = label;
            select.add(option);
        }
        select.value = select.dataset.default;
    }

    document.querySelector('#settings').classList.remove('hidden');
    pluginSettings = Object.assign({}, inspectorDefaults, pluginSettings || {});
    if (!pluginSettings.serial) {
        pluginSettings.serial = mixers[0];
    }
    Utils.setFormValue(pluginSettings, document.querySelector('#fader-bank-form'));
    $PI.setSettings(pluginSettings);
    initialising = false;
    websocket.disconnect();
}

function saveSettings() {
    pluginSettings = Utils.getFormValue(document.querySelector('#fader-bank-form'));
    $PI.setSettings(pluginSettings);
}

const saveSettingsDebounced = Utils.debounce(200, saveSettings);
document.querySelector('#fader-bank-form').addEventListener('change', () => {
    if (!initialising) saveSettings();
});
document.querySelector('#fader-bank-form').addEventListener('input', () => {
    if (!initialising) saveSettingsDebounced();
});
