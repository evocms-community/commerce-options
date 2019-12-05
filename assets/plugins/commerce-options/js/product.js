;

var tvcoRelations;

(function($) {
    if (typeof window.initTVCOContainers == 'undefined') {
        var tvco = function(selector) {
            this.$container  = $(selector);
            this.tv_id       = this.$container.attr('data-id');
            this.$values     = this.$container.find('.available-values');
            this.$table      = this.$container.find('.tvco-values').children('tbody');
            this.$hidden     = this.$container.children('input[type="hidden"]').first();
            this.rowTemplate = $('script#tvcoValTpl').html();
            this.options     = window['_tvco_' + this.tv_id];
        };

        tvco.prototype = {
            init: function() {
                var self = this;

                this.$values.on('change', function(e) {
                    e.preventDefault();
                    var id = $(this).val();

                    if (id != '') {
                        if (id == 'all') {
                            self.$values.children().each(function() {
                                if (this.value != '' && this.value != 'all') {
                                    self.addValue(self.options.values[this.value]);
                                }
                            });
                        } else {
                            self.addValue(self.options.values[id]);
                        }

                        self.updateControls();
                    }
                });

                this.$container.on('click', '.remove-value', function(e) {
                    e.preventDefault();
                    var $row = $(this).closest('tr'),
                        hash = $row.attr('data-hash');
                    $row.remove();
                    self.updateControls();
                    window.tvcoRelations.removeValues(self.tv_id, hash);
                });

                this.$container.on('click', '.clear-values', function(e) {
                    e.preventDefault();
                    self.$table.children('tr').remove();
                    self.updateControls();
                    window.tvcoRelations.removeValues(self.tv_id);
                });

                this.$container.on('change', 'input[name*="[amount]"], select[name*="[modifier]"]', function(e) {
                    var $row = $(this).closest('tr'),
                        hash = $row.attr('data-hash');

                    self.updateProductValues();
                    window.tvcoRelations.updateValue(self.tv_id, hash);
                });

                this.makeRowUniqueID(this.$table.children('tr'));
                this.updateControls();
            },

            updateControls: function() {
                var ids = [];

                this.$table.find('input[name*="[value_id]"]').each(function() {
                    if (ids.indexOf(this.value) === -1) {
                        ids.push(this.value);
                    }
                });

                this.$values.val('');
                this.$hidden.val(ids.join('||'));
                this.updateProductValues();
                this.$table.parent().toggleClass('empty', !this.$table.children().length);
                window.tvcoRelations.updateState(null, this.tv_id);
            },

            updateProductValues: function() {
                var self = this,
                    values = {};

                self.$table.children('tr').each(function() {
                    var $self    = $(this),
                        hash     = $self.attr('data-hash'),
                        $inputs  = $self.children('td').children('input, select'),
                        value_id = $inputs.filter('[name*="[value_id]"]').val(),
                        modifier = $inputs.filter('[name*="[modifier]"]').val(),
                        amount   = $inputs.filter('[name*="[amount]"]').val();

                    values[hash] = self.options.values[value_id].title;

                    if (amount > 0) {
                        values[hash] += ' (' + _tvcorel.modifiers[modifier] + amount + ')';
                    }
                });

                _tvcorel.values[self.tv_id] = values;
                window.tvcoRelations.updateControls(null, self.tv_id);
            },

            addValue: function(value) {
                value = $.extend({}, value, {
                    tv_id:     this.options.tv_id,
                    iteration: this.options.nextValue++
                });

                var tpl = parseTemplate(this.rowTemplate, value),
                    $row = $(tpl),
                    $before = null,
                    self = this;

                $row.find('select[data-initial-value]').each(function() {
                    $(this).val($(this).attr('data-initial-value'));
                });

                this.$table.children('tr').each(function() {
                    var $self = $(this),
                        value_id = $self.children('td').children('input[name*="[value_id]"]').val();

                    if (self.options.values[value_id].sort <= value.sort) {
                        $before = $self;
                    } else {
                        return false;
                    }
                });

                if ($before) {
                    $row.insertAfter($before);
                } else {
                    $row.prependTo(this.$table);
                }

                this.makeRowUniqueID($row);
            },

            makeRowUniqueID: function($element) {
                var hash = '';

                $element.each(function() {
                    do {
                        hash = (((1 + Math.random()) * 0x100000) | 0).toString(16);
                    } while ($('[data-hash="' + hash + '"]').length);

                    $(this).attr('data-hash', hash).find('[name*="hash"]').val(hash);
                });

                return hash;
            }
        };

        var tvcorel = function(selector) {
            this.$container  = $(selector).first();
            this.options     = _tvcorel;
            this.groupTpl    = $('script#tvcorelTpl').html();
            this.groupValTpl = $('script#tvcorelValTpl').html();
            this.init();
        };

        tvcorel.prototype = {
            init: function() {
                var self = this;

                this.$container.on('click', '.detach-value', function(e) {
                    e.preventDefault();

                    var $value    = $(this).parent('.value-item'),
                        hash      = $value.attr('data-hash'),
                        $relation = $value.closest('.relation-item'),
                        $clone    = $relation.clone();

                    $value.remove();
                    $clone.children('.values').children('.value-item[data-hash!="' + hash + '"]').remove();
                    $clone.hide().insertAfter($relation);
                    self.updateState($relation);
                    self.updateState($clone);
                    $clone.slideDown(200);
                });

                this.$container.on('click', '.remove-value', function(e) {
                    e.preventDefault();
                    var $relation = $(this).closest('.relation-item');
                    $(this).parent().remove();
                    self.updateState($relation);
                });

                this.$container.on('change', '.add-value', function(e) {
                    var $self     = $(this),
                        hash      = $self.val(),
                        $relation = $self.closest('.relation-item');

                    if (hash != '') {
                        if (hash == 'all') {
                            $self.children().each(function() {
                                if (this.value != '' && this.value != 'all') {
                                    self.addValue($relation, this.value);
                                }
                            });
                        } else {
                            self.addValue($relation, hash);
                        }

                        self.updateState($relation);
                    }
                });

                this.checkChildrenContainer(this.$container);

                $('form.content#mutate').on('submit', function(e) {
                    var str = self.stringifyValues();
                    $('[name="tvco_relations"]').val(JSON.stringify(str));
                });
            },

            stringifyValues: function($container) {
                var self = this,
                    result = [];

                if (!$container) {
                    $container = this.$container;
                }

                $container.children('.items-container').children('.relation-item').each(function() {
                    var $relation = $(this),
                        childrenResult = self.stringifyValues($relation),
                        row = {
                            values: []
                        };

                    if (childrenResult.length && childrenResult[0].values.length) {
                        row.children = childrenResult;
                    }

                    $relation.children('.values').children('.value-item').each(function() {
                        row.values.push($(this).attr('data-hash'));
                    });

                    result.push(row);
                });

                return result;
            },

            updateControls: function($relation, tv_id) {
                var self = this;

                if ($relation === null) {
                    $items = this.$container.find('.items-container');
                } else {
                    $items = $relation.parent();
                }

                $items.each(function() {
                    var $relations = $(this).children('.relation-item'),
                        selected   = {};

                    if (tv_id > 0) {
                        $relations = $relations.filter('[data-id="' + tv_id + '"]');
                    }

                    $relations.each(function() {
                        $(this).children('.values').children('.value-item').each(function() {
                            selected[$(this).attr('data-hash')] = true;
                        });
                    });

                    $relations.each(function() {
                        var $self   = $(this),
                            tv_id   = $self.attr('data-id'),
                            $values = $self.children('.values'),
                            $select = $values.children('select.add-value');

                        $select.empty();

                        for (var hash in self.options.values[tv_id]) {
                            if (!selected[hash]) {
                                $('<option/>').val(hash).text(self.options.values[tv_id][hash]).appendTo($select);
                            }
                        }

                        var length = $select.children().length;

                        if (length) {
                            if (length > 1) {
                                $('<option/>').val('all').text(self.options.lang.add_all_values).prependTo($select);
                            }

                            $('<option/>').val('').text(self.options.lang.add_value).prependTo($select);
                            $select.val('').show();
                        } else {
                            $select.hide();
                        }
                    });
                });
            },

            addValue: function($relation, hash) {
                var tv_id = $relation.attr('data-id');

                var tpl = parseTemplate(this.groupValTpl, {
                    title: this.options.values[tv_id][hash]
                });

                $(tpl).attr('data-hash', hash).insertBefore($relation.children('.values').children('select'));
            },

            updateState: function($relations, tv_id) {
                var self = this;

                if (typeof $relations == 'undefined' || $relations === null) {
                    $relations = this.$container.find('.relation-item');

                    if (tv_id) {
                        $relations = $relations.filter('[data-id="' + tv_id + '"]');
                    }
                }

                $relations.each(function() {
                    var $relation = $(this);

                    if ($relation.length) {
                        var $values = $relation.children('.values').children('.value-item'),
                            valuesCount = $values.length;

                        var $children = $relation.children('.children-container');//.toggle(valuesCount ? true : false);

                        if (!valuesCount) {
                            if ($relation.siblings('.relation-item').length) {
                                $relation.slideUp(200, function() {
                                    $relation.remove();
                                });
                            } else {
                                $children.slideUp(200);
                            }
                        } else {
                            self.checkChildrenContainer($relation);
                            $relation.toggleClass('cannot-divide', valuesCount == 1);
                            $children.slideDown(200);

                            var tv_id = $relation.attr('data-id'),
                                $container = $('.tvco-container[data-id="' + tv_id + '"]');

                            $values.not('[data-hash]').each(function() {
                                var $self = $(this),
                                    id = $self.attr('data-id');

                                if (id > 0) {
                                    var hash = $container.find('tr[data-id="' + id + '"][data-hash]').attr('data-hash');

                                    if (hash) {
                                        $self.attr('data-hash', hash);
                                    }
                                }
                            });
                        }

                        self.updateControls($relation);
                    }
                });
            },

            updateValue: function(tv_id, hash) {
                if (hash != '') {
                    this.$container.find('.value-item[data-hash="' + hash + '"]').children('span').text(this.options.values[tv_id][hash]);
                }
            },

            removeValues: function(tv_id, hash) {
                var self = this;

                this.$container.find('.relation-item[data-id="' + tv_id + '"]').each(function() {
                    var $values = $(this).children('.values').children('.value-item');

                    if (hash) {
                        $values = $values.filter('[data-hash="' + hash + '"]');
                    }

                    $values.remove();
                    self.updateState($(this));
                });
            },

            checkChildrenContainer: function($item) {
                var $children = $item.children('.items-container');

                if (!$item.hasClass('last') && !$children.children().length) {
                    var tmplvar_id = $item.attr('data-id'),
                        tmplvars = Object.keys(this.options.tmplvars);

                    if (!tmplvars.length) {
                        return;
                    }

                    if (!tmplvar_id) {
                        tmplvar_id = tmplvars[0];
                    } else {
                        tmplvar_id = this.options.tmplvars[tmplvar_id].child;
                    }

                    if (!tmplvar_id) {
                        $item.addClass('last');
                        return;
                    }

                    var tpl = parseTemplate(this.groupTpl, {
                        caption:    this.options.tmplvars[tmplvar_id].caption,
                        tmplvar_id: tmplvar_id
                    });

                    var $relation = $(tpl).appendTo($children);
                    this.updateState($relation);
                }
            }
        };

        window.initTVCOContainers = function() {
            var $tab   = $('#tabCommerceOptions'),
                $table = $tab.children('table').first().children('tbody'),
                $relations = $table.find('.tvco-relations-wrap');

            tvcoRelations = new tvcorel($('.tvco-relations').appendTo($relations.find('td > div')).show());

            $tab.insertAfter('#tabSettings');
            tpSettings.addTabPage($tab.get(0));

            $('.tvco-container').each(function() {
                var $row = $(this).closest('tr'),
                    $next = $row.next('tr');
                $row.add($next).insertBefore($relations);
                (new tvco(this)).init();
            });
        };

        $(function() {
            initTVCOContainers();
        });
    }
})(jQuery);
