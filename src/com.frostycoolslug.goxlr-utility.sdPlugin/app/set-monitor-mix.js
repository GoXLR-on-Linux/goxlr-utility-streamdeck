const setMonitorMixAssignment = new Action('com.frostycoolslug.goxlr-utility.set-monitor-mix');

/// Activators
setMonitorMixAssignment.onKeyUp(({action, context, device, event, payload}) => {
    let serial = payload.settings.serial;
    let mixTarget = payload.settings.mix;
    sendMonitorMix(serial, mixTarget);
});

/// IPC Commands
function sendMonitorMix(serial, target) {
    websocket.send_command(serial, {
        "SetMonitorMix": target
    });
}
