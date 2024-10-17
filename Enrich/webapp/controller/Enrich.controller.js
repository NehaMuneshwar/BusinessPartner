sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Token",
    "sap/m/Label",
    "sap/m/ColumnListItem",
    "sap/m/SearchField",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/comp/filterbar/FilterBar",
    "sap/ui/comp/filterbar/FilterGroupItem",
    "sap/m/Input",
], function (BaseController, JSONModel, MessageBox, MessageToast, Token, Label, ColumnListItem, SearchField,
    Filter, FilterOperator, FilterBar, FilterGroupItem, Input) {
    "use strict";

    return BaseController.extend("com.sap.bpm.Enrich.controller.Enrich", {

        onInit: function () {
            this.getContentDensityClass();
            this.configureView();

            // get locale of logged in user
            var oModel = this.getParentModel("mCommon");
            var sLangCode = sap.ui.getCore().getConfiguration().getLanguage().substring(0, 2).toUpperCase();
            oModel.setProperty("/sLangCode", sLangCode);
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

            var sCurrentStep = this.getModel().getProperty("/CurrentStepName"),
                isRework = this.getModel().getProperty("/internal/isRework"),
                completeStatusText;

            if (sCurrentStep == "ReworkBasicData") {
                this.getModel().setProperty("/isReworkBasicDataStep", true);
                this.getModel().setProperty("/isEnrichAddressStep", false);
                this.getModel().setProperty("/isEnrichFinanceStep", false);
                completeStatusText = "basic data is provided";
            } else if (sCurrentStep == "EnrichAddress") {
                this.getModel().setProperty("/isReworkBasicDataStep", false);
                this.getModel().setProperty("/isEnrichAddressStep", true);
                this.getModel().setProperty("/isEnrichFinanceStep", false);
                completeStatusText = "address data is provided";
            } else if (sCurrentStep == "EnrichFinance") {
                this.getModel().setProperty("/isReworkBasicDataStep", false);
                this.getModel().setProperty("/isEnrichAddressStep", false);
                this.getModel().setProperty("/isEnrichFinanceStep", true);
                completeStatusText = "finance data is provided";
            } else {
                console.log("something is wrong");
            }

            if (isRework || sCurrentStep == "EnrichFinance") {
                this.getModel().setProperty("/isEnrichFinanceStepVisible", true);
            } else {
                this.getModel().setProperty("/isEnrichFinanceStepVisible", false);
            }

            var startupParameters = this.getComponentData().startupParameters;
            var submitText = this.getMessage("SUBMIT");

            var taskInstanceModel = this.getModel("taskInstanceModel");
            var sSubject = taskInstanceModel.getData().subject;
            this.byId("enrichmentPageHeader").setObjectTitle(sSubject);

            var oThisController = this;

            /**
             * COMPLETE BUTTON
             */
            // Implementation for the complete action
            var oPositiveAction = {
                sBtnTxt: submitText,
                onBtnPressed: function (e) {
                    var oModel = oThisController.getModel();
                    oModel.refresh(true);
                    var processContext = oModel.getData();
                    // Call a local method to perform further action
                    oThisController._validateInput(
                        processContext,
                        startupParameters.taskModel.getData().InstanceID,
                        completeStatusText
                    );
                }
            };

            // Add 'Complete' action to the task
            startupParameters.inboxAPI.addAction({
                action: oPositiveAction.sBtnTxt,
                label: oPositiveAction.sBtnTxt,
                type: "Accept"
            }, oPositiveAction.onBtnPressed);

        },

        // add row on "Add Business Partner Role" button press
        onAddBPRole: function () {
            var oBPRoles = this.getParentModel().getProperty("/BPRequest/RolesData");

            oBPRoles.push({
                BusinessPartnerRole: "",
                BusinessPartnerRoleShortName: ""
            });

            this.getParentModel().setProperty("/BPRequest/RolesData", oBPRoles);
            this.getParentModel().refresh();

        },

        // remove row on "Delete Business Partner Role" button press
        handleDeleteBPRole: function (oEvent) {
            var oBPRoles = this.getParentModel().getProperty("/BPRequest/RolesData");
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

        // add row on "Add Tax Number" button press
        onAddTaxNumber: function () {
            var oTaxes = this.getParentModel().getProperty("/BPRequest/FinanceData/TaxData");

            oTaxes.push({
                TaxCategory: "",
                TaxNumber: ""
            });

            this.getParentModel().setProperty("/BPRequest/FinanceData/TaxData", oTaxes);
            this.getParentModel().refresh();

        },

        // remove row on "Delete Tax Number" button press
        handleDeleteTaxNumber: function (oEvent) {
            var oTaxes = this.getParentModel().getProperty("/BPRequest/FinanceData/TaxData");
            var oTax = oEvent.getSource().getBindingContext().getObject();
            var deletedIndex;
            for (var i = 0; i < oTaxes.length; i++) {
                if (oTaxes[i] == oTax) {
                    deletedIndex = i;
                    oTaxes.splice(i, 1);
                    this.getParentModel().refresh();
                    break;
                }
            }
        },

        // add row on "Add Bank Account" button press
        onAddBankAccount: function () {
            var oBankAccounts = this.getParentModel().getProperty("/BPRequest/FinanceData/BankData");

            oBankAccounts.push({
                BankNumber: "",
                BankName: "",
                BankCountryKey: "",
                BankAccount: "",
                BankAccountName: ""
            });

            this.getParentModel().setProperty("/BPRequest/FinanceData/BankData", oBankAccounts);
            this.getParentModel().refresh();

        },

        // remove row on "Delete Bank Account" button press
        handleDeleteBankAccount: function (oEvent) {
            var oBankAccounts = this.getParentModel().getProperty("/BPRequest/FinanceData/BankData");
            var oBankAccount = oEvent.getSource().getBindingContext().getObject();
            var deletedIndex;
            for (var i = 0; i < oBankAccounts.length; i++) {
                if (oBankAccounts[i] == oBankAccount) {
                    deletedIndex = i;
                    oBankAccounts.splice(i, 1);
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
                var oModel = this.getParentModel("mCommon");
                var oColumns = oModel.getProperty("/BPRolesValueHelpType/cols");
                this.getBPRoles(oColumns);
            } else if (sInputField === "CountryValueHelpType") {
                var oModel = this.getParentModel("mCommon");
                var oColumns = oModel.getProperty("/CountryValueHelpType/cols");
                this.getCountries(oColumns);
            } else if (sInputField === "BankValueHelpType") {
                var oModel = this.getParentModel("mCommon");
                var oColumns = oModel.getProperty("/BankValueHelpType/cols");
                this.getBankDetails(oColumns);
            } else if (sInputField === "TaxCategoryValueHelpType") {
                var oModel = this.getParentModel("mCommon");
                var oColumns = oModel.getProperty("/TaxCategoryValueHelpType/cols");
                this.getTaxCategoryDetails(oColumns);
            }
        },

        getBPRoles: function (oColumns) {
            var oThisController = this,
                oView = oThisController.getView(),
                oModel = oThisController.getParentModel("mCommon");

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

            var oModel = this.getParentModel("mCommon");
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

        getCountries: function (oColumns) {
            var oThisController = this,
                oView = oThisController.getView(),
                oModel = oThisController.getParentModel("mCommon");

            oView.setBusy(true);

            // var sUrl = "/S4HANA_Dest/sap/opu/odata/sap/YY1_BPCountry_CDS/YY1_BPCountry",
            var sUrl = oThisController._getRuntimeBaseURL() + "/S4HANA_Dest/sap/opu/odata/sap/ZZ1_BPCountry_CDS/ZZ1_BPCountry",
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

                        oThisController._mapCountries(oColumns, results.d.results);
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
                                    oThisController._mapCountries(oColumns, results.d.results);
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

        _mapCountries: function (oColumns, oCountriesData) {

            var oModel = this.getParentModel("mCommon");
            var aCountries = oModel.getProperty("/CountriesVH");

            for (var i = 0; i < oCountriesData.length; i++) {
                aCountries.push({
                    Country: oCountriesData[i].Country,
                    CountryName: oCountriesData[i].CountryName
                });
            }

            oModel.setProperty("/CountriesVH", aCountries);
            oModel.refresh();
            this.fnCreateFragment(oColumns, "/CountriesVH");

        },

        getBankDetails: function (oColumns) {
            var oThisController = this,
                oView = oThisController.getView(),
                oModel = oThisController.getParentModel("mCommon");

            oView.setBusy(true);

            // var sUrl = "/S4HANA_Dest/sap/opu/odata/sap/API_BANKDETAIL_SRV/A_BankDetail",
            var sUrl = oThisController._getRuntimeBaseURL() + "/S4HANA_Dest/sap/opu/odata/sap/API_BANKDETAIL_SRV/A_BankDetail",
                oParams = {
                    $format: "json",
                    $inlinecount: "allpages"
                };

            $.get(sUrl, oParams)
                .done(function (results) {
                    if (results.d.__count > 0) {
                        oView.setBusy(false);

                        oThisController._mapBankDetails(oColumns, results.d.results);
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
                                    oThisController._mapBankDetails(oColumns, results.d.results);
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

        _mapBankDetails: function (oColumns, oBankDetails) {

            var oModel = this.getParentModel("mCommon");
            var aBankDetails = oModel.getProperty("/BankAccountsVH");

            for (var i = 0; i < oBankDetails.length; i++) {
                aBankDetails.push({
                    BankCountryKey: oBankDetails[i].BankCountry,
                    BankName: oBankDetails[i].BankName,
                    BankNumber: oBankDetails[i].BankInternalID,
                    SWIFTCode: oBankDetails[i].SWIFTCode,
                    CityName: oBankDetails[i].CityName,
                });
            }

            oModel.setProperty("/BankAccountsVH", aBankDetails);
            oModel.refresh();
            this.fnCreateFragment(oColumns, "/BankAccountsVH");

        },

        getTaxCategoryDetails: function (oColumns) {
            // First get the CSRF token
            var oThisController = this,
                oBPModel = oThisController.getParentModel(),
                sCountry = oBPModel.getProperty("/BPRequest/AddressData/Country");

            var oPayload = {
                RuleServiceId: "afd59110b7ca4351982e84fb2cb11249",
                RuleServiceRevision: "2104",
                Vocabulary: [{
                    BusinessPartnerRequestDetails: {
                        Country: sCountry
                    }
                }]
            };

            oThisController.getView().setBusy(true);

            $.ajax({
                // url: "/comsapbpmEnrich/bpmrulesruntime/rules-service/v1/rules/xsrf-token",
                url: oThisController._getRuntimeBaseURL() + "/bpmrulesruntime/public/spa/commons/v1/xsrf-token",
                method: "GET",
                headers: {
                    "X-CSRF-Token": "Fetch"
                },
                success: function (results, xhr, data) {
                    var bpmruletoken = data.getResponseHeader("X-CSRF-Token");

                    //Then invoke the business rules service via public API
                    $.ajax({
                        // url: "/comsapbpmEnrich/bpmrulesruntime/rules-service/rest/v2/rule-services",
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
                                var sErrorText = oThisController.getMessage("NO_TAX_CATEGORIES_AVAILABLE") + sCountry;
                                MessageBox.error(sErrorText + "\n Error:" + errorThrown + ".");
                                return;
                            } else {
                                var oTaxCategories = results.Result[0].TaxCategoryVHTable;
                                oThisController._mapTaxCategories(oColumns, oTaxCategories);
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

        _mapTaxCategories: function (oColumns, oTaxCategories) {

            var oModel = this.getParentModel("mCommon");
            var aTaxCategories = oModel.getProperty("/TaxVH");

            for (var i = 0; i < oTaxCategories.length; i++) {
                aTaxCategories.push({
                    TaxCategory: oTaxCategories[i].TaxCategoryKey,
                    TaxCategoryDescription: oTaxCategories[i].TaxCategoryDesc
                });
            }

            oModel.setProperty("/TaxVH", aTaxCategories);
            oModel.refresh();
            this.fnCreateFragment(oColumns, "/TaxVH");

        },

        fnCreateFragment: function (oColumns, oInputData) {

            var oModel = this.getParentModel("mCommon");

            this._oBasicSearchField = new SearchField({
                showSearchButton: false,
                change: function () {
                    oThisController.onFilterBarSearch();
                }
            });

            if (!this._oValueHelpDialog) {
                this._oValueHelpDialog = sap.ui.xmlfragment("com.sap.bpm.Enrich.view.BusinessValueHelp", this);
                this.getView().addDependent(this._oValueHelpDialog);
            }

            var oThisController = this;
            var oFilterBar = new FilterBar("businessValueHelpFilterBar", {
                search: function () {
                    oThisController.onFilterBarSearch();
                }
            });
            oFilterBar.setFilterBarExpanded(false);
            oFilterBar.setBasicSearch(this._oBasicSearchField);
            oFilterBar.setAdvancedMode(true);

            if (oInputData == "/BPRolesVH") {
                oModel.setProperty("/oDialog/sFilterLabel", this.getMessage("BUSINESS_PARTNER_ROLE"));
                oModel.setProperty("/oDialog/sDialogDes", "BusinessPartnerRoleShortName");
                oModel.setProperty("/oDialog/sDialogKey", "BusinessPartnerRole");
                oModel.setProperty("/oDialog/sTitle", this.getMessage("ROLES"));

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

            } else if (oInputData == "/CountriesVH") {
                oModel.setProperty("/oDialog/sFilterLabel", this.getMessage("COUNTRY"));
                oModel.setProperty("/oDialog/sDialogDes", "CountryName");
                oModel.setProperty("/oDialog/sDialogKey", "Country");
                oModel.setProperty("/oDialog/sTitle", this.getMessage("COUNTRY"));

                var oCountriesFilterGroupItemCountry = new FilterGroupItem({
                    groupName: "Countries",
                    name: "Country",
                    label: this.getMessage("COUNTRY_KEY"),
                    visibleInFilterBar: true,
                    control: new Input("filterBarCountryIntput", {
                        name: "Country",
                        submit: function () {
                            oThisController.onFilterBarSearch();
                        }
                    })
                });
                oFilterBar.addFilterGroupItem(oCountriesFilterGroupItemCountry);

                var oCountriesFilterGroupItemCountryName = new FilterGroupItem({
                    groupName: "Countries",
                    name: "CountryName",
                    label: this.getMessage("COUNTRY_NAME"),
                    visibleInFilterBar: true,
                    control: new Input("filterBarCountryNameIntput", {
                        name: "CountryName",
                        submit: function () {
                            oThisController.onFilterBarSearch();
                        }
                    })
                });

                oFilterBar.addFilterGroupItem(oCountriesFilterGroupItemCountryName);

            } else if (oInputData == "/BankAccountsVH") {
                oModel.setProperty("/oDialog/sFilterLabel", this.getMessage("BANK_KEY"));
                oModel.setProperty("/oDialog/sDialogDes", "BankName");
                oModel.setProperty("/oDialog/sDialogKey", "BankNumber");
                oModel.setProperty("/oDialog/sTitle", this.getMessage("BANK"));

                var oBanksFilterGroupItemBankNumber = new FilterGroupItem({
                    groupName: "Banks",
                    name: "BankNumber",
                    label: this.getMessage("BANK_KEY"),
                    visibleInFilterBar: true,
                    control: new Input("filterBarBankNumberIntput", {
                        name: "BankNumber",
                        submit: function () {
                            oThisController.onFilterBarSearch();
                        }
                    })
                });
                oFilterBar.addFilterGroupItem(oBanksFilterGroupItemBankNumber);

                var oBanksFilterGroupItemBankCountry = new FilterGroupItem({
                    groupName: "Banks",
                    name: "BankCountryKey",
                    label: this.getMessage("BANK_COUNTRY"),
                    visibleInFilterBar: true,
                    control: new Input("filterBarBankCountryIntput", {
                        name: "BankCountryKey",
                        submit: function () {
                            oThisController.onFilterBarSearch();
                        }
                    })
                });
                oFilterBar.addFilterGroupItem(oBanksFilterGroupItemBankCountry);

                var oBanksFilterGroupItemBankName = new FilterGroupItem({
                    groupName: "Banks",
                    name: "BankName",
                    label: this.getMessage("BANK_NAME"),
                    visibleInFilterBar: true,
                    control: new Input("filterBarBankNameIntput", {
                        name: "BankName",
                        submit: function () {
                            oThisController.onFilterBarSearch();
                        }
                    })
                });

                oFilterBar.addFilterGroupItem(oBanksFilterGroupItemBankName);

            } else if (oInputData == "/TaxVH") {
                oModel.setProperty("/oDialog/sFilterLabel", this.getMessage("TAX_NUMBER_CATEGORY"));
                oModel.setProperty("/oDialog/sDialogDes", "TaxCategoryDescription");
                oModel.setProperty("/oDialog/sDialogKey", "TaxCategory");
                oModel.setProperty("/oDialog/sTitle", this.getMessage("BANK"));

                var oBanksFilterGroupItemTaxCategory = new FilterGroupItem({
                    groupName: "TaxCategories",
                    name: "TaxCategory",
                    label: this.getMessage("TAX_NUMBER_CATEGORY"),
                    visibleInFilterBar: true,
                    control: new Input("filterBarTaxCategoryIntput", {
                        name: "TaxCategory",
                        submit: function () {
                            oThisController.onFilterBarSearch();
                        }
                    })
                });
                oFilterBar.addFilterGroupItem(oBanksFilterGroupItemTaxCategory);

                var oBanksFilterGroupItemTaxCategoryDescription = new FilterGroupItem({
                    groupName: "TaxCategories",
                    name: "TaxCategoryDescription",
                    label: this.getMessage("TAX_CATEGORY_DESCRIPTION"),
                    visibleInFilterBar: true,
                    control: new Input("filterBarTaxCategoryDescriptionIntput", {
                        name: "TaxCategoryDescription",
                        submit: function () {
                            oThisController.onFilterBarSearch();
                        }
                    })
                });

                oFilterBar.addFilterGroupItem(oBanksFilterGroupItemTaxCategoryDescription);

            }

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
            var oModel = this.getParentModel("mCommon");
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
            var sPath;

            if (sInputField === "BPRoleValueHelpType") {
                sPath = this.selectedValueHelp.getBindingContext().getPath();
                this.selectedValueHelp.setValue(oSelectedRowData.BusinessPartnerRole);

                oModel.setProperty(sPath + "/BusinessPartnerRoleShortName", oSelectedRowData.BusinessPartnerRoleShortName);

                var errorExist = oModel.getProperty(sPath + "/BusinessPartnerRoleState");
                if (errorExist === "Error") {
                    oModel.setProperty(sPath + "/BusinessPartnerRoleState", "None");
                    oModel.setProperty(sPath + "/BusinessPartnerRoleStateText", "");

                }
            } else if (sInputField === "CountryValueHelpType") {
                this.selectedValueHelp.setValue(oSelectedRowData.Country);

                var errorExist = oModel.getProperty("/BPRequest/AddressData/CountryState");
                if (errorExist === "Error") {
                    oModel.setProperty("/BPRequest/AddressData/CountryState", "None");
                    oModel.setProperty("/BPRequest/AddressData/CountryStateText", "");

                }
            } else if (sInputField === "BankValueHelpType") {
                sPath = this.selectedValueHelp.getBindingContext().getPath();
                this.selectedValueHelp.setValue(oSelectedRowData.BankNumber);

                oModel.setProperty(sPath + "/BankCountryKey", oSelectedRowData.BankCountryKey);
                oModel.setProperty(sPath + "/BankName", oSelectedRowData.BankName);
                oModel.setProperty(sPath + "/SWIFTCode", oSelectedRowData.SWIFTCode);
                oModel.setProperty(sPath + "/CityName", oSelectedRowData.CityName);

                var errorExist = oModel.getProperty(sPath + "/BankNumberState");
                if (errorExist === "Error") {
                    oModel.setProperty(sPath + "/BankNumberState", "None");
                    oModel.setProperty(sPath + "/BankNumberStateText", "");

                }
            } else if (sInputField === "TaxCategoryValueHelpType") {
                sPath = this.selectedValueHelp.getBindingContext().getPath();
                this.selectedValueHelp.setValue(oSelectedRowData.TaxCategory);

                oModel.setProperty(sPath + "/TaxCategory", oSelectedRowData.TaxCategory);

                var errorExist = oModel.getProperty(sPath + "/TaxCategoryState");
                if (errorExist === "Error") {
                    oModel.setProperty(sPath + "/TaxCategoryState", "None");
                    oModel.setProperty(sPath + "/TaxCategoryStateText", "");

                }
            }
            this._oValueHelpDialog.close();
        },

        onValueHelpCancelPress: function () {
            this._oValueHelpDialog.close();
        },

        onValueHelpAfterClose: function () {
            var oModel = this.getParentModel("mCommon");

            oModel.setProperty("/BPRolesVH", []);
            oModel.setProperty("/CountriesVH", []);
            oModel.setProperty("/BankAccountsVH", []);
            oModel.setProperty("/TaxVH", []);

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

            var sInputField = this.selectedValueHelp.data().inputCustomData;
            if (sInputField === "BPRoleValueHelpType") {
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
            } else if (sInputField === "CountryValueHelpType") {
                aFilters.push(new Filter({
                    filters: [
                        new Filter({
                            path: "Country",
                            operator: FilterOperator.Contains,
                            value1: sSearchQuery
                        }),
                        new Filter({
                            path: "CountryName",
                            operator: FilterOperator.Contains,
                            value1: sSearchQuery
                        })
                    ],
                    and: false
                }));
            } else if (sInputField === "BankValueHelpType") {
                aFilters.push(new Filter({
                    filters: [
                        new Filter({
                            path: "BankNumber",
                            operator: FilterOperator.Contains,
                            value1: sSearchQuery
                        }),
                        new Filter({
                            path: "BankCountryKey",
                            operator: FilterOperator.Contains,
                            value1: sSearchQuery
                        }),
                        new Filter({
                            path: "BankName",
                            operator: FilterOperator.Contains,
                            value1: sSearchQuery
                        })
                    ],
                    and: false
                }));
            } else if (sInputField === "TaxCategoryValueHelpType") {
                aFilters.push(new Filter({
                    filters: [
                        new Filter({
                            path: "TaxCategory",
                            operator: FilterOperator.Contains,
                            value1: sSearchQuery
                        }),
                        new Filter({
                            path: "TaxCategoryDescription",
                            operator: FilterOperator.Contains,
                            value1: sSearchQuery
                        })
                    ],
                    and: false
                }));
            }

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
         * Convenience method for removing all required Input validation Error.
         * @public
         * @returns Remove errors from value help dialog.
         */
        onChange: function (oEvent) {
            var oThisController = this;
            var oBPModel = oThisController.getParentModel();
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

        /**
         * Convenience method for all Input validation errors.
         * @public
         * @returns Validate all the required input fields.
         */
        _validateInput: function (processContext, taskId, processStatus) {

            var errorExist = false,
                oThisController = this,
                oBPModel = oThisController.getParentModel();

            oThisController.getView().setBusy(true);

            if (oThisController.getModel().getProperty("/isReworkBasicDataStep")) {
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
                var oRoles = oBPModel.getProperty("/BPRequest/RolesData");
                var roleFields = [
                    "BusinessPartnerRole"
                ]
                var roleValue;
                for (var j = 0; j < oRoles.length; j++) {
                    for (var i = 0; i < roleFields.length; i++) {
                        roleValue = oBPModel.getProperty("/BPRequest/RolesData/" + j + "/" + roleFields[i]);
                        if (roleValue && roleValue.trim() && roleValue !== "" && roleValue !== "undefined" && roleValue !==
                            "null") {
                            oBPModel.setProperty("/BPRequest/RolesData/" + j + "/" + roleFields[i] + "State", "None");
                        } else {
                            errorExist = true;
                            if (roleFields[i] === "BusinessPartnerRole") {
                                oBPModel.setProperty("/BPRequest/RolesData/" + j + "/" + roleFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_BUSINESS_PARTNER_ROLE"));
                            }

                            oBPModel.setProperty("/BPRequest/RolesData/" + j + "/" + roleFields[i] + "State", "Error");
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
            }

            // Checking Address Data Fields
            else if (oThisController.getModel().getProperty("/isEnrichAddressStep")) {
                var addressDataFields = [
                    "Country",
                    "PostalCode"
                ]
                var addressDataValue;
                for (var i = 0; i < addressDataFields.length; i++) {
                    addressDataValue = oBPModel.getProperty("/BPRequest/AddressData/" + addressDataFields[i]);
                    if (addressDataValue && addressDataValue.trim() && addressDataValue !== "" && addressDataValue !== "undefined" && addressDataValue !==
                        "null") {
                        oBPModel.setProperty("/BPRequest/AddressData/" + addressDataFields[i] + "State", "None");
                    } else {
                        errorExist = true;
                        if (addressDataFields[i] === "Country") {
                            oBPModel.setProperty("/BPRequest/AddressData/" + addressDataFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_COUNTRY"));
                        }
                        if (addressDataFields[i] === "PostalCode") {
                            oBPModel.setProperty("/BPRequest/AddressData/" + addressDataFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_POSTAL_CODE"));
                        }
                        oBPModel.setProperty("/BPRequest/AddressData/" + addressDataFields[i] + "State", "Error");
                    }
                }
            }

            // Checking Finance Data Fields
            else if (oThisController.getModel().getProperty("/isEnrichFinanceStep")) {

                // Checking Bank Accounts Fields
                var oBankAccounts = oBPModel.getProperty("/BPRequest/FinanceData/BankData");
                var bankAccountDataFields = [
                    "BankNumber",
                    "BankAccount"
                ]
                var bankAccountDataValue;
                for (var j = 0; j < oBankAccounts.length; j++) {
                    for (var i = 0; i < bankAccountDataFields.length; i++) {
                        bankAccountDataValue = oBPModel.getProperty("/BPRequest/FinanceData/BankData/" + j + "/" + bankAccountDataFields[i]);
                        if (bankAccountDataValue && bankAccountDataValue.trim() && bankAccountDataValue !== "" && bankAccountDataValue !== "undefined" && bankAccountDataValue !==
                            "null") {
                            oBPModel.setProperty("/BPRequest/FinanceData/BankData/" + j + "/" + bankAccountDataFields[i] + "State", "None");
                        } else {
                            errorExist = true;
                            if (bankAccountDataFields[i] === "BankNumber") {
                                oBPModel.setProperty("/BPRequest/FinanceData/BankData/" + j + "/" + bankAccountDataFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_BANK_NUMBER"));
                            }
                            if (bankAccountDataFields[i] === "BankAccount") {
                                oBPModel.setProperty("/BPRequest/FinanceData/BankData/" + j + "/" + bankAccountDataFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_BANK_ACCOUNT"));
                            }

                            oBPModel.setProperty("/BPRequest/FinanceData/BankData/" + j + "/" + bankAccountDataFields[i] + "State", "Error");
                        }
                    }
                }

                // Checking Tax Numbers Fields
                var oTaxNumbers = oBPModel.getProperty("/BPRequest/FinanceData/TaxData");
                var taxNumbersDataFields = [
                    "TaxCategory",
                    "TaxNumber"
                ]
                var taxNumberDataValue;
                for (var j = 0; j < oTaxNumbers.length; j++) {
                    for (var i = 0; i < taxNumbersDataFields.length; i++) {
                        taxNumberDataValue = oBPModel.getProperty("/BPRequest/FinanceData/TaxData/" + j + "/" + taxNumbersDataFields[i]);
                        if (taxNumberDataValue && taxNumberDataValue.trim() && taxNumberDataValue !== "" && taxNumberDataValue !== "undefined" && taxNumberDataValue !==
                            "null") {
                            oBPModel.setProperty("/BPRequest/FinanceData/TaxData/" + j + "/" + taxNumbersDataFields[i] + "State", "None");
                        } else {
                            errorExist = true;
                            if (taxNumbersDataFields[i] === "TaxCategory") {
                                oBPModel.setProperty("/BPRequest/FinanceData/TaxData/" + j + "/" + taxNumbersDataFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_TAX_CATEGORY"));
                            }
                            if (taxNumbersDataFields[i] === "TaxNumber") {
                                oBPModel.setProperty("/BPRequest/FinanceData/TaxData/" + j + "/" + taxNumbersDataFields[i] + "StateText", oThisController.getMessage("FIELD_VALIDATION_ERROR_TAX_NUMBER"));
                            }

                            oBPModel.setProperty("/BPRequest/FinanceData/TaxData/" + j + "/" + taxNumbersDataFields[i] + "State", "Error");
                        }
                    }
                }
            }

            if (errorExist) {
                var sGenericErrorText = oThisController.getMessage("FIELD_VALIDATION_ERROR_GENERIC");
                MessageToast.show(sGenericErrorText)
                oThisController.getView().setBusy(false);
                return;
            } else {
                // additional validations
                if (oBPModel.getProperty("/isEnrichAddressStep")) {
                    oThisController._validatePostalCode(processContext, taskId, processStatus);
                } else if (oBPModel.getProperty("/isEnrichFinanceStep") && oBPModel.getProperty("/BPRequest/FinanceData/TaxData").length > 0) {
                    oThisController._validateTaxNumbers(processContext, taskId, processStatus);
                } else {
                    oThisController._triggerComplete(processContext, taskId, processStatus);
                }
            }

        },

        _validatePostalCode: function (processContext, taskId, processStatus) {

            // First get the CSRF token
            var oThisController = this,
                oBPModel = oThisController.getParentModel(),
                sPostalCode = oBPModel.getProperty("/BPRequest/AddressData/PostalCode"),
                sCountry = oBPModel.getProperty("/BPRequest/AddressData/Country");

            var oPayload = {
                RuleServiceId: "3fe50d49a7bb42488c0c8f8b6b3a9462",
                RuleServiceRevision: "2104",
                Vocabulary: [{
                    PostalCodeValidationInputStructure: {
                        PostalCode: sPostalCode,
                        Country: sCountry
                    }
                }]
            };

            oThisController.getView().setBusy(true);

            $.ajax({
                // url: "/comsapbpmEnrich/bpmrulesruntime/rules-service/v1/rules/xsrf-token",
                url: oThisController._getRuntimeBaseURL() + "/bpmrulesruntime/public/spa/commons/v1/xsrf-token",
                method: "GET",
                headers: {
                    "X-CSRF-Token": "Fetch"
                },
                success: function (results, xhr, data) {
                    var bpmruletoken = data.getResponseHeader("X-CSRF-Token");

                    //Then invoke the business rules service via public API
                    $.ajax({
                        // url: "/comsapbpmEnrich/bpmrulesruntime/rules-service/rest/v2/rule-services",
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
                                if (results.Result[0].ValidationResultStructure.Status === "Success") {
                                    oThisController._triggerComplete(processContext, taskId, processStatus);
                                } else {
                                    var sGenericErrorText = oThisController.getMessage("FIELD_VALIDATION_ERROR_GENERIC");
                                    MessageToast.show(sGenericErrorText)
                                    oBPModel.setProperty("/BPRequest/AddressData/PostalCodeState", "Error");
                                    var sErrorText = results.Result[0].ValidationResultStructure.Text;
                                    oBPModel.setProperty("/BPRequest/AddressData/PostalCodeStateText", sErrorText);
                                }
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

        _validateTaxNumbers: function (processContext, taskId, processStatus) {


            var errorExist = false,
                countCalls = 0,
                oThisController = this,
                oBPModel = oThisController.getParentModel(),
                oTaxNumbers = oBPModel.getProperty("/BPRequest/FinanceData/TaxData");

            oThisController.getView().setBusy(true);

            // get the CSRF token
            $.ajax({
                // url: "/comsapbpmEnrich/bpmrulesruntime/rules-service/v1/rules/xsrf-token",
                url: oThisController._getRuntimeBaseURL() + "/bpmrulesruntime/public/spa/commons/v1/xsrf-token",
                method: "GET",
                headers: {
                    "X-CSRF-Token": "Fetch"
                },
                success: function (results, xhr, data) {
                    var bpmruletoken = data.getResponseHeader("X-CSRF-Token");

                    for (var j = 0; j < oTaxNumbers.length; j++) {
                        var sTaxNumber = oBPModel.getProperty("/BPRequest/FinanceData/TaxData/" + j + "/TaxNumber"),
                            sTaxCategory = oBPModel.getProperty("/BPRequest/FinanceData/TaxData/" + j + "/TaxCategory");

                        var oPayload = {
                            RuleServiceId: "dfccef5c8a894f6cb12a41687424a3ee",
                            RuleServiceRevision: "2104",
                            Vocabulary: [{
                                TaxNumberValidationInputStructure: {
                                    TaxNumber: sTaxNumber,
                                    TaxCategory: sTaxCategory
                                }
                            }]
                        };

                        countCalls += 1;

                        //Then invoke the business rules service via public API
                        $.ajax({
                            // url: "/comsapbpmEnrich/bpmrulesruntime/rules-service/rest/v2/rule-services",
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
                                    if (results.Result[0].ValidationResultStructure.Status === "Error") {
                                        errorExist = true;
                                        var sGenericErrorText = oThisController.getMessage("FIELD_VALIDATION_ERROR_GENERIC");
                                        MessageToast.show(sGenericErrorText);
                                        oBPModel.setProperty("/BPRequest/FinanceData/TaxData/" + j + "/TaxNumberState", "Error");
                                        var sErrorText = results.Result[0].ValidationResultStructure.Text;
                                        oBPModel.setProperty("/BPRequest/FinanceData/TaxData/" + j + "/TaxNumberStateText", sErrorText);
                                    }
                                }
                            },
                            error: function (jqXHR, textStatus, errorThrown) {

                                var sErrorText = oThisController.getMessage("BUSINESS_RULES_SERVICE_ERROR");
                                MessageBox.error(sErrorText + "\n Error:" + errorThrown + ".");
                                oThisController.getView().setBusy(false);
                                errorExist = true;
                                return;
                            }
                        });
                    }

                    if (countCalls == oTaxNumbers.length && !errorExist) {
                        oThisController._triggerComplete(processContext, taskId, processStatus);
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    var sErrorText = oThisController.getMessage("BUSINESS_RULES_ACCESS_TOKEN_ERROR");
                    MessageBox.error(sErrorText + "\n Error:" + errorThrown + ".");
                    oThisController.getView().setBusy(false);
                    return;
                }
            });
        },

        _triggerComplete: function (processContext, taskId, processStatus) {

            var oThisController = this;

            oThisController.setBusy(true);

            // form the context that will be updated
            var oPayload;
            if (oThisController.getModel().getProperty("/isEnrichAddressStep")) {
                oPayload = {
                    context: {
                        "BPRequest": {
                            "AddressData": processContext.BPRequest.AddressData
                        },
                        "comments": processContext.comments,
                        "processStatus": processStatus
                    },
                    "status": "COMPLETED"
                };
            } else if (oThisController.getModel().getProperty("/isEnrichFinanceStep")) {
                oPayload = {
                    context: {
                        "BPRequest": {
                            "FinanceData": {
                                "BankData": processContext.BPRequest.FinanceData.BankData,
                                "TaxData": processContext.BPRequest.FinanceData.TaxData
                            }
                        },
                        "comments": processContext.comments,
                        "processStatus": processStatus
                    },
                    "status": "COMPLETED"
                };
            } else if (oThisController.getModel().getProperty("/isReworkBasicDataStep")) {
                if (oThisController.getModel().getProperty("/isOrganization")) {
                    oPayload = {
                        context: {
                            RequesterDetails: {
                                RequesterFirstName: processContext.RequesterDetails.RequesterFirstName,
                                RequesterLastName: processContext.RequesterDetails.RequesterLastName,
                                RequesterEmail: processContext.RequesterDetails.RequesterEmail,
                                RequesterUserId: processContext.RequesterDetails.RequesterUserId,
                                RequesterComment: processContext.RequesterDetails.RequesterComment
                            },
                            BPRequest: {
                                BusinessPartnerCategory: processContext.BPRequest.BusinessPartnerCategory,
                                BusinessPartnerName: processContext.BPRequest.BusinessPartnerName,
                                // BusinessPartnerFullName: processContext.BPRequest.BusinessPartnerFullName,
                                // OrganizationBPName1: processContext.BPRequest.OrganizationBPName1,
                                RolesData: processContext.BPRequest.RolesData
                            },
                            comments: processContext.comments,
                            processStatus: processStatus
                        },
                        status: "COMPLETED"
                    }
                } else if (oThisController.getModel().getProperty("/isPerson")) {
                    oPayload = {
                        context: {
                            RequesterDetails: {
                                RequesterFirstName: processContext.RequesterDetails.RequesterFirstName,
                                RequesterLastName: processContext.RequesterDetails.RequesterLastName,
                                RequesterEmail: processContext.RequesterDetails.RequesterEmail,
                                RequesterUserId: processContext.RequesterDetails.RequesterUserId,
                                RequesterComment: processContext.RequesterDetails.RequesterComment
                            },
                            BPRequest: {
                                BusinessPartnerCategory: processContext.BPRequest.BusinessPartnerCategory,
                                GenderCodeName: processContext.BPRequest.GenderCodeName,
                                FirstName: processContext.BPRequest.FirstName,
                                LastName: processContext.BPRequest.LastName,
                                RolesData: processContext.BPRequest.RolesData
                            },
                            comments: processContext.comments,
                            processStatus: processStatus
                        },
                        status: "COMPLETED"
                    }
                }
            }

            $.ajax({
                // Call workflow API to get the xsrf token
                // url: "/comsapbpmEnrich/bpmworkflowruntime/v1/xsrf-token",
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
                        // url: "/comsapbpmEnrich/bpmworkflowruntime/v1/task-instances/" + taskId,
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
        }

    });
});