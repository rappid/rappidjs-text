define(["js/core/Bindable", "underscore"], function(Bindable, _) {

    return Bindable.inherit("text.type.Style", {

        // always use getter to access these values, because the can be calculated

        defaults: {
            fontFamily: "Arial",
            fontWeight: "normal",
            fontHeight: "normal",
            fontSize: "12pt",
            color: "black"
        },

        getFontFamily: function() {
            return this.$.fontFamily;
        },

        getFontWeight: function() {
            return this.$.fontWeight;
        },

        getFontHeight: function() {
            return this.$.fontHeight;
        },

        getFontSize: function() {
            return this.$.fontSize;
        },

        getColor: function() {
            return this.$.color;
        }

    });

});