sap.ui.define([], function () {
    "use strict";
    return {
        BPCategoryText: function (sStatus) {
            switch (sStatus) {
                case "1":
                    return this.getMessage("PERSON");
                case "2":
                    return this.getMessage("ORGANIZATION");
                default:
                    return sStatus;
            }
        }
    };
});