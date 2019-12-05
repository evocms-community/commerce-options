<div id="tabCommerceValues" style="display: none;">
    <h2 class="tab"><?= $lang['tvco.tmplvar_values'] ?></h2>

    <div class="container container-body">
        <div class="row form-row tvco-extra-row">
            <label class="col-md-3 col-lg-2">
                <?= $lang['tvco.output_type'] ?>
            </label>

            <div class="col-md-9 col-lg-10">
                <select name="tvco_extra[output_type]" size="1" class="form-control" onchange="documentDirty=true;">
                    <?php foreach ($outputs as $output): ?>
                        <option value="<?= $output ?>"<?= !empty($extra['output_type']) && $extra['output_type'] == $output ? ' selected' : '' ?>><?= $lang['tvco.' . $output] ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
        </div>

        <div class="row form-row tvco-extra-row">
            <label class="col-md-3 col-lg-2">
                <?= $lang['tvco.chunk'] ?>
                <small class="form-text text-muted"><?= $lang['tvco.chunk_note'] ?></small>
            </label>

            <div class="col-md-9 col-lg-10">
                <input type="text" name="tvco_extra[chunk]" maxlength="255" class="form-control" onchange="documentDirty=true;" value="<?= htmlentities($extra['chunk']) ?>">
            </div>
        </div>

        <div class="row form-row tvco-extra-row">
            <label class="col-md-3 col-lg-2">
                <?= $lang['tvco.efilter_chunk'] ?>
            </label>

            <div class="col-md-9 col-lg-10">
                <input type="text" name="tvco_extra[efilter_chunk]" maxlength="255" class="form-control" onchange="documentDirty=true;" value="<?= htmlentities($extra['efilter_chunk']) ?>">
            </div>
        </div>
    </div>

    <div class="table-responsive">
        <table class="table data tmplvar-values">
            <thead>
                <tr>
                    <td style="width: 1%;"></td>
                    <td><?= $lang['tvco.image'] ?></td>
                    <td style="width: 55%;"><?= $lang['tvco.name'] ?></td>
                    <td style="width: 1%;"><?= $lang['tvco.default_price_title'] ?></td>
                    <td style="width: 100px;"><?= $lang['tvco.sort_title'] ?></td>
                    <td style="width: 1%;"></td>
                </tr>
            </thead>

            <tfoot>
                <tr>
                    <td colspan="6" style="text-align: right;">
                        <a href="#" class="btn btn-primary btn-sm add-tmplvar-value"><?= $lang['tvco.add_value'] ?></a>
                    </td>
                </tr>
            </tfoot>

            <tbody>
                <?php foreach ($values as $iteration => $value): ?>
                    <?= $this->render('tv_tab_row.tpl', [
                        'lang'      => $lang,
                        'modifiers' => $modifiers,
                        'iteration' => $iteration,
                        'row'       => $value,
                    ]); ?>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<link rel="stylesheet" href="../assets/plugins/commerce-options/css/tv.css?<?= $version ?>">
<script src="../assets/plugins/commerce-options/js/jquery-ui.min.js"></script>
<script src="../assets/plugins/commerce-options/js/common.js?<?= $version ?>"></script>
<script src="../assets/plugins/commerce-options/js/tv.js?<?= $version ?>"></script>
<script>
    var _co = {
        imagesBrowser: '<?= MODX_MANAGER_URL . 'media/browser/' . $modx->getConfig('which_browser') . '/browse.php' ?>',
        thumbsDir: '<?= $modx->getConfig('thumbsDir') ?>',
        nextValue: <?= $iteration + 1 ?>
    };
</script>

<script type="text/template" id="attrValueTpl">
    <?= $this->render('tv_tab_row.tpl', [
        'lang'      => $lang,
        'modifiers' => $modifiers,
        'iteration' => '{%iteration%}',
        'row'       => [
            'title'    => '',
            'image'    => '',
            'modifier' => '',
            'amount'   => '',
            'sort'     => '{%sort%}',
        ],
    ]); ?>
</script>
