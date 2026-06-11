// Set an initial red icon, then replace it once the document has loaded it
var RedIcon = "data:image/png;base64,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";
const img = document.querySelector("#img-red");
img.decode().then(() => {
    RedIcon = getBase64("#img-red");
});

$SD.onConnected(({actionInfo, appInfo, connection, messageType, port, uuid}) => {
    console.log("Stream Deck Connected, Fetching Settings");
    $SD.getGlobalSettings();
});

$SD.onDidReceiveGlobalSettings((data => {
    console.log("Global Settings Received, establishing Utility Connection")
    if (websocket.is_connected()) {
        console.log("Utility Connection Already established, disconnecting..");
        websocket.disconnect();

        // We should return here, onClose will trigger a reconnect automatically
        return;
    }

    let settings = data.payload.settings;
    if (settings['address'] === undefined) {
        console.log("Address not defined, Retrying..");
        retryConnection();
        return;
    }

    websocket.set_address("ws://" + settings['address'] + "/api/websocket");
    websocket.onClose(() => {
        console.log("Utility Connection Lost");
        utilityOffline();
        retryConnection();
    })

    console.log("Starting Connection");
    websocket.connect().then(() => websocket.send_daemon_command("GetStatus").then((response) => {
        console.log("Connected to the GoXLR Utility!")
        status = response.Status;
        utilityOnline();
        websocket.set_patch_method(patchStatus);
    }).catch((e) => {
        console.log(`Failed to Connect to the GoXLR Utility: ${e}`)
        retryConnection();
    })).catch(() => {
        console.log("Failed to Connect to the GoXLR Utility")
        retryConnection();
    });
}));

/// Utility
function utilityOffline() {
    // Clear the Status Object...
    status = undefined;

    // Inform any active commands..
    routingExternalStateChange();
    muteToggleExternalStateChange();
    fxToggleExternalStateChange();
    fxBankExternalStateChange();
    profileExternalStateChange();
    volumeMonitorExternalStateChange();
    encoderVolumeMonitorExternalStateChange();
    basicExternalStateChange();
    mixAssignmentExternalStateChange();
    monitorMixExternalStateChange();
}

function utilityOnline() {
    // Inform any active commands..
    routingExternalStateChange();
    muteToggleExternalStateChange();
    fxToggleExternalStateChange();
    fxBankExternalStateChange();
    profileExternalStateChange();
    volumeMonitorExternalStateChange();
    encoderVolumeMonitorExternalStateChange();
    basicExternalStateChange();
    mixAssignmentExternalStateChange();
    monitorMixExternalStateChange();
}

function retryConnection() {
    // This attempts to reconnect to the utility every 100ms after the last failure.
    if (!websocket.is_connected()) {
        setTimeout(() => {
            console.log("Fetching Global Settings..");
            $SD.getGlobalSettings()
        }, 1000);
    } else {
        console.log("Websocket still connected?");
    }
}

function patchStatus(patches) {
    if (status === undefined) {
        // This normally happens if the Util has *JUST* started up, and the websocket is present prior
        // to the first device being detected. GetStatus needs to happen first, and be stored prior to
        // handling any patches on it.
        return;
    }

    for (let patch of patches) {
        jsonpatch.applyOperation(status, patch, true, true, false);

        let event = new CustomEvent("patch");
        event.patch = patch;
        eventTarget.dispatchEvent(event);
    }
}

function getBase64(imgId) {
    let c = document.createElement('canvas');
    let img = document.querySelector(imgId);

    c.height = img.naturalHeight;
    c.width = img.naturalWidth;

    let context = c.getContext('2d');
    context.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL();
}
