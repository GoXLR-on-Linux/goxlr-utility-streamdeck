/// <reference path="../../../../libs/js/property-inspector.js" />
/// <reference path="../../../../libs/js/utils.js" />

const websocket = new Websocket();
let pluginSettings;

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
    Utils.setFormValue(pluginSettings, document.querySelector('#fader-bank-form'));
    saveSettings();
    websocket.disconnect();
}

function saveSettings() {
    pluginSettings = Utils.getFormValue(document.querySelector('#fader-bank-form'));
    $PI.setSettings(pluginSettings);
}

document.querySelector('#fader-bank-form').addEventListener('change', saveSettings);
document.querySelector('#fader-bank-form').addEventListener('input', Utils.debounce(200, saveSettings));
