<div class="tvco-relations" style="display: none;">
    <textarea name="tvco_relations" style="display: none;"></textarea>
    <div class="items-container">
        <?php foreach ($structure as $relation): ?>
            <?= $this->render('product_group.tpl', [
                'lang'      => $lang,
                'relation'  => $relation,
                'values'    => $values,
                'tmplvars'  => $tmplvars,
                'caption'   => $tmplvars[$relation['tmplvar_id']]['caption'],
            ]); ?>
        <?php endforeach; ?>
    </div>
</div>

<script>
    var _tvcorel = {
        tmplvars: <?= json_encode($tmplvars, JSON_UNESCAPED_UNICODE) ?>,
        values: {},
        modifiers: <?= json_encode($modifiers) ?>,
        lang: {
            add_value: '<?= $lang['common.add_value'] ?>',
            add_all_values: '<?= $lang['common.add_all_values'] ?>'
        }
    };
</script>

<script type="text/template" id="tvcorelValTpl">
    <?= $this->render('product_group_value.tpl', [
        'lang'  => $lang,
        'title' => '{%title%}',
        'value' => '',
    ]); ?>
</script>

<script type="text/template" id="tvcorelTpl">
    <?= $this->render('product_group.tpl', [
        'lang'      => $lang,
        'caption'   => '{%caption%}',
        'relation'  => [
            'tmplvar_id' => '{%tmplvar_id%}',
            'values'     => [],
            'children'   => [],
        ],
    ]) ?>
</script>
