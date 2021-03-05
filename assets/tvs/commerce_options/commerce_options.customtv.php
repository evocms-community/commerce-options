<?php

if (IN_MANAGER_MODE != 'true') {
    exit;
}

if (empty($modx->commerce) && !defined('COMMERCE_INITIALIZED')) {
    return 'Commerce plugin required!';
}

echo ci()->optionsProcessor->renderProductTmplvarForm([
    'row'  => $row,
    'init' => !defined('TVCO_INITIALIZED'),
]);

if (!defined('TVCO_INITIALIZED')) {
    define('TVCO_INITIALIZED', true);
}
