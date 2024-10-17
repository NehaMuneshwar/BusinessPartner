sap.ui.define([
    "./BaseController",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Token",
    "sap/m/Label",
    "sap/m/ColumnListItem",
    "sap/m/SearchField",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/comp/filterbar/FilterBar",
    "sap/ui/comp/filterbar/FilterGroupItem",
    "sap/m/Input",
    "sap/ui/model/json/JSONModel",
], function (BaseController, MessageToast, MessageBox, Token, Label, ColumnListItem, SearchField,
    Filter, FilterOperator, FilterBar, FilterGroupItem, Input, JSONModel) {
    "use strict";

    return BaseController.extend("com.sap.bpm.CreateRequest.controller.CreateRequest", {

        /**
         * Called when a controller is instantiated and its View controls (if available) are already created.
         * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
         * @memberOf com.sap.bpm.StartCapex.view.ExpenditureRequest
         */
        onInit: function () {
            var oModel = this.getParentModel();
            this.setModel(oModel);

            this.getUserData(sap.ushell.Container.getService("UserInfo").getUser().getEmail());

            // get locale of logged in user
            var sLangCode = sap.ui.getCore().getConfiguration().getLanguage().substring(0, 2).toUpperCase();
            oModel.setProperty("/sLangCode", sLangCode);

        },

        // get user data based on the email value
        getUserData: function (sEmail) {
            var oThisController = this;

            var oView = oThisController.getView();
            oView.setBusy(true);

            // var sUrl = '/comsapbpmCreateRequest/scim/service/scim/Users?filter=emails eq "' + sEmail + '"';
            var sUrl = oThisController._getRuntimeBaseURL() + '/scim/service/scim/Users?filter=emails eq "' + sEmail + '"';
            
            var oSettings = {
                "url": sUrl,
                "method": "GET"
            };

            $.ajax(oSettings)
                .done(function (results, textStatus, request) {
                    if (results.totalResults == 1) {
                        oThisController._presetRequesterFields(results.Resources[0]);
                    } else if (results.totalResults < 1) {
                        console.log("Couldn't find user with email " + sEmail + " in SCIM service");
                    } else {
                        console.log("More than 1 user has email " + sEmail + " in SCIM service");
                    }
                    oView.setBusy(false);
                })
                .fail(function (err) {
                    oView.setBusy(false);
                    if (err !== undefined) {
                        var oErrorResponse = $.parseJSON(err.responseText);
                        MessageToast.show(oErrorResponse.message, {
                            duration: 6000
                        });
                    } else {
                        MessageToast.show(oThisController.getMessage("UNKNOWN_ERROR"));
                    }
                });
        },

        // attempt to preset Requester fields
        _presetRequesterFields: function (data) {
            var oBPModel = this.getParentModel();

            var sEmailID = "";
            var emails = data.emails;
            for (var j = 0; j < emails.length; j++) {
                if (emails[j].primary) {
                    sEmailID = emails[j].value;
                }
            }

            oBPModel.setProperty("/RequesterDetails/RequesterFirstName", data.name.givenName);
            oBPModel.setProperty("/RequesterDetails/RequesterLastName", data.name.familyName);
            oBPModel.setProperty("/RequesterDetails/RequesterEmail", sEmailID);
            oBPModel.setProperty("/RequesterDetails/RequesterUserId", data.userName);
            oBPModel.refresh();
        },

        /**
         * Convenience method for removing all required Input validation Error.
         * @public
         * @returns Remove errors from value help dialog.
         */
        onChange: function (oEvent) {
            var oThisController = this;
            // var oBPModel = oThisController.getParentModel();
            var oInput = oEvent.getSource();
            if (oInput.getProperty("value").length > 0 && oInput.getProperty("valueState") === "Error") {
                oInput.setProperty("valueState", "None");
                oInput.setProperty("valueStateText", "");
            }
        },

        onPersonTitleChange: function (oEvent) {
            var oBPModel = this.getParentModel();
            var sSelectedKey = oEvent.getSource().getSelectedKey();
            oBPModel.setProperty("/BPRequest/GenderCodeName", sSelectedKey);
        },

        onBPCategoryChange: function (oEvent) {
            var oBPModel = this.getParentModel();
            var sSelectedKey = oEvent.getSource().getSelectedKey();
            oBPModel.setProperty("/BPRequest/BusinessPartnerCategory", sSelectedKey);

            if (sSelectedKey == "1") {
                oBPModel.setProperty("/isPerson", true);
                oBPModel.setProperty("/isOrganization", false);
            } else if (sSelectedKey == "2") {
                oBPModel.setProperty("/isOrganization", true);
                oBPModel.setProperty("/isPerson", false);
            }

            var oInput = oEvent.getSource();
            if (oInput.getProperty("valueState") === "Error") {
                oInput.setProperty("valueState", "None");
                oInput.setProperty("valueStateText", "");
            }
        },

        // add row on "Add Business Partner Role" button press
        onAddBPRole: function () {
            var oBPRoles = this.getParentModel().getProperty("/BPRoles");

            oBPRoles.push({
                BusinessPartnerRole: "",
                BusinessPartnerRoleShortName: ""
            });

            this.getParentModel().setProperty("/BPRoles", oBPRoles);
            this.getParentModel().refresh();

        },

        // remove row on "Delete Business Partner Role" button press
        handleDeleteBPRole: function (oEvent) {
            var oBPRoles = this.getParentModel().getProperty("/BPRoles");
            var oBPRole = oEvent.getSource().getBindingContext().getObject();
            var deletedIndex;
            for (var i = 0; i < oBPRoles.length; i++) {
                if (oBPRoles[i] == oBPRole) {
                    deletedIndex = i;
                    oBPRoles.splice(i, 1);
                    this.getParentModel().refresh();
                    break;
                }
            }
        },

        /**
        * VALUE HELP / SCIM INTEGRATION
        */

        onValueHelpRequested: function (oEvent) {
            this.selectedValueHelp = oEvent.getSource();
            var sInputField = oEvent.getSource().data().inputCustomData;

            if (sInputField === "BPRoleValueHelpType") {
                var oModel = this.getParentModel();
                var oColumns = oModel.getProperty("/BPRolesValueHelpType/cols");
                this.getBPRoles(oColumns);
            }
        },
                _getRuntimeBaseURL: function () {
                    var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                    var appPath = appId.replaceAll(".", "/");
                    var appModulePath = jQuery.sap.getModulePath(appPath);

                    return appModulePath;
                },
        getBPRoles: function (oColumns) {
            var oThisController = this,
                oView = oThisController.getView(),
                oModel = oThisController.getParentModel();

            oView.setBusy(true);

            // var sUrl = "/S4HANA_Dest/sap/opu/odata/sap/YY1_BPROLE_CDS/YY1_BPRole",
            var sUrl = oThisController._getRuntimeBaseURL() + "/S4HANA_Dest/sap/opu/odata/sap/ZZ1_BPROLE_CDS/ZZ1_BPRole",
                sLang = oModel.getProperty("/sLangCode"),
                oParams = {
                    $format: "json",
                    $filter: "LanguageISOCode eq '" + sLang + "'",
                    $inlinecount: "allpages"
                };

            $.get(sUrl, oParams)
                .done(function (results) {
                    if (results.d.__count > 0) {
                        oView.setBusy(false);

                        oThisController._mapBPRoles(oColumns, results.d.results);
                        oModel.setProperty("/usingDefaultLang", false);

                    } else {
                        // Retry with default language
                        var oParamsRetry = {
                            $format: "json",
                            $filter: "LanguageISOCode eq '" + oModel.getProperty("/sDefaultLang") + "'",
                            $inlinecount: "allpages"
                        };
                        $.get(sUrl, oParamsRetry)
                            .done(function (results) {
                                oView.setBusy(false);

                                if (results.d.__count > 0) {
                                    oModel.setProperty("/usingDefaultLang", true);
                                    oThisController._mapBPRoles(oColumns, results.d.results);
                                } else {
                                    var sErrorText = oThisController.getMessage("VALUE_HELP_GET_DATA_ERROR_DEF_LANG");
                                    var sContactAdmin = oThisController.getMessage("CONTACT_ADMIN");
                                    MessageToast.show(sErrorText + oModel.getProperty("/sDefaultLangName") + sContactAdmin);
                                }
                            })
                            .fail(function (err) {
                                oView.setBusy(false);
                                if (err !== undefined) {
                                    var oErrorResponse = $.parseJSON(err.responseText);
                                    MessageToast.show(oErrorResponse.message, {
                                        duration: 6000
                                    });
                                } else {
                                    MessageToast.show(oThisController.getMessage("UNKNOWN_ERROR"));
                                }
                            });
                    }
                })
                .fail(function (err) {
                    oView.setBusy(false);
                    if (err !== undefined) {
                        var oErrorResponse = $.parseJSON(err.responseText);
                        MessageToast.show(oErrorResponse.message, {
                            duration: 6000
                        });
                    } else {
                        MessageToast.show(oThisController.getMessage("UNKNOWN_ERROR"));
                    }
                });
        },

        _mapBPRoles: function (oColumns, oRolesData) {

            var oModel = this.getParentModel();
            var aRoles = oModel.getProperty("/BPRolesVH");

            for (var i = 0; i < oRolesData.length; i++) {
                aRoles.push({
                    BusinessPartnerRole: oRolesData[i].BusinessPartnerRole,
                    BusinessPartnerRoleShortName: oRolesData[i].BusinessPartnerRoleShortName
                });
            }

            oModel.setProperty("/BPRolesVH", aRoles);
            oModel.refresh();
            this.fnCreateFragment(oColumns, "/BPRolesVH");

        },

        fnCreateFragment: function (oColumns, oInputData) {

            var oModel = this.getParentModel();
            var oThisController = this;

            oModel.setProperty("/oDialog/sFilterLabel", this.getMessage("BUSINESS_PARTNER_ROLE"));
            oModel.setProperty("/oDialog/sDialogDes", "BusinessPartnerRoleShortName");
            oModel.setProperty("/oDialog/sDialogKey", "BusinessPartnerRole");
            oModel.setProperty("/oDialog/sTitle", this.getMessage("ROLES"));

            this._oBasicSearchField = new SearchField({
                showSearchButton: false,
                change: function () {
                    oThisController.onFilterBarSearch();
                }
            });

            if (!this._oValueHelpDialog) {
                this._oValueHelpDialog = sap.ui.xmlfragment("com.sap.bpm.CreateRequest.view.BusinessValueHelp", this);
                this.getView().addDependent(this._oValueHelpDialog);
            }

            var oFilterBar = new FilterBar("businessValueHelpFilterBar", {
                search: function () {
                    oThisController.onFilterBarSearch();
                }
            });
            oFilterBar.setFilterBarExpanded(false);
            oFilterBar.setBasicSearch(this._oBasicSearchField);
            oFilterBar.setAdvancedMode(true);

            var oRolesFilterGroupItemBusinessPartnerRole = new FilterGroupItem({
                groupName: "Roles",
                name: "BusinessPartnerRole",
                label: this.getMessage("BUSINESS_PARTNER_ROLE"),
                visibleInFilterBar: true,
                control: new Input("filterBarBusinessPartnerRoleIntput", {
                    name: "BusinessPartnerRole",
                    submit: function () {
                        oThisController.onFilterBarSearch();
                    }
                })
            });
            oFilterBar.addFilterGroupItem(oRolesFilterGroupItemBusinessPartnerRole);

            var oRolesFilterGroupItemBusinessPartnerRoleShortName = new FilterGroupItem({
                groupName: "Roles",
                name: "BusinessPartnerRoleShortName",
                label: this.getMessage("ROLE_DESCRIPTION"),
                visibleInFilterBar: true,
                control: new Input("filterBarBusinessPartnerRoleShortNameIntput", {
                    name: "BusinessPartnerRoleShortName",
                    submit: function () {
                        oThisController.onFilterBarSearch();
                    }
                })

            });
            oFilterBar.addFilterGroupItem(oRolesFilterGroupItemBusinessPartnerRoleShortName);

            this._oValueHelpDialog.setFilterBar(oFilterBar);

            // Binding  Data to the Table 
            this._oValueHelpDialog.getTableAsync().then(function (oTable) {
                oTable.setModel(oModel);

                var oColumnsLocalized = oColumns.map(function (column) {
                    return {
                        label: oThisController.getMessage(column.label),
                        template: column.template
                    }
                });

                var oNewModel = new JSONModel();
                oNewModel.setData({
                    cols: oColumnsLocalized
                });
                oTable.setModel(oNewModel, "columns");

                if (oTable.bindRows) {
                    oTable.bindAggregation("rows", oInputData);
                }

                if (oTable.bindItems) {

                    oTable.bindAggregation("items", oInputData, function () {
                        return new ColumnListItem({
                            cells: oColumns.map(function (column) {
                                return new Label({
                                    text: "{" + column.template + "}"
                                });
                            })
                        });
                    });
                }
                this._oValueHelpDialog.update();
            }.bind(this));

            this._oValueHelpDialog.open();

        },

        onValueHelpAfterOpen: function (oEvent) {
            var oModel = this.getParentModel();
            if (oModel.getProperty("/usingDefaultLang")) {
                var sErrorText = this.getMessage("VALUE_HELP_GET_DATA_ERROR");
                MessageToast.show(sErrorText + oModel.getProperty("/sDefaultLangName") + ")");
            }
        },

        onValueHelpOkPress: function (oEvent) {

            var oModel = this.getParentModel();
            var aTokens = oEvent.getParameter("tokens");
            var aCustomData = aTokens[0].getAggregation("customData");
            var oSelectedRowData;

            for (var i = 0; i < aCustomData.length; i++) {
                if (aCustomData[i].getKey() == "row") {
                    oSelectedRowData = aCustomData[i].getValue()
                    break;
                }
            }

            var sInputField = this.selectedValueHelp.data().inputCustomData;
            var sPath = this.selectedValueHelp.getBindingContext().getPath();

            if (sInputField === "BPRoleValueHelpType") {
                this.selectedValueHelp.setValue(oSelectedRowData.BusinessPartnerRole);
                oModel.setProperty(sPath + "/BusinessPartnerRoleShortName", oSelectedRowData.BusinessPartnerRoleShortName);

                var errorExist = oModel.getProperty(sPath + "/BusinessPartnerRoleState");
                if (errorExist === "Error") {
                    oModel.setProperty(sPath + "/BusinessPartnerRoleState", "None");
                    oModel.setProperty(sPath + "/BusinessPartnerRoleStateText", "");

                }
            }
            this._oValueHelpDialog.close();
        },

        onValueHelpCancelPress: function () {
            this._oValueHelpDialog.close();
        },

        onValueHelpAfterClose: function () {
            var oModel = this.getParentModel();
            oModel.setProperty("/BPRolesVH", []);
            if (this._oValueHelpDialog) {
                this._oValueHelpDialog.destroy();
                this._oValueHelpDialog = null; // make it falsy so that it can be created next time
            }
            oModel.refresh();
        },

        onFilterBarSearch: function (oEvent) {
            var sSearchQuery = this._oBasicSearchField.getValue(),
                aSelectionSet = sap.ui.getCore().byId("businessValueHelpFilterBar")._retrieveCurrentSelectionSet();

            var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
                if (oControl.getValue()) {
                    aResult.push(new Filter({
                        path: oControl.getName(),
                        operator: FilterOperator.Contains,
                        value1: oControl.getValue()
                    }));
                }

                return aResult;
            }, []);

            aFilters.push(new Filter({
                filters: [
                    new Filter({
                        path: "BusinessPartnerRole",
                        operator: FilterOperator.Contains,
                        value1: sSearchQuery
                    }),
                    new Filter({
                        path: "BusinessPartnerRoleShortName",
                        operator: FilterOperator.Contains,
                        value1: sSearchQuery
                    })
                ],
                and: false
            }));

            this._filterTable(new Filter({
                filters: aFilters,
                and: true
            }));
        },

        _filterTable: function (oFilter) {
            var oValueHelpDialog = this._oValueHelpDialog;

            oValueHelpDialog.getTableAsync().then(function (oTable) {
                if (oTable.bindRows) {
                    oTable.getBinding("rows").filter(oFilter);
                }

                if (oTable.bindItems) {
                    oTable.getBinding("items").filter(oFilter);
                }

                oValueHelpDialog.update();
            });
        },

        /**
         * Convenience method for all Input validation errors.
         * @public
         * @returns Validate all the required input fields.
         */
        onPressSubmit: function (oEvent) {

            var errorExist = false,
                oThisController = this,
                oBPModel = oThisController.getParentModel();

            oThisController.getView().setBusy(true);

            // Checking Requester Fields
            var requesterFields = [
                "RequesterFirstName",
                "RequesterLastName",
                "RequesterEmail",
                "RequesterUserId"
            ];
            var requesterValue;
            for (var i = 0; i < requesterFields.length; i++) {
                requesterValue = oBPModel.getProperty("/" + "RequesterDetails" + "/" + requesterFields[i]);
                if (requesterValue && requesterValue.trim() && requesterValue !== "" && requesterValue !== "undefined" && requesterValue !==
                    "null") {
                    oBPModel.setProperty("/" + "RequesterDetails" + "/" + requesterFields[i] + "State", "None");
                } else {
                    errorExist = true;
                    if (requesterFields[i] === "RequesterFirstName") {
                        oBPModel.setProperty("/" + "RequesterDetails" + "/" + requesterFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_FIRST_NAME"));
                    }
                    if (requesterFields[i] === "RequesterLastName") {
                        oBPModel.setProperty("/" + "RequesterDetails" + "/" + requesterFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_LAST_NAME"));
                    }
                    if (requesterFields[i] === "RequesterEmail") {
                        oBPModel.setProperty("/" + "RequesterDetails" + "/" + requesterFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_EMAIL"));
                    }
                    if (requesterFields[i] === "RequesterUserId") {
                        oBPModel.setProperty("/" + "RequesterDetails" + "/" + requesterFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_USER_ID"));
                    }

                    oBPModel.setProperty("/" + "RequesterDetails" + "/" + requesterFields[i] + "State", "Error");

                }
            }

            // Checking Basic Data Fields
            var basicDataFields;
            if (oBPModel.getProperty("/isOrganization")) {
                basicDataFields = [
                    "BusinessPartnerCategory",
                    "BusinessPartnerName",
                ]
            } else if (oBPModel.getProperty("/isPerson")) {
                basicDataFields = [
                    "BusinessPartnerCategory",
                    "LastName"
                ]
            } else {
                basicDataFields = [
                    "BusinessPartnerCategory"
                ]
            }
            var basicDataValue;
            for (var i = 0; i < basicDataFields.length; i++) {
                basicDataValue = oBPModel.getProperty("/" + "BPRequest" + "/" + basicDataFields[i]);
                if (basicDataValue && basicDataValue.trim() && basicDataValue !== "" && basicDataValue !== "undefined" && basicDataValue !==
                    "null") {
                    oBPModel.setProperty("/" + "BPRequest" + "/" + basicDataFields[i] + "State", "None");
                } else {
                    errorExist = true;
                    if (basicDataFields[i] === "BusinessPartnerCategory") {
                        oBPModel.setProperty("/" + "BPRequest" + "/" + basicDataFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_BUSINESS_PARTNER_CATEGORY"));
                    }
                    if (basicDataFields[i] === "BusinessPartnerName") {
                        oBPModel.setProperty("/" + "BPRequest" + "/" + basicDataFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_BUSINESS_PARTNER_NAME"));
                    }
                    if (basicDataFields[i] === "LastName") {
                        oBPModel.setProperty("/" + "BPRequest" + "/" + basicDataFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_BUSINESS_PARTNER_LAST_NAME"));
                    }

                    oBPModel.setProperty("/" + "BPRequest" + "/" + basicDataFields[i] + "State", "Error");
                }
            }

            // Checking Roles Fields
            var oRoles = oBPModel.getProperty("/BPRoles");
            var roleFields = [
                "BusinessPartnerRole"
            ]
            var roleValue;
            for (var j = 0; j < oRoles.length; j++) {
                for (var i = 0; i < roleFields.length; i++) {
                    roleValue = oBPModel.getProperty("/" + "BPRoles" + "/" + j + "/" + roleFields[i]);
                    if (roleValue && roleValue.trim() && roleValue !== "" && roleValue !== "undefined" && roleValue !==
                        "null") {
                        oBPModel.setProperty("/" + "BPRoles" + "/" + j + "/" + roleFields[i] + "State", "None");
                    } else {
                        errorExist = true;
                        if (roleFields[i] === "BusinessPartnerRole") {
                            oBPModel.setProperty("/" + "BPRoles" + "/" + j + "/" + roleFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_BUSINESS_PARTNER_ROLE"));
                        }

                        oBPModel.setProperty("/" + "BPRoles" + "/" + j + "/" + roleFields[i] + "State", "Error");
                    }
                }
            }

            // Email Validation
            var requesterEmail = oBPModel.getProperty("/RequesterDetails/RequesterEmail");
            var mailregex = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;

            if (requesterEmail && !mailregex.test(requesterEmail)) {
                var invalidReqEmail = oThisController.getMessage("INVALID_EMAIL_ERROR")
                errorExist = true;
                oBPModel.setProperty("/RequesterDetails/RequesterEmailState", "Error");
                oBPModel.setProperty("/RequesterDetails/RequesterEmailStateText", invalidReqEmail);
            }

            if (errorExist) {
                var sGenericErrorText = oThisController.getMessage("FIELD_VALIDATION_ERROR_GENERIC");
                MessageToast.show(sGenericErrorText)
                oThisController.getView().setBusy(false);
                return;
            } else {
                this.getDefinitionId();
            }

        },

        getDefinitionId: function () {
            // First get the CSRF token
            var oThisController = this;
            var oModel = oThisController.getParentModel();
            var oPayload = {
                "RuleServiceId": "db00fdc56ebc4406b8e9ae07e27be7eb",
                "RuleServiceRevision": "2104",
                "Vocabulary": [{
                    "BusinessPartnerRequestDetails": {
                        "Category": oModel.getProperty("/BPRequest/BusinessPartnerCategory")
                    }
                }]
            };

            oThisController.getView().setBusy(true);

            $.ajax({
                // url: "/comsapbpmCreateRequest/bpmrulesruntime/rules-service/v1/rules/xsrf-token",
                url: oThisController._getRuntimeBaseURL() + "/bpmrulesruntime/public/spa/commons/v1/xsrf-token",
                method: "GET",
                headers: {
                    "X-CSRF-Token": "Fetch"
                },
                success: function (results, xhr, data) {
                    var bpmruletoken = data.getResponseHeader("X-CSRF-Token");

                    //Then invoke the business rules service via public API
                    $.ajax({
                        // url: "/comsapbpmCreateRequest/bpmrulesruntime/rules-service/rest/v2/rule-services",
                        url: oThisController._getRuntimeBaseURL() + "/bpmrulesruntime/public/rule/runtime/rest/v2/rule-services",
                        method: "POST",
                        contentType: "application/json",
                        data: JSON.stringify(oPayload),
                        async: false,
                        headers: {
                            "X-CSRF-Token": bpmruletoken
                        },

                        success: function (results) {

                            oThisController.getView().setBusy(false);

                            if (results.Result.length === 0) {
                                var sErrorText = oThisController.getMessage("BUSINESS_RULES_RESULT_ERROR");
                                MessageBox.error(sErrorText + "\n Error:" + errorThrown + ".");
                                return;
                            } else {
                                oThisController.submitRequest(results.Result[0].ProcessVariant.ProcessVariant);
                            }
                        },
                        error: function (jqXHR, textStatus, errorThrown) {

                            var sErrorText = oThisController.getMessage("BUSINESS_RULES_SERVICE_ERROR");
                            MessageBox.error(sErrorText + "\n Error:" + errorThrown + ".");
                            oThisController.getView().setBusy(false);
                            return;
                        }
                    });
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    var sErrorText = oThisController.getMessage("BUSINESS_RULES_ACCESS_TOKEN_ERROR");
                    MessageBox.error(sErrorText + "\n Error:" + errorThrown + ".");
                    oThisController.getView().setBusy(false);
                    return;
                }
            });
        },

        submitRequest: function (sDefinitionId) {
            var contextModel = this.getParentModel(),
                token,
                oThisController = this;

            var aBusinessPartnerRoles = [],
                aRolesData = contextModel.getProperty("/BPRoles");

            for (var i = 0; i < aRolesData.length; i++) {
                aBusinessPartnerRoles.push({
                    BusinessPartnerRole: aRolesData[i].BusinessPartnerRole
                });
            }

            var BPRequest;

            if (contextModel.getProperty("/isOrganization")) {
                BPRequest = {
                    BusinessPartnerCategory: contextModel.getProperty("/BPRequest/BusinessPartnerCategory"),
                    BusinessPartnerName: contextModel.getProperty("/BPRequest/BusinessPartnerName"),
                    RolesData: contextModel.getProperty("/BPRoles"),
                    AddressData: contextModel.getProperty("/BPRequest/AddressData"),
                    FinanceData: contextModel.getProperty("/BPRequest/FinanceData")
                }
            } else if (contextModel.getProperty("/isPerson")) {
                BPRequest = {
                    BusinessPartnerCategory: contextModel.getProperty("/BPRequest/BusinessPartnerCategory"),
                    GenderCodeName: contextModel.getProperty("/BPRequest/GenderCodeName"),
                    FirstName: contextModel.getProperty("/BPRequest/FirstName"),
                    LastName: contextModel.getProperty("/BPRequest/LastName"),
                    RolesData: contextModel.getProperty("/BPRoles"),
                    AddressData: contextModel.getProperty("/BPRequest/AddressData"),
                    FinanceData: contextModel.getProperty("/BPRequest/FinanceData")
                }
            }

            var oPayload = {
                RequestId: contextModel.getProperty("/RequestId"),
                RequesterDetails: {
                    RequesterFirstName: contextModel.getProperty("/RequesterDetails/RequesterFirstName"),
                    RequesterLastName: contextModel.getProperty("/RequesterDetails/RequesterLastName"),
                    RequesterEmail: contextModel.getProperty("/RequesterDetails/RequesterEmail"),
                    RequesterUserId: contextModel.getProperty("/RequesterDetails/RequesterUserId"),
                    RequesterComment: contextModel.getProperty("/RequesterDetails/RequesterComment")
                },
                BPName: "",
                processStatus: "",
                CurrentStepName: "",
                History: [],
                BPRequest: BPRequest,
                internal: {
                    isRework: false,
                    initialDefinitionId: sDefinitionId
                }
            }

            oThisController.getView().setBusy(true);

            $.ajax({
                // url: "/comsapbpmCreateRequest/bpmworkflowruntime/v1/xsrf-token",
                url: oThisController._getRuntimeBaseURL() + "/bpmworkflowruntime/public/spa/commons/v1/xsrf-token",
                method: "GET",
                async: false,
                headers: {
                    "X-CSRF-Token": "Fetch"
                },
                success: function (result, xhr, data) {
                    token = data.getResponseHeader("X-CSRF-Token");
                    $.ajax({
                        type: "POST",
                        contentType: "application/json",
                        headers: {
                            "X-CSRF-Token": token
                        },
                        // url: "/comsapbpmCreateRequest/bpmworkflowruntime/v1/workflow-instances",
                        url: oThisController._getRuntimeBaseURL() + "/bpmworkflowruntime/v1/workflow-instances",
                        data: JSON.stringify({
                            definitionId: sDefinitionId,
                            context: oPayload
                        }),
                        success: function (result, xhr, data) {

                            contextModel.setProperty("/oEnable/sInput", false);
                            contextModel.setProperty("/oEnable/bRegister", false);
                            contextModel.refresh(true);
                            oThisController.getView().setBusy(false);
                            MessageBox.success(oThisController.getMessage("REQUEST_SUBMIT_SUCCESS"));

                        },
                        error: function (err) {

                            oThisController.getView().setBusy(false);
                            var sErrorText = oThisController.getMessage("WORKFLOW_SERVICE_ERROR");
                            MessageBox.error(sErrorText + "\n Error: " + errorThrown + ".");
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
                error: function (jqXHR, textStatus, errorThrown) {

                    var sErrorText = oThisController.getMessage("WORKFLOW_ACCESS_TOKEN_ERROR");
                    MessageBox.error(sErrorText + "\n Error:" + errorThrown + ".");
                    oThisController.getView().setBusy(false);
                    return;

                }
            });
        }

    });
});