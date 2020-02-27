;

var parseTemplate = function(tpl, data) {
    for (var key in data) {
        tpl = tpl.replace(new RegExp('\{%' + key + '%\}', 'g'), data[key]);
    }

    return tpl;
};

(function($) {
    $.fn.updateThumb = function() {
        var $field   = $(this),
            source   = $.trim($field.val());
            $preview = $field.closest('.form-cell').find('.preview'),
            thumb    = source.replace('assets/images/', '../assets/' + _co.thumbsDir + '/images/');

        if (source == '') {
            $preview.removeAttr('style');
        } else {
            if (document.images) {
                var image = new Image();

                (function(source, thumb, $preview) {
                    image.onload = function() {
                        if (this.width + this.height == 0) {
                            return this.onerror();
                        }

                        $preview.css('background-image', 'url("' + thumb + '")');
                    }

                    image.onerror = function() {
                        if (this.thumbChecked == undefined) {
                            this.thumbChecked = true;
                            this.src = source.replace('assets/images', '../assets/images');
                        } else {
                            $preview.css('background-image', 'url("../assets/images/noimage.jpg")');
                        }
                    }
                })(source, thumb, $preview);

                image.src = thumb;
            } else {
                $preview.css('background-image', 'url("' + thumb + '")');
            }
        }
    };

    $.fn.initImageField = function() {
        return this.each(function() {
            $(this).find('.show-browser').click(function(e) {
                e.preventDefault();

                var $field = $(this).closest('.form-cell').find('input[type="text"]'),
                    wnd    = window.parent || window,
                    margin = parseInt(wnd.innerHeight * .1),
                    width  = wnd.innerWidth - margin * 2,
                    height = wnd.innerHeight - margin * 2,
                    params = 'toolbar=no,status=no,resizable=yes,dependent=yes,width=' + width + ',height=' + height + ',left=' + margin + ',top=' + (margin + (wnd._startY ? wnd._startY * .5 : 0));

                if (window['SetUrl']) {
                    window['SetUrl_disabled'] = window['SetUrl'];
                    window['SetUrl'] = null;
                }

                window.KCFinder = {
                    callBack: function(url) {
                        if (window['SetUrl_disabled']) {
                            window['SetUrl'] = window['SetUrl_disabled'];
                        }

                        window.KCFinder = null;
                        $field.val(url).updateThumb();
                    }
                };

                var wnd = window.open(_co.imagesBrowser + '?type=images', 'FileManager', params);
            });

            $(this).find('input[type="text"]').on('change input', function() {
                $(this).updateThumb();
            }).updateThumb();
        });
    };
})(jQuery);
