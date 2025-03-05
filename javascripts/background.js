importScripts('parseuri.js', 'utils.js');

function getHotkeys(url, callback) {
    getSetsForCurrentUrl(url, function (sets) {
        var hotkeys = [];

        for (var i = 0; i < sets.length; i++) {
            if (!sets[i].hotkey) {
                continue;
            }

            hotkeys.push(sets[i].hotkey);
        }

        callback(hotkeys);
    });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'gethotkeys') {
        getHotkeys(request.url, function (hotkeys) {
            sendResponse(hotkeys);
        });
        return true;
    }
    else if (request.action === 'hotkey') {
        getSetsForCurrentUrl(request.url, function (sets) {
            for (var i = 0; i < sets.length; i++) {
                if (sets[i].hotkey == request.code) {
                    sendResponse(sets[i]);
                    return;
                }
            }
            sendResponse(null);
        });
        return true;
    }
});