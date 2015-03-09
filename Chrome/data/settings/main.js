/*global localStorage: false, console: false, $: false, chrome: false, unescape: false, prefs: false, window: false, Handlebars: false, data: false */
/*jshint sub:true */
/*jshint multistr:true */

// Handlebars setup
Handlebars.registerHelper('if_eq', function (a, b, opts) {
    if (a == b) return opts.fn(this);
    else return opts.inverse(this);
});
var template = Handlebars.compile($('#option-template').html());

// Debug message
function debugBro(error) {
    window.prompt('We\'re having some trouble with Settings. \nCan you pass this message over to us?',
                  'Runtime message: ' + error + ' Name: ' + error.name + ' Stack: ' + error.stack + ' Message: ' + error.message);
};

var Settings = {
    pageInit: function(pageName) {
        if (['Home', 'Background', 'Header', 'Logo', 'Colors', 'Forums', 'PostFormat', 'UserTags'].indexOf(pageName) > -1) {
            // Compile HTML
            $('.page[data-page="' + pageName + '"] fieldset').html(template(data[pageName]));

            // Set prefs
            $('.page[data-page="' + pageName + '"] *[data-pref]').each(function() {
                var pref = $(this).attr('data-pref');
                
                // Error Handling
                if (typeof(prefs[pref]) == 'undefined') {
                    $(this).prop('disabled', true);
                    throw('Error: ' + pref + ' is not a valid preference to initialize.');
                }

                // Checkbox
                if ($(this).attr('type') == 'checkbox') $(this).prop('checked', prefs[pref]);
                // Select, Textbox
                else $(this).val(prefs[pref]);
            });
        }

        if (pageName == 'Shortcuts') {
            
        }
        
        /*if (pageName == 'Home') {
        }
        else if (pageName == 'Shortcuts') {
            // nothing at the moment
        }
        else if (pageName == 'Personalize') {
            // nothing at the moment
        }*/
        else if (pageName == 'Background') {
            $('.page[data-page="Background"] .options').on('click', 'a[data-url]', function() {
                var image = $(this).attr('data-url');
                if (image == 'default') $('#preview').attr('style', '');
                else $('#preview').css('background-image', 'url(' + image + ')');
                $(this).parent().children('.selected').removeClass('selected');
                $(this).addClass('selected');
                
                $('input[data-pref="background.image"]').val(image).change();
            });
            
            $.ajax({
                type: 'GET',
                url: 'backgrounds.json',
                dataType: 'text json',
                cache: false
            }).done(function(data) {
                $.each(data['Backgrounds'], function(index, url) {
                    var html;
                    if (url == 'default') html = '<a data-url="' + url + '"></a>';
                    else html = '<a data-url="' + url + '" style="background-image: url(' + url + ');"></a>';
                    $('.page[data-page="Background"] .options .custom').before(html);
                });

                // set selected
                $('.page[data-page="Background"] .options a[data-url="' + $('input[data-pref="background.image"]').val() + '"]').addClass('selected');
            });
        }
        else if (pageName == 'Header') {
            $.ajax({
                type: 'GET',
                url: 'headers.json',
                dataType: 'text json',
                cache: false
            }).done(function(data) {
                // get host prefix
                var host = data['info']['host'];
                delete data['info'];

                // add header options to page
                $.each(data, function(key, headers) {
                    // Add title
                    $('.page[data-page="Header"] .options').prepend('<h4>' + key + '</h4><div class="h' + key + '"></div>');

                    // Add headers
                    $.each(headers, function(name, url) {
                        // check if url needs prefix
                        if (url[0] != 'default' && url[0].substring(0,7) != 'http://' && url[0].substring(0,19) != 'chrome-extension://') url[0] = host + url[0];
                        if (url[1] != 'default' && url[1].substring(0,7) != 'http://' && url[1].substring(0,19) != 'chrome-extension://') url[1] = host + url[1];
                        $('.page[data-page="Header"] .options .h' + key).append('<a data-url="' + url[0] + '" data-base-url="' + url[1] + '">' + name + '</a>');
                    });
                });
            });
        }
        else if (pageName == 'Logo') {
            $('.page[data-page="Logo"] .options').on('click', 'a[data-url]', function() {
                var image = $(this).attr('data-url');
                if (image == 'default') $('#preview .header .wrap .logo').attr('style', '');
                else $('#preview .header .wrap .logo').css('background-image', 'url(' + image + ')');
                $(this).parent().children('.selected').removeClass('selected');
                $(this).addClass('selected');
                
                $('input[data-pref="header.logo"]').val(image).change();
            });

            // set selected
            $('.page[data-page="Logo"] .options a[data-url="' + $('input[data-pref="header.logo"]').val() + '"]').addClass('selected');
        }
        /*else if (pageName == 'Colors') {
        }
        else if (pageName == 'Forums') {
        }
        else if (pageName == 'PostFormat') {
        }
        else if (pageName == 'UserTags') {
        }*/
        else if (pageName == 'About') {
            // nothing at the moment
            $('.page[data-page="About"] .version').text(prefs.version);
        }
    },

    onload: function() {
        // Save a default
        prefs.default = JSON.parse(JSON.stringify(prefs));

        // Get settings
        chrome.storage.local.get(null, function(response) {
            for (var key in response) {
                try {prefs[key] = response[key];}
                catch(e) {console.warn('Missing pref \'' + e + '\'.');}
            }

            try {Settings.init();}
            catch(e) {debugBro(e);}
        });
    },

    init: function() {
        // Save prefs
        $('#pages').on('change', '.page.loaded *[data-pref]', function() {
            var pref = $(this).attr('data-pref'), save = {};

            // Checkbox
            if ($(this).attr('type') == 'checkbox') save[pref] = $(this).is(':checked');
            // Select, Textbox
            else save[pref] = $(this).val();

            // Chrome Storage
            if (prefs.default[pref] == save[pref]) chrome.storage.local.remove(pref);
            else chrome.storage.local.set(save);
        });
        
        // Menu
        $('#nav .pure-menu').on('click', 'a[href]', function() {
            if ($(this).hasClass('selected')) return false;
            else {
                $('#pages .page.selected, #nav .pure-menu a.selected').removeClass('selected');

                var pageName = $(this).attr('href').substring(1),
                    page = $('#pages .page[data-page="' + pageName + '"]');
                if (!page.hasClass('loaded')) {
                    try {Settings.pageInit(pageName);}
                    catch(e) {debugBro(e);}
                    page.addClass('loaded');
                }
                page.addClass('selected');
                $(this).addClass('selected');
            }
        });

        $(window).on('hashchange', function() {
            if (window.location.hash === '') $('#nav .pure-menu a[href="#Home"]').click();
            else $('#nav .pure-menu a[href="' + window.location.hash + '"]').click();
        });

        if (window.location.hash === '') $('#nav .pure-menu a[href="#Home"]').click();
        else $('#nav .pure-menu a[href="' + window.location.hash + '"]').click();
    }
};

// Run
try {Settings.onload();}
catch(e) {debugBro(e);}
