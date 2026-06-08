const setMonitorMixAssignment = new Action('com.frostycoolslug.goxlr-utility.set-monitor-mix');

let currentMix = null;

/// Activators
setMonitorMixAssignment.onKeyDown(({action, context, device, event, payload}) => {
    let mode = payload.settings.mode;
    if (mode === "peak") {
        let serial = payload.settings.serial;
        let mixTarget = payload.settings.mix;
        currentMix = status.mixers[serial].levels.output_monitor;
        sendMonitorMix(serial, mixTarget);
    }
});

setMonitorMixAssignment.onKeyUp(({action, context, device, event, payload}) => {
    let mode = payload.settings.mode;
    let mixTarget = null;
    let serial = payload.settings.serial;

    if (mode === "peak") {
        mixTarget = currentMix;
        currentMix = null;
    } else {
        mixTarget = payload.settings.mix;
    }
        
    sendMonitorMix(serial, mixTarget);
});

/// IPC Commands
function sendMonitorMix(serial, target) {
    websocket.send_command(serial, {
        "SetMonitorMix": target
    });
}
