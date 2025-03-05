var tab_url;

function getAllSets(callback) {
    chrome.storage.local.get(null, function(items){
        var sets = [];

        for (var key in items) {
            if (key == 'filter') {
                continue;
            }
            
            var settings = items[key];
            settings.key = key;
            sets.push(settings);
        }

        callback(sets);
    });
}

function sortBy(property) {
    var sortOrder = 1;
    if (property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a, b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

function refreshSetsList(url) {
    var table = $('#sets');
    
    table.find('tbody tr').remove();
    
    if (table.hasClass('allsets')) {
        getAllSets(function(sets){
            sets.sort(sortBy('url'));
            displaySets(sets, table);
        });
    } else {
        getSetsForCurrentUrl(url, function(sets) {
            sets.sort(sortBy('name'));
            displaySets(sets, table);
        });
    }
}

function displaySets(sets, table) {
    if (sets.length) {
        $('#sets').show();
        $('#nosets').hide();
        $('#clearall').removeClass('disabled');
    } else {
        $('#sets').hide();
        $('#nosets').show();
        $('#clearall').addClass('disabled');
        return;
    }
    
    renderSets(sets);
    
    if (table.hasClass('allsets')) {
        $('#clearall').addClass('disabled');
        renderAdditionalInfo(sets);
    } 
}

function renderSets(sets) {
    for (var i = 0; i < sets.length; i++) {
        var set = sets[i];
        var newRow = $('<tr data-key="' + set.key + '"></tr>');
        newRow.append('<td class="restore"><i class="icon-arrow-up"></i> Restore</td>');
        newRow.append('<td class="setName">' + set.name + '</td>');

        var isChecked = set.autoSubmit ? "checked" : "";
        var submitHtml = isChecked
            ? '<i class="icon-ok"></i> <span>Yes</span>'
            : '<i class="icon-remove"></i> <span>No</span>';

        newRow.append('<td class="submit ' + (isChecked ? 'active' : '') + '">' + submitHtml + '</td>');
        newRow.append('<td class="remove"><i class="icon-trash"></i></td>');
        newRow.append('<td class="export"><i class="icon-share-alt"></i></td>');

        var hotkey = set.hotkey;
        newRow.append('<td class="hotkey">' + (hotkey ? hotkey : 'none') + '</a></td>');

        $('#sets').append(newRow);
    }
}

function renderAdditionalInfo(sets) {
    var table = $('#sets');

    if (!table.find('th.url').length) {
        table.find('thead tr').append('<th class="url">URL</th>');
    }

    for (var i = 0; i < sets.length; i++) {
        var set = sets[i];
        var row = table.find('tr[data-key=' + set.key + ']');
        var substrHref = set.url.length > 40 ? set.url.substring(0, 40) + '...' : set.url;
        row.append('<td class="url"><a target="_blank" href="' + set.url + '">' + substrHref + '</a></td>');
        row.find('td.restore').addClass('disabled').find('i').remove();
    }
}

function saveValue(tr, property, value) {
    var key = tr.data('key');
    chrome.storage.local.get(key, function(result) {
        result[property] = value;
        chrome.storage.local.set({[key]: result});
    });
}

function getValue(tr, property) {
    var key = tr.data('key');
    var result;
    chrome.storage.local.get(key, function(result) {
        result = result[property];
    });
    return result;
}

function sendMessage(obj, callback) {
    chrome.tabs.query({ 'active': true, 'currentWindow': true }, function (tab) {
        chrome.tabs.sendMessage(tab[0].id, obj, callback);
    });
}

function setCurrentFilter() {
    chrome.storage.local.get('filter', function(result) {
        var value = result.filter;

        if (!value) {
            value = FILTER_BY_DOMAIN;
            chrome.storage.local.set({'filter': value });
        }
        $('#filter').val(value);
    });
}

function getRandomStorageId() {
    var key = 'set_' + new Date().getTime();
    chrome.storage.local.get(key, function(result) {
        if (result[key]) {
            return getRandomStorageId();
        }
    });

    return key;
}

chrome.tabs.query({ 'active': true, 'currentWindow': true }, function (tab) {
    tab_url = tab[0].url;
    refreshSetsList(tab_url);
});

$(document).ready(function () {
    setCurrentFilter();
    
	// $('.donatelink').click(function () {
	// 	$('#donate').toggle();
	// });
	
    $("#check").click(function () {
        
    });
    
    $("#viewSets").click(function () {
        $('#sets').addClass('allsets');
        refreshSetsList();
    });

    $("#import").click(function () {
		$('#txtImportFormJson').val('');
        $('#importBlock').show();
    });

    $("#btnImportSave").click(function () {
        var importedForm;
        try {
            importedForm = JSON.parse($('#txtImportFormJson').val());
        } catch (e) {
            showError('Invalid JSON');
            return;
        }
        var key = getRandomStorageId();

        chrome.storage.local.set({[key]: importedForm}, function() {
            $('#importBlock').modal('hide');
            refreshSetsList(tab_url);
        });
    });

    $("#clearall").click(function () {
        if ($(this).hasClass('disabled')) {
            return;
        }

        getSetsForCurrentUrl(tab_url, function(sets) {
            for (var i = 0; i < sets.length; i++) {
                chrome.storage.local.remove(sets[i].key);
            }

            refreshSetsList(tab_url);
        });
    });

    $("#store").click(function () {
        sendMessage({ "action": 'store' }, function readResponse(obj) {
            var error = $('#error');
            if (!obj || chrome.runtime.lastError || obj.error) {

                if (chrome.runtime.lastError) {
                    error.html('<h6>Error :( Something wrong with current tab. Try to reload it.</h6>');
                } else if (!obj) {
                    error.html('<h6>Error :( Null response from content script</h6>');
                } else if (obj.error) {
                    error.html('<h6>Error :\'( ' + obj.message + '</h6>');
                }

                error.show();
                return;
            } else {
                error.hide();
            }

            var key = getRandomStorageId();

            var setSettings = {
				url: tab_url,
                autoSubmit: false,
                submitQuery: '',
                content: obj.content,
                name: key,
                hotkey: ''
            };

            chrome.storage.local.set({[key]: setSettings}, function(){
                refreshSetsList(tab_url);
            });
        });
    });

    var sets = $('#sets');

    sets.on("click", 'td', function (event) {
        $('div.block').hide();
    });

    sets.on("click", 'td.restore:not(.disabled)', function (event) {
        var key = $(this).parents('tr').data('key');

        chrome.storage.local.get(key, function(items) {
            var setSettings = items[key];
            sendMessage({ action: 'fill', setSettings: setSettings }, function(response) {
                window.close();
            });
        });
    });
    
    sets.on("click", 'td.submit', function (event) {
        var td = $(this);
        var tr = td.parents('tr');

        try {
            
            if (td.hasClass('active')) {
                saveValue(tr, 'autoSubmit', false);
                td.removeClass('active');
                return;
            }

            var oldQuery = getValue(tr, 'submitQuery');
            oldQuery = oldQuery ? oldQuery : 'input[type=submit]';

            var query = prompt('Enter jquery selector for submit button to auto click', oldQuery);
            if (query) {
                saveValue(tr, 'submitQuery', query);
                saveValue(tr, 'autoSubmit', true);
                td.addClass('active');
            } else {
                td.removeClass('active');
            }
            
        } finally {
            refreshSetsList(tab_url);
        } 
        
    });

    sets.on("click", 'td.remove', function (event) {
        var key = $(this).parents('tr').data('key');
        chrome.storage.local.remove(key, function() {
            refreshSetsList(tab_url);
        });
        
        event.stopPropagation();
    });

    sets.on("click", 'td.export', function (event) {
        var exportBlock = $('#exportBlock');

        if (exportBlock.is(':visible')) {
            exportBlock.hide();
            return;
        }

        var td = $(this);
        var tr = td.parents('tr');
        var key = tr.data('key');

        chrome.storage.local.get(key, function(items) {
            var formJson = JSON.stringify(items[key]);

            td.addClass('active');
            exportBlock.show();

            exportBlock.find('#txtFormJson').val(formJson).focus().select();
        });
    });
    
    sets.on("click", 'td.hotkey', function (event) {
        var hotkeyBlock = $('#hotkeyBlock');
        
        if (hotkeyBlock.is(':visible')) {
            hotkeyBlock.hide();
            return;
        }
        
        var td = $(this);
        var tr = td.parents('tr');
        var value = getValue(tr, 'hotkey');

        td.addClass('active');
        hotkeyBlock.show();
        hotkeyBlock.find('#txtHotkey').val(value).focus().select();
    });
    
    sets.on("click", 'td.setName', function (event) {
        var td = $(this);
        if (td.find('input').length) {
            return;
        }
        
        var tr = td.parents('tr');
        var input = $('<input type="text" class="span1 txtSetName" />');
        input.val(getValue(tr, 'name'));

        td.empty().append(input).find('input').focus().select();
    });
    
    sets.on("keyup", 'input.txtSetName', function (e) {
        var textbox = $(this);
        var value = textbox.val();
        
        if (!value) {
            return;
        }

        var code = e.keyCode || e.which;
        var tr = textbox.parents('tr');
        
        if (code == 13) { //Enter keycode
            var td = textbox.parents('td');
            saveValue(tr, 'name', value);
            td.html(value);
        } else {
            saveValue(tr, 'name', value);
        }
    });
    
    $('#hotkeyBlock').on("keyup", '#txtHotkey', function (e) {
        var code = e.keyCode || e.which;
        if (code == 13) { //Enter keycode
            $('#btnHotkeySave').click();
        }
    });
    
    $('#btnHotkeySave').click(function() {
        $('#hotkeyBlock').hide();
        var tr = $('#sets td.hotkey.active').parents('tr');
        var hotkey = $('#hotkeyBlock #txtHotkey').val();
        saveValue(tr, 'hotkey', hotkey);
        refreshSetsList(tab_url);
        sendMessage({ "action": 'rebind' }, function(response) { });
    });
    
    $('#btnHotkeyCancel').click(function () {
        $('#hotkeyBlock').hide();
    });
        
    $('#btnExportClose').click(function () {
        $('#exportBlock').hide();
    });
    
    $('#btnImportClose').click(function () {
        $('#importBlock').hide();
    });

    sets.on("click", 'td.view', function (event) {
        var key = $(this).parents('tr').data('key');
        viewSet(key); 
        event.stopPropagation();
    });
    
    $('a.filter').click(function () {
        var link = $(this);
        var value = link.attr('id');

        chrome.storage.local.get('filter', function(result) {
            var currentFilter = result.filter;
            if (currentFilter !== value) {
                $('a.filter').not(link).find('i').remove();

            chrome.storage.local.set({'filter': value }, function(){
                link.prepend('<i class="icon-ok"></i> ');
                refreshSetsList(tab_url);
            });
            }
        });
        event.stopPropagation();
    });

    sets
      .on("mousedown", 'tbody td', function(event) {
        $(this).addClass('clicked');
    }).on("mouseup", 'tbody td', function(event) {
        $(this).removeClass('clicked');
    });
});

function saveSet(name, content, url, autoSubmit, submitQuery, hotkey) {
    var key = 'set_' + new Date().getTime();

    var setSettings = {
        name: name,
        content: content,
        url: url,
        autoSubmit: autoSubmit,
        submitQuery: submitQuery,
        hotkey: hotkey
    };

    chrome.storage.local.set({[key]: setSettings}, function(){
        refreshSetsList(tab_url);
    });
}

function importSet() {
    var importedForm;
    try {
        importedForm = JSON.parse($('#txtImportFormJson').val());
    } catch (e) {
        showError('Invalid JSON');
        return;
    }
    
    var key = 'set_' + new Date().getTime();

    chrome.storage.local.set({[key]: importedForm}, function() {
        $('#importBlock').hide();
        refreshSetsList(tab_url);
    });
}

function clearAllSets() {
    getSetsForCurrentUrl(tab_url, function(sets) {
        for (var i = 0; i < sets.length; i++) {
            chrome.storage.local.remove(sets[i].key);
        }

        refreshSetsList(tab_url);
    });
}

function saveSetSettings(tr) {
    var key = tr.data('key');
    var name = tr.find('.txtSetName').val();
    var autoSubmit = tr.find('.chAutoSubmit').is(':checked');
    var submitQuery = tr.find('.txtSubmitQuery').val();
    var hotkey = tr.find('.txtHotkey').val();

    chrome.storage.local.get(key, function(items) {
        var setSettings = items[key];
        setSettings.name = name;
        setSettings.autoSubmit = autoSubmit;
        setSettings.submitQuery = submitQuery;
        setSettings.hotkey = hotkey;

        chrome.storage.local.set({[key]: setSettings}, function() {
            refreshSetsList(tab_url);
        });
    });
}

function removeSet(key) {
    chrome.storage.local.remove(key, function() {
        refreshSetsList(tab_url);
    });
}

function viewSet(key) {
    chrome.storage.local.get(key, function(items) {
        var formJson = items[key];
        $('#txtFormJson').val(JSON.stringify(formJson, null, 4));
        $('#exportBlock').modal('show');
    });
}