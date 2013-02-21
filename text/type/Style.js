define(["js/core/Bindable", "underscore"], function (Bindable, _) {

    return Bindable.inherit("text.type.Style", {

        compose: function () {
            return _.clone(this.$);
        },

        merge: function(style){
            if(style){
                // unset all attributes that are not or different in style
                for(var key in this.$){
                    if(this.$.hasOwnProperty(key)){
                        if(!style.$.hasOwnProperty(key) || style.$[key] != this.$[key]){
                            this.unset(key);
                        }
                    }
                }
            } else {
                this.clear();
            }
        }

    });

});