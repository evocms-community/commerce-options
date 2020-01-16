# Options for Evolution CMS Commerce

### Вывод опций
Вызов сниппета просто поместить в форму добавления товара. Для изменения цены элементу с ценой добавить атрибут `data-commerce-price` с значением оригинальной цены.
```html
<form action="#" data-commerce-action="add">
    ...
    <div data-commerce-price="[*price*]">[[PriceFormat? &price=`[*price*]`]]</div>
    [[CommerceOptions]]
    ...
</form>
```

### Параметры сниппета
<table>
<tr><th>Параметр</th><th>Значение по умолчанию</th><th>Описание</th></tr>
<tr><td>docid</td><td><code>[*id*]</code></td><td>Товар, которому принадлежат опции</td></tr>
<tr><td>detach</td><td>0</td><td>Может принимать значение 0, 1, или список tv-параметров через запятую.<br>Указанные tv-параметры (или все, если 1) будут помещены в плейсхолдеры с префиксом <code>detachPrefix</code> с возможностью вывода в произвольном месте страницы.</td></tr>
<tr><td>hideInactive</td><td>0</td><td>Может принимать значение 0, 1, или список tv-параметров через запятую.<br>Указанные tv-параметры будут скрываться, если они недоступны для выбора</td></tr>
<tr><td>autoCheckSameOptions</td><td>0</td><td>Может принимать значение 0, 1, или список tv-параметров через запятую.<br>В случае если в указанных tv-параметрах отключается выбранная опция, и есть та же доступная опция с другой ценой, она будет выбрана</td></tr>
<tr><td>uncheckDisabled</td><td>1</td><td>Может принимать значение 0, 1, или список tv-параметров через запятую.<br>Для отключенных опций в указанных tv-параметрах выбор будет снят</td></tr>
<tr><td>api</td><td>0</td><td>0 или 1. Если 1, сниппет просто вернет массив данных</td></tr>
<tr><td>registerScripts</td><td>1</td><td>0 или 1. Если 1, на страницу будет добавлен управляющий javascript</td></tr>
<tr><td>detachPrefix</td><td><code>tvco.</code></td><td>Префикс плейсхолдеров для блоков опций</td></tr>
</table>

### Шаблоны

Также в параметрах можно указать шаблоны вывода опций по правилам шаблонизатора DLTemplate.

`containerTpl` - Шаблон контейнера опций.
```html
<div class="tvco" data-tvco-container>
    [+wrap+]
</div>
```

Следующие шаблоны можно указывать для каждого tv-параметра отдельно. Например `colorTvTpl` или `colorRadioTpl`.

`modifierTpl` - Шаблон краткой модификации цены.
```html
([+value.sign+][+value.amount+])
```

`tvTpl` - Шаблон блока опций для одного tv-параметра.
```html
<div class="tvco-var tvco-[+tv.output_type+]" data-tvco-block data-id="[+tv.id+]">
    <div class="tvco-title">[+tv.caption+]</div>
    <ul>
        [+wrap+]
    </ul>
</div>
```

`radioTpl` - 
```html
<li data-tvco-row[+hidden_style+]>
    <label>
        <input type="radio" name="[+tv.controlname+]" value="[+value.id+]" data-value="[+value.value_id+]"[+selected_attr+]>
        [+value.title+][+modifier+]
    </label>
```

`checkboxTpl` - 
```html
<li data-tvco-row[+hidden_style+]>
    <label>
        <input type="checkbox" name="[+tv.controlname+][]" value="[+value.id+]" data-value="[+value.value_id+]"[+selected_attr+]>
        [+value.title+][+modifier+]
    </label>
```
