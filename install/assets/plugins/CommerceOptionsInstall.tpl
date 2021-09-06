//<?php
/**
 * Commerce Options Install
 *
 * Commerce options installer
 *
 * @category    plugin
 * @author      mnoskov
 * @internal    @events OnWebPageInit,OnManagerPageInit,OnPageNotFound
 * @internal    @modx_category Commerce
 * @internal    @installset base
*/

$modx->clearCache('full');

$table = $modx->getFullTablename('commerce_tvo');

$modx->db->query("
    CREATE TABLE IF NOT EXISTS $table (
        `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
        `tmplvar_id` int(10) unsigned NOT NULL,
        `output_type` enum('radio','checkbox') NOT NULL DEFAULT 'radio',
        `chunk` varchar(255) NOT NULL,
        `efilter_chunk` varchar(255) NOT NULL,
        `created_at` timestamp NULL DEFAULT NULL,
        `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `tmplvar_id` (`tmplvar_id`)
    ) ENGINE=InnoDB  DEFAULT CHARSET=utf8;
");

$modx->db->query("ALTER TABLE $table CHANGE `output_type` `output_type` ENUM('radio', 'checkbox', 'dropdown') CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT 'radio';", false);
$modx->db->query("ALTER TABLE $table ADD `required` TINYINT(1) NOT NULL DEFAULT '0' AFTER `output_type`;", false);

$modx->db->query("
    CREATE TABLE IF NOT EXISTS " . $modx->getFullTablename('commerce_tvo_values') . " (
        `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
        `tmplvar_id` int(10) unsigned NOT NULL,
        `title` varchar(255) NOT NULL,
        `image` text NOT NULL,
        `modifier` enum('add','subtract','multiply','replace') NOT NULL DEFAULT 'add',
        `amount` float NOT NULL DEFAULT '0',
        `fields` mediumtext NOT NULL,
        `meta` mediumtext NOT NULL,
        `sort` int(10) unsigned NOT NULL,
        `created_at` timestamp NULL DEFAULT NULL,
        `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `tmplvar_id` (`tmplvar_id`)
    ) ENGINE=InnoDB  DEFAULT CHARSET=utf8;
");

$modx->db->query("
    CREATE TABLE IF NOT EXISTS " . $modx->getFullTablename('commerce_tvo_products_values') . " (
        `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
        `product_id` int(10) unsigned NOT NULL,
        `tmplvar_id` int(10) unsigned NOT NULL,
        `value_id` int(10) unsigned NOT NULL,
        `modifier` enum('add','subtract','multiply','replace') NOT NULL DEFAULT 'add',
        `amount` float NOT NULL DEFAULT '0',
        `count` float unsigned NOT NULL DEFAULT '1',
        `selected` tinyint(1) unsigned NOT NULL DEFAULT '0',
        `created_at` timestamp NULL DEFAULT NULL,
        `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `product_id` (`product_id`),
        KEY `tmplvar_id` (`tmplvar_id`)
    ) ENGINE=InnoDB  DEFAULT CHARSET=utf8;
");

$modx->db->query("
    CREATE TABLE IF NOT EXISTS " . $modx->getFullTablename('commerce_tvo_group_values') . " (
        `product_id` int(10) unsigned NOT NULL,
        `group_id` int(10) unsigned NOT NULL,
        `tmplvar_id` int(10) unsigned NOT NULL,
        `product_value_id` int(10) unsigned NOT NULL,
        PRIMARY KEY (`product_id`,`group_id`,`tmplvar_id`,`product_value_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
");

$tableEventnames = $modx->getFullTablename('system_eventnames');

$events = [
    'OnManagerBeforeTmplvarValuesRender',
    'OnManagerBeforeTmplvarValuesSave',
];

$query  = $modx->db->select('*', $tableEventnames, "`groupname` = 'CommerceOptions'");
$exists = [];

while ($row = $modx->db->getRow($query)) {
    $exists[$row['name']] = $row['id'];
}

foreach ($events as $event) {
    if (!isset($exists[$event])) {
        $modx->db->insert([
            'name'      => $event,
            'service'   => 6,
            'groupname' => 'CommerceOptions',
        ], $tableEventnames);
    }
}

// remove installer
$tablePlugins    = $modx->getFullTablename('site_plugins');
$tableEvents     = $modx->getFullTablename('site_plugin_events');

$query = $modx->db->select('id', $tablePlugins, "`name` = '" . $modx->event->activePlugin . "'");

if ($id = $modx->db->getValue($query)) {
   $modx->db->delete($tablePlugins, "`id` = '$id'");
   $modx->db->delete($tableEvents, "`pluginid` = '$id'");
}
