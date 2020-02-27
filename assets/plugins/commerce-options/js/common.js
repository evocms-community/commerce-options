;

var parseTemplate = function(tpl, data) {
    for (var key in data) {
        tpl = tpl.replace(new RegExp('\{%' + key + '%\}', 'g'), data[key]);
    }

    return tpl;
};
