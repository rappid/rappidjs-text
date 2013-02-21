define(["js/core/Base"], function(Base) {

    return Base.inherit({

        ctor: function(width, height) {
            this.width = width || 0;
            this.height = height || 0;
        }

    });

});