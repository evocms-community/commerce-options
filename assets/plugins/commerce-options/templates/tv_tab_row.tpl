<tr>
    <td class="move-handler">
        <i class="fa fa-arrows-v"></i>
        <input type="hidden" name="tvo_values[<?= $iteration ?>][delete]" value="0">
        <?php if (!empty($row['id'])): ?>
            <input type="hidden" name="tvo_values[<?= $iteration ?>][id]" value="<?= $row['id'] ?>">
        <?php endif; ?>
    </td>

    <?php foreach ($row['cells'] as $name => $cell): ?>
        <td<?= !empty($columns[$name]['cellstyle']) ? ' style="' . $columns[$name]['cellstyle'] . '"' : '' ?>><?= $cell ?></td>
    <?php endforeach; ?>

    <td>
        <a href="#" class="delete-tmplvar-value" title="<?= htmlentities($_lang['delete']) ?>"><i class="fa fa-times"></i></a>
    </td>
</tr>
