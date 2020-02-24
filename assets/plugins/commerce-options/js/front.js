;

(function($) {
    var CommerceOptions = function() {
        this.$container = $('[data-tvco-container]');
        this.$blocks    = $('[data-tvco-block]');
        this.options    = _tvco;
    };

    CommerceOptions.prototype = {
        updateStateIteration: function(tvindex, structure) {
            var tvco    = this,
                tv_id   = tvco.options.tmplvars[tvindex],
                $block  = tvco.$blocks.filter('[data-id="' + tv_id + '"]'),
                $inputs = $block.find('input, option'),
                value   = parseInt($block.find(':checked, :selected').val()) || 0,
                state   = [],
                isDropdown = $inputs.parent().is('select');

            var autoCheckSameOptions = tvco.options.autoCheckSameOptions.length && tvco.options.autoCheckSameOptions.indexOf(tv_id) !== -1,
                hideInactive         = tvco.options.hideInactive.length && tvco.options.hideInactive.indexOf(tv_id) !== -1;
                uncheckDisabled      = tvco.options.uncheckDisabled.length && tvco.options.uncheckDisabled.indexOf(tv_id) !== -1;

            if (structure.length) {

                $inputs.each(function() {
                    var shouldDisable = true,
                        wasDisabled   = this.disabled;

                    for (var i = 0; i < structure.length; i++) {
                        if (structure[i].values.indexOf(parseInt(this.value)) !== -1) {
                            shouldDisable = false;
                        }
                    }

                    this.disabled = shouldDisable;

                    if (hideInactive) {
                        $(this).closest('[data-tvco-row]').toggle(!shouldDisable);
                    }

                    if (shouldDisable) {
                        if (this.checked || this.selected) {
                            if (!wasDisabled) {
                                state.push(this.getAttribute('data-value'));
                            }

                            if (uncheckDisabled) {
                                this.checked = this.selected = false;
                            }
                        }
                    }
                });
            }

            if (tvindex < tvco.options.tmplvars.length - 1) {
                if (!$inputs.filter(':checked, :selected').length) {
                    var $first = $inputs.not(':disabled').first();

                    if ($first.length) {
                        if (isDropdown) {
                            $first.get(0).selected = true;
                        } else {
                            $first.get(0).checked = true;
                        }

                        value = parseInt($first.val()) || 0;
                    }
                }
            }

            if (autoCheckSameOptions && state.length) {
                for (var i = 0; i < state.length; i++) {
                    var first = $inputs.not(':disabled').filter('[data-value="' + state[i] + '"]').get(0);

                    if (first) {
                        first.checked = first.selected = true;
                    }
                }
            }

            $inputs.not(':disabled').filter(':checked, :selected').each(function() {
                tvco.checkedOptions.push(tvco.options.options[this.value]);
            });

            if (tvindex + 1 <= tvco.options.tmplvars.length) {
                var children = [];

                for (var i = 0; i < structure.length; i++) {
                    if (structure[i].values.indexOf(value) !== -1 && structure[i].children && structure[i].children.length) {
                        children = structure[i].children;
                        break;
                    }
                }

                tvco.updateStateIteration(tvindex + 1, children);
            }
        },

        updateState: function() {
            if (this.options.tmplvars.length) {
                this.checkedOptions = [];
                this.updateStateIteration(0, this.options.structure);
                this.updatePrices();
            }
        },

        updatePrices: function() {
            var tvco = this;

            this.$container.children('input[name="meta[tvco][]"]').remove();

            for (var i = 0; i < tvco.checkedOptions.length; i++) {
                $('<input type="hidden" name="meta[tvco][]">').val(tvco.checkedOptions[i].id).appendTo(tvco.$container);
            }

            this.$container.closest('[data-commerce-action="add"]').find('[data-commerce-price]').each(function() {
                var $self    = $(this),
                    original = parseFloat($self.attr('data-commerce-price')),
                    price    = original;

                if (typeof price != 'number') {
                    return;
                }

                for (var i = 0; i < tvco.checkedOptions.length; i++) {
                    var option = tvco.checkedOptions[i];

                    if (option.amount != 0) {
                        switch (option.modifier) {
                            case 'add':      price += option.amount; continue;
                            case 'subtract': price -= option.amount; continue;
                            case 'multiply': price *= option.amount; continue;
                            case 'replace':  price  = option.amount; continue;
                        }
                    }
                }

                var event = $.Event('options-changed.commerce');
                var eventOptions = {
                    options: tvco.checkedOptions,
                    originalPrice: original,
                    calculatedPrice: price
                };

                $self.trigger(event, eventOptions);

                if (event.isDefaultPrevented() || typeof event.result != 'undefined' && event.result === false) {
                    return;
                }

                $self.html(Commerce.formatPrice(eventOptions.calculatedPrice));
            });
        }
    };

    $(function() {
        var tvco = new CommerceOptions();

        var $blocks = $('[data-tvco-block]');

        /*if (_tvco.allowUncheck.length) {
            $radio = $([]);

            for (var i = 0; i < _tvco.allowUncheck.length; i++) {
                $radio = $radio.add($blocks.filter('[data-id="' + _tvco.allowUncheck[i] + '"]'))
            }

            (function($blocks) {
                $radio.find('input[type="radio"]')
                    .each(function() {
                        this.previousState = this.checked;
                    })
                    .click(function() {
                        if (this.previousState && this.checked) {
                            this.checked = false;
                        }

                        this.previousState = this.checked;
                        $('input[type="radio"][name="' + this.name + '"]').not(this).each(function() {
                            this.previousState = false;
                        })

                        tvco.updateState();
                    })
                    .change();
            })($blocks);

            $blocks = $blocks.not($radio);
        }*/

        $blocks.find('input[type="radio"], input[type="checkbox"], select').change(function(e) {
            tvco.updateState();
        });

        tvco.updateState();
    });

    /*$(document).on('cart-add-complete.commerce', function(e, data) {
        if (data.data.cart.instance == 'products' && typeof data.response.redirect != 'undefined') {
            if (window.location != data.response.redirect) {
                window.location = data.response.redirect;
            }
        }
    });*/
})(jQuery);
