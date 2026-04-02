var tab_url;
var nameEditTimer = null;

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
        newRow.append('<td class="setName">' + escapeHtml(set.name) + '</td>');

        var isChecked = set.autoSubmit ? "checked" : "";
        var submitHtml = isChecked
            ? '<i class="icon-ok"></i> <span>Yes</span>'
            : '<i class="icon-remove"></i> <span>No</span>';

        newRow.append('<td class="submit ' + (isChecked ? 'active' : '') + '">' + submitHtml + '</td>');
        newRow.append('<td class="remove"><i class="icon-trash"></i></td>');
        newRow.append('<td class="export"><i class="icon-share-alt"></i></td>');

        var hotkey = set.hotkey;
        newRow.append('<td class="hotkey">' + (hotkey ? escapeHtml(hotkey) : 'none') + '</td>');

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
        row.append('<td class="url"><a target="_blank" href="' + escapeHtml(set.url) + '">' + escapeHtml(substrHref) + '</a></td>');
        row.find('td.restore').addClass('disabled').find('i').remove();
    }
}

function saveValue(tr, property, value) {
    var key = tr.data('key');
    chrome.storage.local.get(key, function(items) {
        var setSettings = items[key];
        setSettings[property] = value;
        chrome.storage.local.set({[key]: setSettings}, function() {
            if (chrome.runtime.lastError) {
                showError('Storage error: ' + chrome.runtime.lastError.message);
            }
        });
    });
}

function getValue(tr, property, callback) {
    var key = tr.data('key');
    chrome.storage.local.get(key, function(items) {
        callback(items[key] ? items[key][property] : undefined);
    });
}

function validateSetSettings(obj) {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return false;
    if (typeof obj.content !== 'string') return false;
    if (typeof obj.url !== 'string') return false;
    if (typeof obj.name !== 'string') return false;
    if (obj.hotkey !== undefined && typeof obj.hotkey !== 'string') return false;
    if (obj.submitQuery !== undefined && typeof obj.submitQuery !== 'string') return false;
    if (obj.autoSubmit !== undefined && typeof obj.autoSubmit !== 'boolean') return false;
    var allowed = ['content', 'url', 'name', 'hotkey', 'submitQuery', 'autoSubmit'];
    for (var k in obj) {
        if (allowed.indexOf(k) === -1) return false;
    }
    return true;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showError(message) {
    var error = $('#error');
    error.find('h6').text(message);
    error.show();
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

        $('a.filter').each(function() {
            if ($(this).attr('id') === value) {
                $(this).prepend('<i class="icon-ok"></i> ');
            }
        });
    });
}

function getRandomStorageId() {
    return 'set_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
}

if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.query({ 'active': true, 'currentWindow': true }, function (tab) {
        tab_url = tab[0].url;
        refreshSetsList(tab_url);
    });
}

if (typeof $ !== 'undefined') $(document).ready(function () {
    setCurrentFilter();
    
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
        } catch (_e) {
            showError('Invalid JSON');
            return;
        }

        if (!validateSetSettings(importedForm)) {
            showError('Invalid form data structure');
            return;
        }

        var key = getRandomStorageId();

        chrome.storage.local.set({[key]: importedForm}, function() {
            $('#importBlock').hide();
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
            if (!obj || chrome.runtime.lastError || obj.error) {

                if (chrome.runtime.lastError) {
                    showError('Error :( Something wrong with current tab. Try to reload it.');
                } else if (!obj) {
                    showError('Error :( Null response from content script');
                } else if (obj.error) {
                    showError('Error :\' ( ' + obj.message);
                }

                return;
            } else {
                $('#error').hide();
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
                if (chrome.runtime.lastError) {
                    showError('Storage full. Delete some sets and try again.');
                    return;
                }
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

        if (td.hasClass('active')) {
                saveValue(tr, 'autoSubmit', false);
                td.removeClass('active');
                refreshSetsList(tab_url);
                return;
            }

            getValue(tr, 'submitQuery', function(oldQuery) {
                oldQuery = oldQuery ? oldQuery : 'input[type=submit]';

                var query = prompt('Enter jquery selector for submit button to auto click', oldQuery);
                if (query) {
                    saveValue(tr, 'submitQuery', query);
                    saveValue(tr, 'autoSubmit', true);
                    td.addClass('active');
                } else {
                    td.removeClass('active');
                }

                refreshSetsList(tab_url);
            });
        
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

        getValue(tr, 'hotkey', function(value) {
            td.addClass('active');
            hotkeyBlock.show();
            hotkeyBlock.find('#txtHotkey').val(value || '').focus().select();
        });
    });
    
    sets.on("click", 'td.setName', function (event) {
        var td = $(this);
        if (td.find('input').length) {
            return;
        }
        
        var tr = td.parents('tr');
        var input = $('<input type="text" class="span1 txtSetName" />');

        getValue(tr, 'name', function(value) {
            input.val(value || '');
            td.empty().append(input).find('input').focus().select();
        });
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
            clearTimeout(nameEditTimer);
            var td = textbox.parents('td');
            saveValue(tr, 'name', value);
            td.text(value);
        } else {
            clearTimeout(nameEditTimer);
            nameEditTimer = setTimeout(function() {
                saveValue(tr, 'name', value);
            }, 500);
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

if (typeof module !== 'undefined') module.exports = { sortBy, validateSetSettings, escapeHtml, getRandomStorageId, getAllSets };

