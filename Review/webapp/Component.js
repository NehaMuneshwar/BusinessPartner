sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "com/sap/bpm/Review/model/models",
    "sap/ui/model/json/JSONModel"
], function (UIComponent, Device, models, JSONModel) {
    "use strict";

    return UIComponent.extend("com.sap.bpm.Review.Component", {

        metadata: {
            manifest: "json"
        },

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
        // init: function () {
        //     // call the base component's init function
        //     UIComponent.prototype.init.apply(this, arguments);
        //     // enable routing
        //     this.getRouter().initialize();
        //     // set the device model
        //     this.setModel(models.createDeviceModel(), "device");

        //     // get task data
        //     var startupParameters = this.getComponentData().startupParameters;
        //     var taskModel = startupParameters.taskModel;
        //     var taskData = taskModel.getData();
        //     var taskId = taskData.InstanceID;

        //     // read process context & bind it to the view's main model
        //     var contextModel = new JSONModel("/comsapbpmReview/bpmworkflowruntime/v1/task-instances/" + taskId + "/context");
        //     this.setModel(contextModel);

        //     var taskInstanceModel = new JSONModel("/comsapbpmReview/bpmworkflowruntime/v1/task-instances/" + taskId);
        //     this.setModel(taskInstanceModel, "taskInstanceModel");
        // },

        init: function () {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // enable routing
            this.getRouter().initialize();

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // get task data
          /*  var startupParameters = this.getComponentData().startupParameters;
            var taskModel = startupParameters.taskModel;
            var taskData = taskModel.getData();
            var taskId = taskData.InstanceID;*/
           var startupParameters = this.getComponentData().startupParameters;
            this.setModel(startupParameters.taskModel, "task");
            // read process context & bind it to the view's main model
            var contextModel = new JSONModel(this._getTaskInstancesBaseURL() + "/context");
            // contextModel.setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);
            this.setModel(contextModel);

            // read task instance model & bind it to retrieve workflowInstanceId later
            var taskInstanceModel = new JSONModel(this._getTaskInstancesBaseURL());
            taskInstanceModel.setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);
            this.setModel(taskInstanceModel, "taskInstanceModel");

        },

        setTaskModels: function () {
            // set the task model
            var startupParameters = this.getComponentData().startupParameters;
            this.setModel(startupParameters.taskModel, "taskInstanceModel");

            // set the task context model
            var taskContextModel = new sap.ui.model.json.JSONModel(this._getTaskInstancesBaseURL() + "/context");
            this.setModel(taskContextModel);
        },

        _getTaskInstancesBaseURL: function () {
            return this._getWorkflowRuntimeBaseURL() + "/task-instances/" + this.getTaskInstanceID();
        },


        _getWorkflowRuntimeBaseURL: function () {
            var appId = this.getManifestEntry("/sap.app/id");
            var appPath = appId.replaceAll(".", "/");
            var appModulePath = jQuery.sap.getModulePath(appPath);

            // return appModulePath + "/bpmworkflowruntime/v1";
            return appModulePath + "/bpmworkflowruntime/public/workflow/rest/v1";
        },

        getTaskInstanceID: function () {
            return this.getModel("task").getData().InstanceID;
        },

        getContentDensityClass: function () {
            if (!this._sContentDensityClass) {
                if (!sap.ui.Device.support.touch) {
                    this._sContentDensityClass = "sapUiSizeCompact";
                } else {
                    this._sContentDensityClass = "sapUiSizeCozy";
                }
            }
            return this._sContentDensityClass;
        }

    });
});