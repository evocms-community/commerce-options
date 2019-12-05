//<?php
/**
 * Commerce Options
 *
 * Commerce Options
 *
 * @category    plugin
 * @author      mnoskov
 * @version     0.1.0
 * @internal    @events OnDocFormRender,OnDocFormSave,OnTVFormRender,OnTVFormSave,OnTVFormDelete,OnEmptyTrash,OnDocDuplicate,OnManagerMenuPrerender,OnInitializeCommerce,OnBeforeCartItemAdding,OnManagerRegisterCommerceController,OnCommerceAjaxResponse,OnManagerBeforeDefaultCurrencyChange
 * @internal    @modx_category Commerce
 * @internal    @installset base
 */

switch ($modx->event->name) {
    case 'OnInitializeCommerce': {
        ci()->set('optionsProcessor', function($ci) use ($params) {
            require_once MODX_BASE_PATH . 'assets/plugins/commerce-options/src/CommerceOptions.php';
            return new CommerceOptions($params);
        });
        break;
    }

    default: {
        $processor = ci()->optionsProcessor;

        if (method_exists($processor, $modx->event->name)) {
            call_user_func([$processor, $modx->event->name], $params);
        }
        break;
    }
}

