<div class="relation-item<?= !empty($relation['is_last']) ? ' last' : '' ?>" data-id="<?= $relation['tmplvar_id'] ?>">
    <div class="values">
        <?= $caption ?>:<br>

        <?php foreach ($relation['values'] as $value): ?>
            <?= $this->render('product_group_value.tpl', [
                'lang'  => $lang,
                'title' => $values[$value]['title'],
                'value' => $value,
            ]); ?>
        <?php endforeach; ?>

        <select class="add-value" data-tvid="<?= $relation['tmplvar_id'] ?>"></select>
    </div>

    <?php if (empty($relation['is_last'])): ?>
        <div class="items-container children-container">
            <?php if (!empty($relation['children'])): ?>
                <?php foreach ($relation['children'] as $relation): ?>
                    <?= $this->render('product_group.tpl', [
                        'lang'      => $lang,
                        'relation'  => $relation,
                        'values'    => $values,
                        'tmplvars'  => $tmplvars,
                        'caption'   => $tmplvars[$relation['tmplvar_id']]['caption'],
                    ]); ?>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    <?php endif; ?>
</div>
