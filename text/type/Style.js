define(["js/core/Bindable", "underscore"], function(Bindable, _) {

    return Bindable.inherit("text.type.Style", {

        compose: function() {
            return _.clone(this.$);
        }

    });

});