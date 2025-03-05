var FILTER_BY_DOMAIN = 'domain';
var FILTER_BY_PATH = 'path';
var FILTER_BY_FULL = 'full';

function fits(current, storage, filterValue) {
    current = current.toLowerCase();
    storage = storage.toLowerCase();

    var url1 = parseUri(current);
    var url2 = parseUri(storage);
	
    if (storage === '*') {
        return true;
		
    } else if (filterValue === FILTER_BY_DOMAIN) {
        return url1.host === url2.host;

    } else if (filterValue === FILTER_BY_PATH) {
        return (url1.protocol + url1.host + url1.path) == (url2.protocol + url2.host + url2.path);
        
    } else if (filterValue === FILTER_BY_FULL) {
        return current == storage;
        
    } else {
        console.error('WebFormFiller: filter value is wrong: ' + filterValue);
        return true;
    }
}

function getSetsForCurrentUrl(url, callback) {
    chrome.storage.local.get(null, function(items){
        var sets = [];
        var filterValue = items.filter || FILTER_BY_DOMAIN;
        
        for (var key in items) {
            if (key === 'filter') continue;

            var settings = items[key];

            if (!settings || !settings.url) {
                continue;
            }

            if (fits(url, settings.url, filterValue)) {
                settings.key = key;
                sets.push(settings);
            }
        }

        callback(sets);
    });
}
