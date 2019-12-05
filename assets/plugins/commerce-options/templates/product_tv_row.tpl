<tr data-iteration="<?= $num ?>" data-id="<?= $row['id'] ?>">
    <td style="width: 3rem;">
        <img src="../<?= $value['image'] ?>" alt="">
    </td>

    <td>
        <?= $value['title'] ?>
    </td>

    <td style="text-align: center;">
        <?php if (!empty($tv['output_type']) && $tv['output_type'] == 'checkbox'): ?>
            <input type="checkbox" name="tvco_selected[<?= $tv['id'] ?>][]" value="<?= $num ?>"<?= !empty($row['selected']) ? ' checked' : '' ?>>
        <?php else: ?>
            <input type="radio" name="tvco_selected[<?= $tv['id'] ?>][]" value="<?= $num ?>"<?= !empty($row['selected']) ? ' checked' : '' ?>>
        <?php endif; ?>
    </td>

    <td style="text-align: right; white-space: nowrap;">
        <select class="form-control" name="tvco[<?= $tv['id'] ?>][<?= $num ?>][modifier]" size="1" data-initial-value="<?= $row['modifier'] ?>">
            <?php foreach ($modifiers as $modifier): ?>
                <option value="<?= $modifier ?>"<?= $modifier == $row['modifier'] ? ' selected' : '' ?>><?= $lang['common.modifier_' . $modifier] ?></option>
            <?php endforeach; ?>
        </select>

        <input type="text" class="form-control" name="tvco[<?= $tv['id'] ?>][<?= $num ?>][amount]" value="<?= $row['amount'] ?>" style="width: 50px; text-align: right;">
    </td>

    <td>
        <input type="text" class="form-control" name="tvco[<?= $tv['id'] ?>][<?= $num ?>][count]" value="<?= $row['count'] ?>" style="width: 50px; text-align: right;">
    </td>

    <td>
        <input type="hidden" name="tvco[<?= $tv['id'] ?>][<?= $num ?>][value_id]" value="<?= $value['id'] ?>">
        <input type="hidden" name="tvco[<?= $tv['id'] ?>][<?= $num ?>][id]" value="<?= $row['id'] ?>">
        <input type="hidden" name="tvco[<?= $tv['id'] ?>][<?= $num ?>][hash]" value="">
        <a href="#" class="remove-value"><i class="fa fa-times"></i></a>
    </td>
</tr>
