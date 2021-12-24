;

jQuery(function() {
    (function($) {
        var $tab    = $('#tabCommerceValues'),
            tab     = $tab.get(0),
            $type   = $('select[name="type"]'),
            $header = $tab.children().eq(0).clone(),
            $table  = $tab.find('.tmplvar-values').children('tbody'),
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
                var prevOrder = 0,
                    nextOrder,
                    order,
                    $row = ui.item,
                    $prevRow = $row.prev('tr'),
                    $nextRow;

                do {
                    if ($prevRow.length) {
                        prevOrder = parseInt($prevRow.find('input[name*="[sort]"]').val()) || 0;
                    }

                    $nextRow = $row.next('tr:visible');

                    if ($nextRow.length) {
                        nextOrder = parseInt($nextRow.find('input[name*="[sort]"]').val()) || 0;
                    } else {
                        nextOrder = prevOrder + 20;
                    }

                    if ($prevRow.length) {
                        order = Math.ceil(prevOrder + (nextOrder - prevOrder) * 0.5);
                    } else {
                        order = 0;
                    }

                    $row.find('input[name*="[sort]"]').val(order);
                    $row.addClass('dirty');

                    if (order >= nextOrder) {
                        $prevRow = $row;
                        $row = $nextRow;
                    } else {
                        break;
                    }
                } while ($row.length);

                documentDirty = true;
            }
        });

        $table.on('change', 'input, select', function() {
            $(this).closest('tr').addClass('dirty');
        });

        $table.on('click', 'button', function() {
            $(this).closest('tr').addClass('dirty');
        });

        $('.add-tmplvar-value').click(function(e) {
            e.preventDefault();

            var sort = 0;

            $table.children('tr').each(function(i) {
                var rowsort = parseInt($(this).find('input[name*="[sort]"]').val()) || 0;

                if (rowsort > sort) {
                    sort = rowsort;
                }
            });

            var tpl = parseTemplate($('script#attrValueTpl').html(), {
                iteration: _co.nextValue++,
                sort: parseInt(sort) + 10
            });

            var $row = $(tpl).addClass('dirty').appendTo('.tmplvar-values');
            $row.find('.value-image').initImageField();

            documentDirty = true;
        });

        $(document).on('click', '.delete-tmplvar-value', function(e) {
            e.preventDefault();
            $(this).closest('tr').addClass('dirty').hide().appendTo($table).find('input[name*="[delete]"]').val(1);
            documentDirty = true;
        });

        $table.closest('form').submit(function() {
            $table.children('tr').not('.dirty').find('input, select').attr('disabled', true);
        });

        $('.value-image').initImageField();
    })(jQuery);
});
