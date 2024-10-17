sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "com/sap/bpm/Review/model/formatter"
], function (BaseController, JSONModel, MessageBox, MessageToast, formatter) {
    "use strict";

    return BaseController.extend("com.sap.bpm.Review.controller.Review", {

        formatter: formatter,
        onInit: function () {

            this.getContentDensityClass();

            var oResponseModel = new JSONModel(this.getModel().getProperty("/internal/BPCreationResponse/d"));
            this.setModel(oResponseModel);

            this.configureView();
        },

        configureView: function () {

            var sBPCategory = this.getModel().getProperty("/BusinessPartnerCategory");
            if (sBPCategory == "2") {
                this.getModel().setProperty("/isOrganization", true);
                this.getModel().setProperty("/isPerson", false);
            } else if (sBPCategory == "1") {
                this.getModel().setProperty("/isOrganization", false);
                this.getModel().setProperty("/isPerson", true);
            }

            var startupParameters = this.getComponentData().startupParameters;
            var confirmText = this.getMessage("CONFIRM");

            var taskInstanceModel = this.getModel("taskInstanceModel");
            var sSubject = taskInstanceModel.getData().subject;
            this.byId("reviewPageHeader").setObjectTitle(sSubject);

            var oThisController = this;

            /**
             * CONFIRM BUTTON
             */
            // Implementation for the confirm action
            var oPositiveAction = {
                sBtnTxt: confirmText,
                onBtnPressed: function () {
                    var oModel = oThisController.getModel();
                    oModel.refresh(true);
                    var processContext = oModel.getData();
                    // Call a local method to perform further action
                    oThisController._triggerComplete(
                        processContext,
                        startupParameters.taskModel.getData().InstanceID,
                        "Business Partner Data is reviewed and confirmed"
                    );
                }
            };

            // Add 'Confirm' action to the task
            startupParameters.inboxAPI.addAction({
                action: oPositiveAction.sBtnTxt,
                label: oPositiveAction.sBtnTxt,
                type: "Accept"
            }, oPositiveAction.onBtnPressed);

        },

        _triggerComplete: function (processContext, taskId, processStatus) {

            var oThisController = this;

            oThisController.setBusy(true);

            // form the context that will be updated
            var oPayload = {
                context: {
                    "processStatus": processStatus
                },
                "status": "COMPLETED"
            };

            $.ajax({
                // Call workflow API to get the xsrf token
                // url: "/comsapbpmReview/bpmworkflowruntime/v1/xsrf-token",
                url: oThisController._getRuntimeBaseURL() + "/bpmworkflowruntime/public/spa/commons/v1/xsrf-token",
                method: "GET",
                headers: {
                    "X-CSRF-Token": "Fetch"
                },
                success: function (result, xhr, data) {

                    // After retrieving the xsrf token successfully
                    var token = data.getResponseHeader("X-CSRF-Token");

                    $.ajax({
                        // Call workflow API to complete the task
                        // url: "/comsapbpmReview/bpmworkflowruntime/v1/task-instances/" + taskId,
                        url: oThisController._getRuntimeBaseURL() + "/bpmworkflowruntime/v1/task-instances/" + taskId,
                        method: "PATCH",
                        contentType: "application/json",
                        // pass the updated context to the API
                        data: JSON.stringify(oPayload),
                        headers: {
                            // pass the xsrf token retrieved earlier
                            "X-CSRF-Token": token
                        },
                        // refreshTask needs to be called on successful completion
                        success: function (result, xhr, data) {
                            oThisController._refreshTask();
                            oThisController.setBusy(false);
                        },
                        error: function (err) {

                            oThisController.setBusy(false);
                            var sErrorText = oThisController.getMessage("WORKFLOW_SERVICE_ERROR");
                            MessageBox.error(sErrorText + "\n Error: " + errorThrown + ".");
                            return;
                        }

                    });
                },
                error: function (jqXHR, textStatus, errorThrown) {

                    var sErrorText = oThisController.getMessage("WORKFLOW_ACCESS_TOKEN_ERROR");
                    MessageBox.error(sErrorText + "\n Error:" + errorThrown + ".");
                    oThisController.setBusy(false);
                    return;

                }
            });

        },
        _getRuntimeBaseURL: function () {
            var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            var appPath = appId.replaceAll(".", "/");
            var appModulePath = jQuery.sap.getModulePath(appPath);

            return appModulePath;
        },
        // Request Inbox to refresh the control once the task is completed
        _refreshTask: function () {
            var taskId = this.getComponentData().startupParameters.taskModel.getData().InstanceID;
            this.getComponentData().startupParameters.inboxAPI.updateTask("NA", taskId);
            console.log("task is refreshed");
        },
    });
});