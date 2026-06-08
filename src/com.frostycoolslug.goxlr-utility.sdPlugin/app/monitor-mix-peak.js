const monitorMixPeak = new Action('com.frostycoolslug.goxlr-utility.monitor-mix-peak');

let currentMix = null;
/// Activators
monitorMixPeak.onKeyDown(({action, context, device, event, payload}) => {
    let serial = payload.settings.serial;
    let mixTarget = payload.settings.mix;
    currentMix = status.mixers[serial].levels.output_monitor;
    sendMonitorMix(serial, mixTarget);
});

monitorMixPeak.onKeyUp(({action, context, device, event, payload}) => {
    let serial = payload.settings.serial;
    let mixTarget = payload.settings.mix;
    sendMonitorMix(serial, currentMix);
    currentMix = null;
});

/// IPC Commands
function sendMonitorMix(serial, target) {
    websocket.send_command(serial, {
        "SetMonitorMix": target
    });
}
