;

jQuery(function() {
    (function($) {
        var $tab    = $('#tabCommerceValues'),
            tab     = $tab.get(0),
            $type   = $('select[name="type"]'),
            $header = $tab.children().eq(0).clone(),
            $table  = $tab.find('.tmplvar-values'),
            page;

        $type.change(function() {
            if (this.value == 'custom_tv:commerce_options') {
                $tab.addClass('tab-page');

                if (!tab.tabPage) {
                    page = tpTmplvars.addTabPage(tab);
                } else {
                    page = tab.tabPage;
                }
            } else if (page) {
                if (page) {
                    tpTmplvars.removeTabPage(tab);
                }
            }
        }).change();

        documentDirty = false;

        $table.sortable({
            axis:  'y',
            items: 'tr',
            handle: '.move-handler',
            forcePlaceholderSize: true,
            stop: function(e, ui) {
                $table.children('tbody').children('tr').each(function(i) {
                    $(this).find('input[name*="[sort]"]').val(i * 10);
                });

                documentDirty = true;
            }
        });

        $('.add-tmplvar-value').click(function(e) {
            e.preventDefault();

            var sort = 0;

            $table.children('tbody').children('tr').each(function(i) {
                var rowsort = $(this).find('input[name*="[sort]"]').val();

                if (rowsort > sort) {
                    sort = rowsort;
                }
            });

            var tpl = parseTemplate($('script#attrValueTpl').html(), {
                iteration: _co.nextValue++,
                sort: parseInt(sort) + 10
            });

            var $row = $(tpl).appendTo('.tmplvar-values');
            $row.find('.value-image').initImageField();

            documentDirty = true;
        });

        $(document).on('click', '.delete-tmplvar-value', function(e) {
            e.preventDefault();
            $(this).closest('tr').remove();
            documentDirty = true;
        });

        $('.value-image').initImageField();
    })(jQuery);
});
