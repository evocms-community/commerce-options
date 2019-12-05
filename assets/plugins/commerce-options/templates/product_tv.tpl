<div class="tvco-container" data-id="<?= $row['id'] ?>">
    <input type="hidden" name="tv<?= $row['id'] ?>" id="tv<?= $row['id'] ?>" value="<?= htmlentities($row['value']) ?>">
    <input type="hidden" name="tvco[<?= $row['id'] ?>]" value="">

    <table class="table tvco-values empty">
        <thead>
            <tr>
                <td colspan="2"><?= $lang['tvco.name'] ?></td>
                <td style="width: 1%; text-align: center;"><?= $lang['tvco.selected'] ?></td>
                <td style="width: 1%; text-align: right;"><?= $lang['tvco.option_price_modifier'] ?></td>
                <td style="width: 1%; text-align: right;"><?= $lang['tvco.count_title'] ?></td>
                <td style="width: 1%;"></td>
            </tr>
        </thead>

        <tfoot>
            <tr>
                <td colspan="6">
                    <select class="available-values">
                        <option value=""><?= $lang['tvco.add_value'] ?></option>
                        <option value="all"><?= $lang['tvco.add_all_values'] ?></option>
                        <?php foreach ($values as $valuerow): ?>
                            <option value="<?= $valuerow['id'] ?>"><?= $valuerow['title'] ?></option>
                        <?php endforeach; ?>
                    </select>

                    <a href="#" class="btn btn-secondary clear-values"><?= $lang['tvco.clear_btn'] ?></a>
                </td>
            </tr>
        </tfoot>

        <tbody>
            <?php foreach ($selected as $iteration => $valuerow): ?>
                <?= $this->render('product_tv_row.tpl', [
                    'lang'      => $lang,
                    'modifiers' => $modifiers,
                    'num'       => $iteration,
                    'tv'        => $row,
                    'row'       => $valuerow,
                    'value'     => $values[$valuerow['value_id']],
                ]) ?>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>

<?php if ($init): ?>
    <div class="tab-page" id="tabCommerceOptions">
        <h2 class="tab"><?= $lang['tvco.product_options'] ?></h2>
        <table>
            <tbody>
                <tr class="tvco-relations-wrap">
                    <td>
                        <span class="warning"><?= $lang['tvco.options_relations'] ?></span>
                    </td>
                    <td>
                        <div style="position: relative;"></div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <link rel="stylesheet" href="../assets/plugins/commerce-options/css/tv.css?<?= $version ?>">
    <script src="../assets/plugins/commerce-options/js/jquery-ui.min.js"></script>
    <script src="../assets/plugins/commerce-options/js/common.js?<?= $version ?>"></script>
    <script src="../assets/plugins/commerce-options/js/product.js?<?= $version ?>"></script>

    <script>
        var _tvco = {};
    </script>

    <script type="text/template" id="tvcoValTpl">
        <?= $this->render('product_tv_row.tpl', [
            'lang'      => $lang,
            'modifiers' => $modifiers,
            'num'       => '{%iteration%}',
            'tv'        => [
                'id' => '{%tv_id%}',
            ],
            'row'       => [
                'id'       => '',
                'modifier' => '{%modifier%}',
                'amount'   => '{%amount%}',
                'count'    => '100',
            ],
            'value'     => [
                'id'    => '{%id%}',
                'image' => '{%image%}',
                'title' => '{%title%}',
            ],
        ]) ?>
    </script>
<?php endif; ?>

<script>
    var _tvco_<?= $row['id'] ?> = {
        tv_id: <?= $row['id'] ?>,
        nextValue: <?= empty($iteration) ? 0 : $iteration + 1 ?>,
        values: <?= json_encode($values, JSON_UNESCAPED_UNICODE) ?>
    };
</script>
