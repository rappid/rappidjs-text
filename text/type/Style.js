define(["js/core/Bindable", "underscore"], function(Bindable, _) {

    return Bindable.inherit("text.type.Style", {

        // always use getter to access these values, because the can be calculated

        defaults: {
            fontFamily: "Arial",
            fontWeight: "normal",
            fontStyle: "normal",
            fontSize: "12pt",
            color: "black"
        },

        compose: function() {
            return _.clone(this.$);
        }

    });

});