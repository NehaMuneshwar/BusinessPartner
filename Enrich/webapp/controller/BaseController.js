sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/m/BusyDialog",

], function (Controller, UIComponent, JSONModel, BusyDialog) {
    "use strict";
    return Controller.extend("com.sap.bpm.Enrich.BaseController", {

        /**
         * Convenience method for getting the view model by name in every controller of the application.
         * @public
         * @param {string} sName the model name
         * @returns {sap.ui.model.Model} the model instance
         */
        getModel: function (sName) {
            return this.getView().getModel(sName);
        },

        /**
         * Convenience method for setting the view model in every controller of the application.
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         * @returns {sap.ui.mvc.View} the view instance
         */
        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        setBusy: function (bStatus) {
            return this.getView().setBusy(bStatus);
        },

        /**
		 * Convenience method for accessing the parent model.
		 * @public
		 * @returns Parent JSON Model "mCommon" defined in manifest
		 */
        getParentModel: function (sName) {
            var oMdl = this.getOwnerComponent().getModel(sName);
            oMdl.setSizeLimit(100000);
            if (!oMdl) {
                oMdl = new JSONModel({});
                this.setModel(oMdl, sName);
            }
            return oMdl;
        },

        /**
        * Convenience method for accessing Component Data.
        * @public
        * @returns Component Data
        */
        getComponentData: function () {
            return this.getOwnerComponent().getComponentData();
        },

		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
        getRouter: function () {
            return UIComponent.getRouterFor(this);
        },

        /**
        * Convenience method for accessing the ContentDesityClass.
        * @public
        * @returns Content Density Class, defined in the component.js
        */
        getContentDensityClass: function () {
            var oThisController = this;
            oThisController.getView().addStyleClass(oThisController.getOwnerComponent().getContentDensityClass());
        },

        /**
        * Convenience method for accessing the Busy Indicator Dialog
        * @public
        * @returns Busy Indicator Dialog
        */

        _BusyDialog: new BusyDialog({
            busyIndicatorDelay: 0
        }),

        /**
        * Convenience method for accessing the Busy Indicator Dialog
        * @public
        * @returns Open Busy Indicator Dialog
        */
        openBusyDialog: function () {
            if (this._BusyDialog) {
                this._BusyDialog.open();
            } else {
                this._BusyDialog = new BusyDialog({
                    busyIndicatorDelay: 0
                });
                this._BusyDialog.open();
            }
        },
        /**
        * Convenience method for accessing the Busy Indicator Dialog
        * @public
        * @returns Close Busy Indicator Dialog
        */
        closeBusyDialog: function () {
            if (this._BusyDialog) {
                this._BusyDialog.close();
            }
        },

        //	@ Method to get text from i!8n Model
        getMessage: function (pMessage, aParametrs) {
            // read msg from i18n model
            var sMsg = "";
            var oMdlI18n = this.getOwnerComponent().getModel("i18n");
            if (oMdlI18n) {
                this._oBundle = oMdlI18n.getResourceBundle();
            } else {
                this._oBundle = null;
                return sMsg;
            }

            if (aParametrs && aParametrs.length) {
                sMsg = this._oBundle.getText(pMessage, aParametrs);
            } else {
                sMsg = this._oBundle.getText(pMessage);
            }

            return sMsg;
        }
    });

}); 