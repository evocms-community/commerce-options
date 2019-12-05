<tr>
    <td class="move-handler">
        <i class="fa fa-arrows-v"></i>
    </td>

    <td>
        <div class="value-image form-cell">
            <div class="preview"></div>
            <input type="text" class="form-control" name="tvo_values[<?= $iteration ?>][image]" value="<?= htmlentities($row['image']) ?>">
            <button type="button" class="btn btn-seconday show-browser"><?= $lang['tvco.select_image'] ?></button>
        </div>
    </td>

    <td>
        <?php if (!empty($row['id'])): ?>
            <input type="hidden" name="tvo_values[<?= $iteration ?>][id]" value="<?= $row['id'] ?>">
        <?php endif; ?>

        <input type="text" class="form-control" name="tvo_values[<?= $iteration ?>][title]" value="<?= htmlentities($row['title']) ?>">
    </td>

    <td style="text-align: right; white-space: nowrap;">
        <select class="form-control" name="tvo_values[<?= $iteration ?>][modifier]" size="1">
            <?php foreach ($modifiers as $modifier): ?>
                <option value="<?= $modifier ?>"<?= $modifier == $row['modifier'] ? ' selected' : '' ?>><?= $lang['tvco.modifier_' . $modifier] ?></option>
            <?php endforeach; ?>
        </select>

        <input type="text" class="form-control" name="tvo_values[<?= $iteration ?>][amount]" value="<?= $row['amount'] ?>" style="width: 50px; text-align: right;">
    </td>

    <td>
        <input type="text" class="form-control" name="tvo_values[<?= $iteration ?>][sort]" value="<?= htmlentities($row['sort']) ?>" rows="4" style="text-align: right;">
    </td>

    <td>
        <a href="#" class="delete-tmplvar-value" title="<?= htmlentities($_lang['delete']) ?>"><i class="fa fa-times"></i></a>
    </td>
</tr>
