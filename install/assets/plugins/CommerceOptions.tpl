//<?php
/**
 * Commerce Options
 *
 * Commerce Options
 *
 * @category    plugin
 * @author      mnoskov
 * @version     0.1.7
 * @internal    @events OnInitializeCommerce,OnDocFormRender,OnDocFormSave,OnTVFormRender,OnTVFormSave,OnTVFormDelete,OnEmptyTrash,OnDocDuplicate,OnBeforeCartItemAdding,OnCommerceAjaxResponse,OnManagerBeforeDefaultCurrencyChange,OnWebPagePrerender
 * @internal    @modx_category Commerce
 * @internal    @installset base
 */

if (!defined('COMMERCE_INITIALIZED')) {
    return;
}

switch ($modx->event->name) {
    case 'OnInitializeCommerce': {
        ci()->set('optionsProcessor', function($ci) use ($params) {
            require_once MODX_BASE_PATH . 'assets/plugins/commerce-options/src/CommerceOptions.php';
            return new CommerceOptions($params);
        });
        break;
    }

    case 'OnBeforeCartItemAdding': {
        ci()->optionsProcessor->OnBeforeCartItemAdding($params);
        break;
    }

    default: {
        $processor = ci()->optionsProcessor;

        if (method_exists($processor, $modx->event->name)) {
            call_user_func_array([$processor, $modx->event->name], ['params' => &$params]);
        }
        break;
    }
}
