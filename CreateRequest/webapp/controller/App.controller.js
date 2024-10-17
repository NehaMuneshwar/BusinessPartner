sap.ui.define([
    "./BaseController",
],
	/**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController) {
        "use strict";

        return BaseController.extend("com.sap.bpm.CreateRequest.controller.App", {
            onInit: function () {
                var oThisController = this;

                oThisController.fnInitializeApp();
                oThisController.getContentDensityClass();
            }
        });
    });
