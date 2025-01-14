import { AnalyticsModule } from '../../components/types';
import { CreateAnalyticsEventObject, SendAnalyticsObject } from './types';
import {
    ANALYTICS_ACTION_STR,
    ANALYTICS_CONFIGURED_STR,
    ANALYTICS_DISPLAYED_STR,
    ANALYTICS_DOWNLOAD_STR,
    ANALYTICS_EVENT_ERROR,
    ANALYTICS_EVENT_INFO,
    ANALYTICS_EVENT_LOG,
    ANALYTICS_EXPRESS_PAGES_ARRAY,
    ANALYTICS_FOCUS_STR,
    ANALYTICS_INPUT_STR,
    ANALYTICS_RENDERED_STR,
    ANALYTICS_SELECTED_STR,
    ANALYTICS_SUBMIT_STR,
    ANALYTICS_UNFOCUS_STR,
    ANALYTICS_VALIDATION_ERROR_STR
} from './constants';
import { THREEDS2_ERROR, THREEDS2_FULL } from '../../components/ThreeDS2/config';

export const analyticsPreProcessor = (analyticsModule: AnalyticsModule) => {
    // return function with an analyticsModule reference
    return (component: string, analyticsObj: SendAnalyticsObject, uiElementProps = {} as any) => {
        const { type, target } = analyticsObj;

        switch (type) {
            /**
             * INFO
             */
            // Called from BaseElement (when component mounted) or, from DropinComponent (after mounting, when it has finished resolving all the PM promises)
            // &/or, from DropinComponent when a PM is selected
            case ANALYTICS_RENDERED_STR: {
                const { isStoredPaymentMethod, brand } = analyticsObj;

                // Expected from Wallet PMs
                const { isExpress, expressPage } = uiElementProps;

                const hasExpressPage = expressPage && ANALYTICS_EXPRESS_PAGES_ARRAY.includes(expressPage);

                const data = {
                    component,
                    type,
                    ...(typeof isStoredPaymentMethod === 'boolean' && { isStoredPaymentMethod }), // if defined and a boolean...
                    ...(brand && { brand }),
                    ...(typeof isExpress === 'boolean' && { isExpress }),
                    ...(isExpress === true && hasExpressPage && { expressPage }) // We only care about the expressPage value if isExpress is true
                };

                analyticsModule.createAnalyticsEvent({
                    event: ANALYTICS_EVENT_INFO,
                    data
                });
                break;
            }
            case ANALYTICS_CONFIGURED_STR: {
                const { isStoredPaymentMethod, brand } = analyticsObj;
                const data = { component, type, isStoredPaymentMethod, brand };

                analyticsModule.createAnalyticsEvent({
                    event: ANALYTICS_EVENT_INFO,
                    data
                });
                break;
            }

            case ANALYTICS_FOCUS_STR:
            case ANALYTICS_UNFOCUS_STR:
            case ANALYTICS_DISPLAYED_STR: // issuerList
            case ANALYTICS_INPUT_STR: // issuerList
            case ANALYTICS_DOWNLOAD_STR: // QR codes
                analyticsModule.createAnalyticsEvent({
                    event: ANALYTICS_EVENT_INFO,
                    data: { component, type, target }
                });
                break;

            // - ApplePay & GooglePay when instant PMs
            // - issuerList buttons
            case ANALYTICS_SELECTED_STR: {
                const { issuer } = analyticsObj;
                analyticsModule.createAnalyticsEvent({
                    event: ANALYTICS_EVENT_INFO,
                    data: { component, type, target, issuer }
                });
                break;
            }

            case ANALYTICS_VALIDATION_ERROR_STR: {
                const { validationErrorCode, validationErrorMessage } = analyticsObj;
                analyticsModule.createAnalyticsEvent({
                    event: ANALYTICS_EVENT_INFO,
                    data: { component, type, target, validationErrorCode, validationErrorMessage }
                });
                break;
            }

            /**
             * LOGS
             */
            case ANALYTICS_SUBMIT_STR:
                analyticsModule.createAnalyticsEvent({
                    event: ANALYTICS_EVENT_LOG,
                    data: { component, type, message: 'Shopper clicked pay' }
                });
                break;

            case ANALYTICS_ACTION_STR: {
                const { subtype, message } = analyticsObj;
                analyticsModule.createAnalyticsEvent({
                    event: ANALYTICS_EVENT_LOG,
                    data: { component, type, subtype, message }
                });
                break;
            }

            // General 3DS2 log events: "action handled" (i.e. iframe loaded), data sent, process completed
            case THREEDS2_FULL: {
                const { message, metadata } = analyticsObj;
                analyticsModule.createAnalyticsEvent({
                    event: ANALYTICS_EVENT_LOG,
                    data: { component, type, message, metadata }
                });
                break;
            }

            /**
             * ERRORS
             */
            case THREEDS2_ERROR: {
                const { message, code, errorType } = analyticsObj;
                analyticsModule.createAnalyticsEvent({
                    event: ANALYTICS_EVENT_ERROR,
                    data: { component, type, message, code, errorType }
                });
                break;
            }

            default: {
                analyticsModule.createAnalyticsEvent(analyticsObj as CreateAnalyticsEventObject);
            }
        }
    };
};
