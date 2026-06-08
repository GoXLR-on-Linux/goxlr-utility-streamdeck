const setMonitorMixAssignment = new Action('com.frostycoolslug.goxlr-utility.set-monitor-mix');
const monitorMixMonitors = {};

let currentMix = null;

// External handlers for if the device disappears, or we're not connected..
function monitorMixExternalStateChange() {
    // We should never fully remove the monitors, so that when the connection comes back we can reestablish them..
    for (let monitor of Object.keys(monitorMixMonitors)) {
        monitorMixMonitors[monitor].setState();
    }
}

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

    if (status.mixers[serial].levels.output_monitor !== mixTarget) {
        sendMonitorMix(serial, mixTarget);
    } else {
        $SD.setState(context, 0);
    }
});

/// Configuration
setMonitorMixAssignment.onDidReceiveSettings(({action, event, context, device, payload}) => {
    createMonitorMixMonitor(context, payload.settings);
});

setMonitorMixAssignment.onWillAppear(({action, event, context, device, payload}) => {
    createMonitorMixMonitor(context, payload.settings);
});

setMonitorMixAssignment.onWillDisappear(({action, event, context, device, payload}) => {
    monitorMixMonitors[context].destroy();
    delete monitorMixMonitors[context];
});

function createMonitorMixMonitor(context, settings) {
    let serial = settings.serial;
    let mix = settings.mix;
    let mode = settings.mode;

    if (monitorMixMonitors[context] !== undefined) {
        if (!monitorMixMonitors[context].equal(context, serial, mix)) {
            monitorMixMonitors[context].destroy();
            monitorMixMonitors[context] = new MonitorMixMonitor(context, settings.serial, mix, mode);
        }
    } else {
        monitorMixMonitors[context] = new MonitorMixMonitor(context, settings.serial, mix, mode);
    }
    monitorMixMonitors[context].setState();
}

class MonitorMixMonitor {
    // These are all arguably private, but because they're all used in the event scope, the event needs
    // access to them.
    context = undefined;

    serial = undefined;
    mix = undefined;

    monitor = undefined;
    device = undefined;

    #event_handle = () => {};

    constructor(context, serial, mix, mode) {
        this.context = context;
        this.serial = serial;
        this.mix = mix;
        this.mode = mode;

        this.monitor = `/mixers/${serial}/levels/output_monitor`;
        this.device = `/mixers/${serial}`

        let self = this;
        this.#event_handle = function(e) {
            self.#onEvent(self, e);
        }
        eventTarget.addEventListener("patch", this.#event_handle);
    }

    equal(context, serial, mix) {
        return (context === this.context && serial === this.serial && mix === this.mix)
    }

    destroy() {
        eventTarget.removeEventListener("patch", this.#event_handle);
    }

    #onEvent(self, event) {
        let patch = event.patch;

        //if (patch.path === self.device || patch.path === self.monitor) {
            self.setState();
        //}
    }

    setState() {
        console.log("Checking State..");
        if (status === undefined || status.mixers[this.serial] === undefined) {
            $SD.setImage(this.context, RedIcon);
            return;
        }

        // Don't try anything if we're a mini..
        if (status.mixers[this.serial].effects === null) {
            $SD.setImage(this.context, RedIcon);
            return;
        }

        let value = status.mixers[this.serial].levels.output_monitor;

        let state = (value === this.mix) ? 0 : 1;
 
        $SD.setImage(this.context);
        $SD.setState(this.context, state);
    }
}

/// IPC Commands
function sendMonitorMix(serial, target) {
    websocket.send_command(serial, {
        "SetMonitorMix": target
    });
}
