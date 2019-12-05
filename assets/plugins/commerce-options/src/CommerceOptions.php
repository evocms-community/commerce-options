<?php

use Commerce\Lexicon;
use Commerce\Module\Renderer;

class CommerceOptions
{
    use Commerce\Module\CustomizableFieldsTrait;

    const VERSION = 'v0.1.0';

    public $lexicon;

    private $params = [];
    private $eventParams = [];
    private $view = null;
    private $tableExtra;
    private $tableValues;
    private $tableProductValues;
    private $tableGroupValues;

    private $modifiers = ['add' => '+', 'subtract' => '-', 'multiply' => 'x', 'replace' => '='];
    private $outputs   = ['radio', 'checkbox', /*'dropdown', 'custom'*/];

    public function __construct($params)
    {
        $this->params = $params;

        $modx = ci()->modx;

        $this->tableExtra         = $modx->getFullTablename('commerce_tvo');
        $this->tableValues        = $modx->getFullTablename('commerce_tvo_values');
        $this->tableProductValues = $modx->getFullTablename('commerce_tvo_products_values');
        $this->tableGroupValues   = $modx->getFullTablename('commerce_tvo_group_values');

        $this->lexicon = new Lexicon($modx, [
            'langDir' => 'assets/plugins/commerce-options/lang/',
            'lang'    => $modx->getConfig('manager_language'),
        ]);
    }

    public function getVersion()
    {
        return self::VERSION;
    }

    private function getRenderer()
    {
        if ($this->view === null) {
            $this->view = new Renderer(ci()->modx, null, ['path' => __DIR__ . '/../templates']);
        }

        return $this->view;
    }

    public function modifyPrice($price, $modifier, $amount)
    {
        if ($amount > 0) {
            switch ($modifier) {
                case 'add': {
                    $price += $amount;
                    break;
                }

                case 'subtract': {
                    $price -= $amount;
                    break;
                }

                case 'multiply': {
                    $price *= $amount;
                    break;
                }

                case 'replace': {
                    $price = $amount;
                    break;
                }
            }
        }

        return $price;
    }

    public function OnBeforeCartItemAdding(&$params)
    {
        if ($params['instance'] == 'products' && !empty($params['item']['meta']['tvco'])) {
            $modx  = ci()->modx;

            $ids = array_filter($params['item']['meta']['tvco'], function($id) {
                return is_numeric($id);
            });

            $doc = $modx->getDocument($params['item']['id'], 'id,template', 'all');
            
            $tableTmplvars  = $modx->getFullTablename('site_tmplvars');
            $tableTemplates = $modx->getFullTablename('site_tmplvar_templates');

            $query = $modx->db->query("SELECT pv.id, tv.id AS tv_id, tv.caption, v.title AS `value`, pv.modifier, pv.amount
                FROM {$this->tableProductValues} pv
                JOIN $tableTmplvars tv ON tv.id = pv.tmplvar_id
                JOIN {$this->tableValues} v ON v.id = pv.value_id
                JOIN $tableTemplates tpls ON tpls.tmplvarid = tv.id
                WHERE tpls.templateid = '{$doc['template']}'
                AND pv.product_id = '{$doc['id']}'
                AND pv.id IN ('" . implode("','", $ids) . "')
                ORDER BY tpls.rank, v.sort;
            ");

            $values = $meta = [];
            $price = $params['item']['price'];

            while ($row = $modx->db->getRow($query)) {
                $price = $this->modifyPrice($price, $row['modifier'], $row['amount']);

                if (isset($values[$row['tv_id']])) {
                    $values[$row['tv_id']] .= ', ' . $row['value'];
                } else {
                    $values[$row['tv_id']] = $row['caption'] . ': ' . $row['value'];
                }

                $meta[] = $row;
            }

            $params['item']['meta']['tvco'] = $meta;
            $params['item']['price'] = $price;
            $params['item']['options'][] = implode("\n", $values);
        }

        return true;
    }

    /**
     * Called at OnManagerBeforeDefaultCurrencyChange event.
     * When manager changes the default currency, we recalculate all modifiers
     */
    public function OnManagerBeforeDefaultCurrencyChange($params)
    {
        $db = ci()->db;
        $currency = ci()->currency;

        foreach ([$this->tableValues, $this->tableProductValues] as $table) {
            $query = $db->select('*', $table, "`amount` != 0");

            while ($row = $db->getRow($query)) {
                $amount = $currency->convert($row['amount'], $params['old']['code'], $params['new']['code']);
                $db->update(['amount' => $amount], $table, "`id` = '" . $row['id'] . "'");
            }
        }
    }

    public function OnTVFormRender($params)
    {
        $modx = ci()->modx;
        $db   = $modx->db;
        $view = $this->getRenderer();

        $values = $extra = [];
        if (!empty($params['id'])) {
            $values = $db->makeArray($db->select('*', $this->tableValues, "`tmplvar_id` = '" . $params['id'] . "'", "`sort`"));
            $extra  = $db->getRow($db->select('*', $this->tableExtra, "`tmplvar_id` = '" . $params['id'] . "'"));
        }

        $output = $view->render('tv_tab.tpl', [
            'lang'      => $this->lexicon->loadLang(['tvco']),
            'version'   => self::VERSION,
            'modifiers' => array_keys($this->modifiers),
            'outputs'   => $this->outputs,
            'values'    => $values,
            'extra'     => $extra,
        ]);

        $modx->event->setOutput($output);
    }

    public function OnTVFormSave($params)
    {
        $modx  = ci()->modx;
        $db    = $modx->db;
        $table = $this->tableExtra;

        if ($_POST['type'] == 'custom_tv:commerce_options') {
            $db->update([
                'elements' => '@EVAL if (function_exists("ci")) { return ci()->optionsProcessor->getAvailableValues("' . $params['id'] . '"); }',
            ], $modx->getFullTablename('site_tmplvars'), "`id` = '" . $params['id'] . "'");

            if (!empty($_POST['tvco_extra'])) {
                $row = $db->getRow($db->select('*', $table, "`tmplvar_id` = '" . $params['id'] . "'"));

                $data = [
                    'output_type'   => $db->escape($_POST['tvco_extra']['output_type']),
                    'chunk'         => $db->escape($_POST['tvco_extra']['chunk']),
                    'efilter_chunk' => $db->escape($_POST['tvco_extra']['efilter_chunk']),
                ];

                if ($row) {
                    $db->update($data, $table, "`id` = '" . $row['id'] . "'");
                } else {
                    $db->insert(array_merge($data, [
                        'tmplvar_id' => $params['id'],
                        'created_at' => date('Y-m-d H:i:s'),
                    ]), $table);
                }
            }
        }

        $table  = $this->tableValues;
        $exists = $db->makeArray($db->select('*', $table, "`tmplvar_id` = '" . $params['id'] . "'"), 'id');

        if (!empty($_POST['tvo_values'])) {
            $values = $_POST['tvo_values'];
            $sort   = 0;

            uasort($values, function($a, $b) {
                return $a['sort'] - $b['sort'];
            });

            foreach ($values as $row) {
                $data = [
                    'title'    => $db->escape($row['title']),
                    'image'    => $db->escape($row['image']),
                    'modifier' => $db->escape($row['modifier']),
                    'amount'   => floatval($row['amount']),
                    'sort'     => $sort,
                ];

                if (!empty($row['id']) && isset($exists[$row['id']])) {
                    $db->update($data, $table, "`id` = '" . intval($row['id']) . "'");
                    unset($exists[$row['id']]);
                } else {
                    $db->insert(array_merge($data, [
                        'tmplvar_id' => $params['id'],
                        'created_at' => date('Y-m-d H:i:s'),
                    ]), $table);
                }

                $sort += 10;
            }
        }

        if (!empty($exists)) {
            $db->delete($table, "`id` IN (" . implode(',', array_keys($exists)). ")");
        }
    }

    public function OnTVFormDelete($params)
    {
        if (!empty($params['id'])) {
            $db = ci()->db;

            $where = "`tmplvar_id` = '" . intval($params['id']) . "'";
            $db->delete($this->tableProductValues, $where);
            $db->delete($this->tableGroupValues, $where);
            $db->delete($this->tableExtra, $where);
            $db->delete($this->tableValues, $where);
        }
    }

    private function recursiveGroupBy($rows = [], $keys = [])
    {
        $key = array_shift($keys);
        $result = [];

        foreach ($rows as $row) {
            if (isset($row[$key])) {
                $group_key = $row[$key];

                if (!isset($result[$group_key])) {
                    $result[$group_key] = [
                        'tmplvar_id' => $key,
                        'rows' => [],
                    ];
                }

                if (!empty($keys)) {
                    unset($row[$key]);
                    $result[$group_key]['rows'][] = $row;
                } else {
                    $result[$group_key]['rows'] = $group_key;
                }
            }
        }

        if (!empty($keys)) {
            foreach ($result as $group_key => $data) {
                $rows = array_merge(['values' => [$group_key]], $this->recursiveGroupBy($data['rows'], $keys));
                unset($data['rows']);
                $data = array_merge($data, $rows);
                $result[$group_key] = $data;
            }

            $hashes = [];

            foreach ($result as $group_key => $rows) {
                $hash = $rows['hash'];

                if (!isset($hashes[$hash])) {
                    $hashes[$hash] = $rows;
                } else {
                    $hashes[$hash]['values'][] = $group_key;
                }
            }

            $result = $hashes;
        } else if (!empty($result)) {
            $first = reset($result);
            $result = [[
                'tmplvar_id' => $first['tmplvar_id'],
                'values'     => array_column($result, 'rows'),
                'is_last'    => true,
            ]];
        }

        return [
            'hash'     => md5(serialize($result)),
            'children' => $result,
        ];
    }

    private function recursiveExpand($data = [], $levelData = [])
    {
        $result = [];
        $level = count($levelData);

        foreach ($data as $row) {
            if (!empty($row['values'])) {
                foreach ($row['values'] as $value) {
                    $levelData[$level] = $value;

                    if (!empty($row['children'])) {
                        $result = array_merge($result, $this->recursiveExpand($row['children'], $levelData));
                    } else {
                        $result[] = $levelData;
                    }
                }
            }
        }

        return $result;
    }

    private function getTmplvars($template_id)
    {
        $modx = ci()->modx;
        $table_tmplvars = $modx->getFullTablename('site_tmplvars');
        $table_tmplvar_templates = $modx->getFullTablename('site_tmplvar_templates');

        $query = $modx->db->query("SELECT e.*, tv.id, tv.name, tv.caption
            FROM $table_tmplvars tv
            JOIN $table_tmplvar_templates tpls ON tpls.tmplvarid = tv.id
            LEFT JOIN {$this->tableExtra} e ON e.tmplvar_id = tv.id
            WHERE tpls.templateid = '$template_id'
            AND tv.type = 'custom_tv:commerce_options'
            ORDER BY tpls.rank;
        ");

        return $modx->db->makeArray($query, 'id');
    }

    public function OnDocFormRender($params)
    {
        if (!defined('TVCO_INITIALIZED')) {
            return;
        }

        $modx = ci()->modx;
        $db   = $modx->db;
        $view = $this->getRenderer();
        $lang = $this->lexicon->loadLang(['tvco']);

        $raw = $this->getTmplvars($params['template']);

        $tmplvars = [];
        $prev = $parent = null;

        foreach ($raw as $row) {
            $row['parent'] = $parent;
            $row['child']  = null;

            if ($prev) {
                $prev['child'] = $row['id'];
            }

            $parent = $row['id'];
            $tmplvars[$parent] = $row;
            $prev = &$tmplvars[$parent];
        }

        unset($prev);

        if (empty($tmplvars)) {
            return;
        }

        $structure = $values = [];

        if (!empty($params['id'])) {
            $table_tmplvar_templates = $modx->getFullTablename('site_tmplvar_templates');

            $query = $db->query("SELECT gv.group_id, gv.tmplvar_id, pv.value_id, gv.product_value_id, v.title, pv.modifier, pv.amount
                FROM {$this->tableGroupValues} gv
                JOIN {$this->tableProductValues} pv ON gv.product_value_id = pv.id
                JOIN {$this->tableValues} v ON pv.value_id = v.id
                JOIN $table_tmplvar_templates tpls ON tpls.templateid = '{$params['template']}' AND tpls.tmplvarid = gv.tmplvar_id
                WHERE pv.product_id = '{$params['id']}'
                ORDER BY group_id, tpls.rank;
            ");

            $group_id = null;

            while ($row = $db->getRow($query)) {
                if ($group_id === null || $group_id != $row['group_id']) {
                    $group_id = $row['group_id'];
                    $structure[$group_id] = [];
                }

                $structure[$group_id][$row['tmplvar_id']] = $row['product_value_id'];
                $values[$row['product_value_id']] = [
                    'title'    => $row['title'] . (!empty($row['amount']) ? ' (' . $this->modifiers[$row['modifier']] . $row['amount'] . ')' : ''),
                    'modifier' => $row['modifier'],
                    'amount'   => $row['amount'],
                    'value_id' => $row['value_id'],
                ];
            }

            $structure = $this->recursiveGroupBy($structure, array_keys($tmplvars));
            $structure = $structure['children'];
        }

        $output = $view->render('product_groups.tpl', [
            'version'   => self::VERSION,
            'lang'      => $lang,
            'structure' => $structure,
            'values'    => $values,
            'modifiers' => $this->modifiers,
            'tmplvars'  => $tmplvars,
        ]);

        $modx->event->setOutput($output);
    }

    public function renderProductTmplvarForm($params)
    {
        $modx = ci()->modx;
        $db   = $modx->db;
        $view = $this->getRenderer();
        $lang = $this->lexicon->loadLang(['tvco']);

        $tmplvar_id = intval($params['row']['id']);
        $values = $db->makeArray($db->select('*', $this->tableValues, "`tmplvar_id` = '$tmplvar_id'", "`sort`"), 'id');

        foreach ($values as $i => $value) {
            $values[$i]['image'] = $modx->runSnippet('phpthumb', [
                'input'   => $value['image'],
                'options' => 'w=35,h=35',
            ]);
        }

        $extra = $db->getRow($db->select('*', $this->tableExtra, "`tmplvar_id` = '$tmplvar_id'"));
        if (!empty($extra)) {
            $params['row'] = array_merge($extra, $params['row']);
        }

        $selected = [];

        if (isset($_GET['id']) && is_numeric($_GET['id'])) {
            $query = $db->select('*', $this->tableProductValues, "`product_id` = '" . intval($_GET['id']) . "' AND `tmplvar_id` = '$tmplvar_id';");

            while ($row = $db->getRow($query)) {
                if (isset($values[$row['value_id']])) {
                    $selected[] = $row;
                }
            }

            usort($selected, function($a, $b) use ($values) {
                $result = $values[$a['value_id']]['sort'] - $values[$b['value_id']]['sort'];

                if (!$result) {
                    $result = $a['amount'] - $b['amount'];
                }

                return $result;
            });
        }

        return $view->render('product_tv.tpl', [
            'modifiers' => array_keys($this->modifiers),
            'version'   => self::VERSION,
            'init'      => $params['init'],
            'lang'      => $lang,
            'row'       => $params['row'],
            'values'    => $values,
            'selected'  => $selected,
        ]);
    }

    public function OnDocFormSave($params)
    {
        $product_id = intval($params['id']);
        $table      = $this->tableProductValues;
        $db         = ci()->db;
        $hashes     = [];

        if (!empty($_POST['tvco']) && is_array($_POST['tvco'])) {
            foreach ($_POST['tvco'] as $tv_id => $rows) {
                if (is_numeric($tv_id)) {
                    $tv_id = intval($tv_id);

                    if (!empty($rows) && is_array($rows)) {
                        $ids = [];

                        foreach ($rows as $row) {
                            if (!empty($row['id']) && is_numeric($row['id'])) {
                                $ids[] = $row['id'];
                            }
                        }

                        $exists = $db->makeArray($db->select('id', $table, "`product_id` = '$product_id' AND `tmplvar_id` = '$tv_id'"), 'id');


                        try {
                            foreach ($rows as $num => $row) {
                                $data = [
                                    'modifier' => $db->escape($row['modifier']),
                                    'amount'   => floatval($row['amount']),
                                    'value_id' => intval($row['value_id']),
                                    'selected' => !empty($_POST['tvco_selected'][$tv_id]) && in_array($num, $_POST['tvco_selected'][$tv_id]) ? 1 : 0,
                                ];

                                if (!empty($row['id']) && isset($exists[$row['id']])) {
                                    $db->update($data, $table, "`id` = '" . intval($row['id']) . "'");
                                    $id = $row['id'];
                                    unset($exists[$row['id']]);
                                } else {
                                    $id = $db->insert(array_merge($data, [
                                        'product_id' => $product_id,
                                        'tmplvar_id' => $tv_id,
                                        'created_at' => date('Y-m-d H:i:s'),
                                    ]), $table);
                                }

                                $hashes[$row['hash']] = [
                                    'id'    => $id,
                                    'tv_id' => $tv_id,
                                ];
                            }

                            if (!empty($exists)) {
                                $db->delete($table, "`id` IN ('" . implode("', '", array_keys($exists)) . "')");
                            }
                        } catch (\Exception $e) {
                            ci()->modx->logEvent(0, 3, 'Cannot save product options: ' . $e->getMessage(), 'Commerce Options');
                            return;
                        }
                    } else {
                        $db->delete($table, "`product_id` = '$product_id' AND `tmplvar_id` = '$tv_id'");
                    }
                }
            }

            if (!empty($_POST['tvco_relations']) && is_string($_POST['tvco_relations'])) {
                $json = json_decode($_POST['tvco_relations'], true);

                if (is_array($json)) {
                    $groups = $this->recursiveExpand($json);

                    try {
                        $db->delete($this->tableGroupValues, "`product_id` = '$product_id'");

                        foreach ($groups as $group_num => $group) {
                            foreach ($group as $hash) {
                                if (!isset($hashes[$hash])) {
                                    continue;
                                }

                                $db->insert([
                                    'product_id'       => $product_id,
                                    'group_id'         => $group_num + 1,
                                    'tmplvar_id'       => $hashes[$hash]['tv_id'],
                                    'product_value_id' => $hashes[$hash]['id'],
                                ], $this->tableGroupValues);
                            }
                        }
                    } catch (\Exception $e) {
                        ci()->modx->logEvent(0, 3, 'Cannot save product options relations: ' . $e->getMessage(), 'Commerce Options');
                        return;
                    }

                }
            }
        }
    }

    public function OnDocDuplicate($params)
    {
        $db = ci()->db;

        try {
            $rel = [];

            $query = $db->select('*', $this->tableProductValues, "`product_id` = '" . $params['id'] . "'");

            while ($row = $db->getRow($query)) {
                $id = $row['id'];
                unset($row['id']);
                $row['product_id'] = $params['new_id'];
                $rel[$id] = $db->insert($row, $this->tableProductValues);
            }

            $query = $db->select('*', $this->tableGroupValues, "`product_id` = '" . $params['id'] . "'");

            while ($row = $db->getRow($query)) {
                if (isset($rel[$row['product_value_id']])) {
                    unset($row['id']);
                    $row['product_id'] = $params['new_id'];
                    $row['product_value_id'] = $rel[$row['product_value_id']];
                    $db->insert($row, $this->tableGroupValues);
                }
            }
        } catch (\Throwable $e) {
            ci()->modx->logEvent(0, 3, 'Cannot duplicate product options: ' . $e->getMessage(), 'Commerce Options');
            return;
        }
    }

    public function OnEmptyTrash($params)
    {
        if (!empty($params['ids'])) {
            $db = ci()->db;

            try {
                $where = "`product_id` IN ('" . implode("','", $params['ids']) . "')";
                $db->delete($this->tableProductValues, $where);
                $db->delete($this->tableGroupValues, $where);
            } catch (\Throwable $e) {
                ci()->modx->logEvent(0, 3, 'Cannot delete product options: ' . $e->getMessage(), 'Commerce Options');
                return;
            }
        }
    }

    public function getAvailableValues($tmplvar_id)
    {
        $db = ci()->db;
        $extra = $db->getRow($db->select('*', $this->tableExtra, "`tmplvar_id` = '$tmplvar_id'"));

        $chunk = !empty($extra['efilter_chunk']) ? $extra['efilter_chunk'] : '@CODE:[+title+]';

        $tpl = ci()->tpl;
        $out = [];

        $query = $db->select('*', $this->tableValues, "`tmplvar_id` = '$tmplvar_id'");

        while ($row = $db->getRow($query)) {
            $out[] = $tpl->parseChunk($chunk, $row) . '==' . $row['id'];
        }

        return implode('||', $out);
    }

    private function getExtendedEventParam($key, $extends = [], $default = '')
    {
        $result = $default;

        do {
            if (isset($this->eventParams[$key])) {
                $result = $this->eventParams[$key];
            }

            $part = array_shift($extends);
            $key = $part . ucfirst($key);
        } while (!empty($part));

        return $result;
    }

    private function getGroupsRelations($structure)
    {
        $result = [];
        $neighbours = [];

        foreach ($structure as $row) {
            if (!empty($row['values'])) {
                $neighbours = array_merge($neighbours, $row['values']);
            }
        }

        foreach ($structure as $row) {
            if (!empty($row['values'])) {
                $children = [];

                if (!empty($row['children'])) {
                    foreach ($this->getGroupsRelations($row['children']) as $id => $ids) {
                        $result[$id] = $ids;
                    }
                }

                foreach ($row['values'] as $value) {
                    if (empty($result[$value])) {
                        $result[$value] = [];
                    }

                    $result[$value] = array_merge($result[$value], $row['values'], $neighbours);

                    if (!empty($row['children'])) {
                        foreach ($row['children'] as $children) {
                            if (!empty($children['values'])) {
                                $result[$value] = array_merge($result[$value], $children['values']);
                            }
                        }
                    }

                    $result[$value] = array_values(array_unique($result[$value]));
                }
            }
        }

        return $result;
    }

    private function recursiveCleanStructure($structure)
    {
        $result = [];

        foreach ($structure as $row) {
            unset($row['hash']);

            if (!empty($row['children'])) {
                $row['children'] = $this->recursiveCleanStructure($row['children']);
            }

            $result[] = $row;
        }

        return $result;
    }

    public function renderOptions($params)
    {
        $modx = ci()->modx;
        $db = $modx->db;
        $this->eventParams = $params;

        $currency = ci()->currency;

        $product_id  = $params['docid'];
        $product     = $modx->getDocument($product_id, 'template', 'all');
        $template_id = $product['template'];
        $tmplvars    = $this->getTmplvars($template_id);

        $query = $db->query("SELECT pv.id, pv.tmplvar_id, value_id, v.title, v.image, pv.modifier, pv.amount, v.fields, pv.selected
            FROM {$this->tableProductValues} pv
            JOIN {$this->tableValues} v ON v.id = pv.value_id
            WHERE `product_id` = '$product_id'
            AND `count` > 0
            ORDER BY v.`sort`, pv.`amount`;
        ");

        $product_values = [];
        $options = [];

        while ($row = $db->getRow($query)) {
            if (!isset($product_values[$row['tmplvar_id']])) {
                $product_values[$row['tmplvar_id']] = [];
            }

            if ($row['amount'] != 0 && in_array($row['modifier'], ['add', 'subtract', 'replace'])) {
                $row['amount'] = $currency->convertToActive($row['amount']);
            }

            $row['fields'] = json_decode($row['fields'], true);
            $product_values[$row['tmplvar_id']][$row['id']] = $row;
            $options[$row['id']] = array_intersect_key($row, array_flip(['id', 'modifier', 'amount', 'image', 'title', 'fields']));
        }

        $query = $db->select('*', $this->tableGroupValues, "`product_id` = '$product_id'");
        $groups = [];

        while ($row = $db->getRow($query)) {
            if (!isset($product_values[$row['tmplvar_id']][$row['product_value_id']])) {
                continue;
            }

            if (!isset($groups[$row['group_id']])) {
                $groups[$row['group_id']] = [];
            }

            $groups[$row['group_id']][$row['tmplvar_id']] = $row['product_value_id'];
        }

        $structure = $this->recursiveGroupBy($groups, array_keys($tmplvars));
        $structure = $this->recursiveCleanStructure($structure['children']);

        $tmplvarsNames = [];

        foreach ($tmplvars as $tv) {
            $tmplvarsNames[$tv['name']] = $tv;
        }

        $json = [
            'structure' => $structure,
            'options'   => $options,
            'tmplvars'  => array_values(array_map(function($tv) {
                return $tv['id'];
            }, $tmplvars)),
        ];

        foreach (['detach', 'hideInactive', 'autoCheckSameOptions', 'uncheckDisabled'] as $param) {
            $json[$param] = [];

            if ($params[$param] === true || $params[$param] == 1) {
                foreach ($tmplvarsNames as $tv) {
                    $json[$param][] = $tv['id'];
                }
            } else if (!empty($params[$param])) {
                $fields = array_map('trim', explode(',', $params[$param]));

                foreach ($fields as $field) {
                    if (isset($tmplvarsNames[$field])) {
                        $json[$param][] = $tmplvarsNames[$field]['id'];
                    }
                }
            }
        }

        $tpl = ci()->tpl;
        $out = [];

        foreach ($tmplvars as $tv_id => $tv) {
            if (empty($product_values[$tv_id])) {
                continue;
            }

            $rows = '';
            $output_type = !empty($tv['output_type']) ? $tv['output_type'] : 'radio';
            $chunk = $this->getExtendedEventParam($output_type . 'Tpl', [$tv['name']]);
            $modifierChunk = $this->getExtendedEventParam('modifierTpl', [$tv['name']]);

            $tv['e'] = [
                'name'    => htmlentities($tv['name']),
                'caption' => htmlentities($tv['caption']),
            ];

            $tv['controlname'] = 'tvcovalues[' . htmlentities($tv['name']) . ']';

            foreach ($product_values[$tv_id] as $value) {
                $value['e'] = [
                    'title' => htmlentities($value['title']),
                    'image' => htmlentities($value['image']),
                ];

                $modifier = '';
                if (!empty($value['amount'])) {
                    $modifier = $tpl->parseChunk($modifierChunk, [
                        'value'  => $value,
                        'tv'     => $tv,
                        'sign'   => $this->modifiers[$value['modifier']],
                        'amount' => in_array($value['modifier'], ['add', 'subtract', 'replace']) ? $currency->format($value['amount']) : $value['amount'],
                    ]);
                }

                $rows .= $tpl->parseChunk($chunk, [
                    'value'    => $value,
                    'tv'       => $tv,
                    'modifier' => $modifier,
                    'selected' => !empty($value['selected']) ? ($output_type == 'dropdown' ? ' selected' : ' checked') : '',
                    'hidden'   => empty($value['selected']) && in_array($tv['id'], $json['hideInactive']) ? ' style="display: none;"' : '',
                ]);
            }

            $chunk = $this->getExtendedEventParam('tvTpl', [$output_type, $tv['name']]);

            $out[$tv['name']] = $tpl->parseChunk($chunk, [
                'wrap' => $rows,
                'tv'   => $tv,
            ]);
        }

        if (!empty($json['detach'])) {
            $prefix = $this->getExtendedEventParam('detachPrefix', []);

            foreach ($json['detach'] as $tv_id) {
                $name = $tmplvars[$tv_id]['name'];

                if (isset($out[$name])) {
                    $modx->setPlaceholder($prefix . $name, $out[$name]);
                    unset($out[$name]);
                }
            }

            $modx->setPlaceholder($prefix . 'all', implode($out));
            $out = [];
        }

        $modx->regClientScript(MODX_BASE_URL . 'assets/plugins/commerce-options/js/front.js?' . self::VERSION);
        $modx->regClientScript('<script type="text/javascript">
            var _tvco = ' . json_encode($json, JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK) . ';
        </script>');

        return $tpl->parseChunk($this->getExtendedEventParam('containerTpl'), [
            'wrap' => implode($out),
        ]);
    }
}