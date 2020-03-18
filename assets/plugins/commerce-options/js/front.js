;

(function($) {
    var CommerceOptions = function(container) {
        this.$container = $(container);
        this.$blocks    = $('[data-tvco-block="' + container.getAttribute('data-tvco-container') + '"]');
        this.options    = _tvco;

        container.tvco = this;
        var tvco = this;

        this.$blocks.on('change', 'input[type="radio"], input[type="checkbox"], select', function(e) {
            tvco.updateState();
        });

        tvco.updateState();
    };

    CommerceOptions.prototype = {
        updateStateIteration: function(tvindex, structure) {
            var tvco    = this,
                tv_id   = tvco.options.tmplvars[tvindex].id,
                $block  = tvco.$blocks.filter('[data-id="' + tv_id + '"]'),
                $inputs = $block.find('input, option'),
                value   = parseInt($block.find(':checked, :selected').val()) || 0,
                state   = [],
                isDropdown = $inputs.parent().is('select');

            var autoCheckSameOptions = tvco.options.autoCheckSameOptions.length && tvco.options.autoCheckSameOptions.indexOf(tv_id) !== -1,
                hideInactive         = tvco.options.hideInactive.length && tvco.options.hideInactive.indexOf(tv_id) !== -1,
                uncheckDisabled      = tvco.options.uncheckDisabled.length && tvco.options.uncheckDisabled.indexOf(tv_id) !== -1,
                avoidUnchecked       = tvco.options.avoidUnchecked.length && tvco.options.avoidUnchecked.indexOf(tv_id) !== -1;

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

            if (autoCheckSameOptions && state.length) {
                for (var i = 0; i < state.length; i++) {
                    var first = $inputs.not(':disabled').filter('[data-value="' + state[i] + '"]').get(0);

                    if (first) {
                        first.checked = first.selected = true;
                    }
                }
            }

            var $availableInputs = $inputs.not(':disabled');

            if ($availableInputs.filter(':checked, :selected').length) {
                $block.removeClass(tvco.options.requiredClass);
            } else if (avoidUnchecked) {
                var $first = $availableInputs.first();

                if ($first.length) {
                    if (isDropdown) {
                        $first.get(0).selected = true;
                    } else {
                        $first.get(0).checked = true;
                    }

                    value = parseInt($first.val()) || 0;
                }
            }

            $availableInputs.filter(':checked, :selected').each(function() {
                tvco.checkedOptions.push(tvco.options.options[this.value]);
            });

            if (tvindex + 1 < tvco.options.tmplvars.length) {
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
                    original = parseFloat($self.attr('data-commerce-price').replace(',', '.')),
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
        },

        markRequiredOptions: function(failed) {
            this.$blocks.removeClass(this.options.requiredClass);

            if (failed.length) {
                this.$container.trigger('required-options-missed.commerce', {tv_ids: failed});

                for (var i = 0; i < failed.length; i++) {
                    var $block = this.$blocks.filter('[data-id="' + failed[i] + '"]');
                    $block.addClass(this.options.requiredClass);
                    $block.trigger('required-option-missed.commerce');
                }
            }
        }
    };

    $(function() {
        $('[data-tvco-container]').each(function() {
            new CommerceOptions(this);
        });

        $(document).on('cart-add.commerce', function(e, data) {
            if (data.cart.instance == 'products') {
                var container = $('[data-tvco-container][data-product="' + data.id + '"]').get(0);

                if (!container) {
                    return;
                }

                var tvco = container.tvco;
                var required = [];

                for (var i = 0; i < tvco.options.tmplvars.length; i++) {
                    if (!tvco.options.tmplvars[i].required) {
                        continue;
                    }

                    required.push(tvco.options.tmplvars[i].id);
                }

                if (!data.meta || !data.meta.tvco || !data.tvcovalues) {
                    e.preventDefault();
                    tvco.markRequiredOptions(required);
                    return;
                }

                var checked  = [];

                for (var i = 0; i < data.meta.tvco.length; i++) {
                    if (!tvco.options.options[ data.meta.tvco[i] ]) {
                        continue;
                    }

                    checked.push(tvco.options.options[ data.meta.tvco[i] ].tmplvar_id);
                }

                failed = required.filter(function(id) {
                    return checked.indexOf(id) === -1;
                });

                if (failed.length) {
                    e.preventDefault();
                    tvco.markRequiredOptions(failed);
                }
            }
        });

        $(document).on('cart-add-complete.commerce', function(e, data) {
            if (data.data.cart.instance == 'products') {
                if (data.response.required_options_missed) {
                    var container = $('[data-tvco-container][data-product="' + data.id + '"]').get(0);

                    if (container && container.tvco) {
                        container.tvco.markRequiredOptions(data.response.required_options_missed);
                    } else if (data.response.product_details_link) {
                        if (window.location != data.response.product_details_link) {
                            window.location = data.response.product_details_link;
                        } else {
                            $(document).trigger('required-options-missed.commerce', data);
                        }
                    }
                }
            }
        });
    });
})(jQuery);
