sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "com/sap/bpm/Approval/model/formatter"
], function (BaseController, JSONModel, MessageBox, MessageToast, Fragment, formatter) {
    "use strict";

    return BaseController.extend("com.sap.bpm.Approval.controller.Approval", {
        
        formatter: formatter,
        onInit: function () {
            this.getContentDensityClass();
            this.configureView();
        },

        configureView: function () {

            var sBPCategory = this.getModel().getProperty("/BPRequest/BusinessPartnerCategory");
            if (sBPCategory == "2") {
                this.getModel().setProperty("/isOrganization", true);
                this.getModel().setProperty("/isPerson", false);
            } else if (sBPCategory == "1") {
                this.getModel().setProperty("/isOrganization", false);
                this.getModel().setProperty("/isPerson", true);
            }

            var startupParameters = this.getComponentData().startupParameters;
            var approveText = this.getMessage("APPROVE");
            var rejectText = this.getMessage("REJECT");
            var reworkText = this.getMessage("REWORK");

            var taskInstanceModel = this.getModel("taskInstanceModel");
            var sSubject = taskInstanceModel.getData().subject;
            this.byId("approvalPageHeader").setObjectTitle(sSubject);

            var oThisController = this;

            /**
             * APPROVE BUTTON
             */
            // Implementation for the approve action
            var oPositiveAction = {
                sBtnTxt: approveText,
                onBtnPressed: function () {
                    var oModel = oThisController.getModel();
                    oModel.refresh(true);
                    var processContext = oModel.getData();
                    // Call a local method to perform further action
                    oThisController._triggerComplete(
                        processContext,
                        startupParameters.taskModel.getData().InstanceID,
                        "request is approved"
                    );
                }
            };

            // Add 'Approve' action to the task
            startupParameters.inboxAPI.addAction({
                action: oPositiveAction.sBtnTxt,
                label: oPositiveAction.sBtnTxt,
                type: "Accept"
            }, oPositiveAction.onBtnPressed);

            /**
             * REJECT BUTTON
             */
            // Implementation for the approve action
            var oRejectAction = {
                sBtnTxt: rejectText,
                onBtnPressed: function () {
                    var oModel = oThisController.getModel();
                    oModel.refresh(true);
                    var processContext = oModel.getData();
                    // Call a local method to perform further action
                    oThisController._triggerComplete(
                        processContext,
                        startupParameters.taskModel.getData().InstanceID,
                        "request is rejected"
                    );
                }
            };

            // Add 'Approve' action to the task
            startupParameters.inboxAPI.addAction({
                action: oRejectAction.sBtnTxt,
                label: oRejectAction.sBtnTxt,
                type: "Reject"
            }, oRejectAction.onBtnPressed);

            /**
            * REWORK BUTTON
            */
            // Implementation for the rework action
            var oReworkAction = {
                sBtnTxt: reworkText,
                onBtnPressed: function (oEvent) {
                    var oModel = oThisController.getModel();
                    oModel.refresh(true);
                    var processContext = oModel.getData();

                    // Call a local method to perform further action
                    oThisController._openReworkPopover(
                        oEvent,
                        processContext,
                        startupParameters.taskModel.getData().InstanceID,
                        "rework is requested"
                    );
                }
            };

            // Add 'Rework' action to the task
            startupParameters.inboxAPI.addAction({
                // confirm is a positive action
                action: oReworkAction.sBtnTxt,
                label: oReworkAction.sBtnTxt
            },
                // Set the onClick function
                oReworkAction.onBtnPressed);

        },

        onExit: function () {
            if (this._oPopover) {
                this._oPopover.destroy();
            }
        },

        _openReworkPopover: function (oEvent) {
            var oButton = oEvent.getSource();

            // create popover
            if (!this._oPopover) {

                this.getModel().setProperty("/isCompleteRework", true);
                this.getModel().setProperty("/isAddressRework", false);
                this.getModel().setProperty("/isFinanceRework", false);

                Fragment.load({
                    name: "com.sap.bpm.Approval.view.ReworkPopover",
                    controller: this
                }).then(function (pPopover) {
                    this._oPopover = pPopover;
                    this.getView().addDependent(this._oPopover);
                    this._oPopover.openBy(oButton);
                }.bind(this));
            } else {
                this._oPopover.openBy(oButton);
            }
        },

        handleSendToReworkPress: function (oEvent) {
            this._oPopover.close();

            var startupParameters = this.getComponentData().startupParameters;
            var oModel = this.getModel();
            oModel.refresh(true);
            var processContext = oModel.getData();

            this._triggerComplete(
                processContext,
                startupParameters.taskModel.getData().InstanceID,
                "rework is requested"
            );
        },

        _triggerComplete: function (processContext, taskId, processStatus) {

            var oThisController = this;

            oThisController.setBusy(true);

            var oReworkContext = {}

            if (processStatus == "rework is requested") {
                oReworkContext = {
                    isCompleteRework: oThisController.getModel().getProperty("/isCompleteRework"),
                    isAddressRework: oThisController.getModel().getProperty("/isAddressRework"),
                    isFinanceRework: oThisController.getModel().getProperty("/isFinanceRework"),
                }
            }

            // form the context that will be updated
            var oPayload = {
                context: {
                    comments: processContext.comments,
                    processStatus: processStatus,
                    internal: {
                        reworkRequestDetails: oReworkContext
                    }

                },
                status: "COMPLETED"
            };

            var self = this;

            $.ajax({
                // Call workflow API to get the xsrf token
                // url: "/comsapbpmApproval/bpmworkflowruntime/v1/xsrf-token",
                url: self._getRuntimeBaseURL() + "/bpmworkflowruntime/public/spa/commons/v1/xsrf-token",
                method: "GET",
                headers: {
                    "X-CSRF-Token": "Fetch"
                },
                success: function (result, xhr, data) {

                    // After retrieving the xsrf token successfully
                    var token = data.getResponseHeader("X-CSRF-Token");

                    $.ajax({
                        // Call workflow API to complete the task
                        // url: "/comsapbpmApproval/bpmworkflowruntime/v1/task-instances/" + taskId,
                        url: self._getRuntimeBaseURL() + "/bpmworkflowruntime/v1/task-instances/" + taskId,
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