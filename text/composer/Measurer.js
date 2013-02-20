define(["js/core/Base", "text/entity/SpanElement"], function(Base, SpanElement) {

    return Base.inherit("text.measurer.Measurer", {

        measure: function (element) {

            if (element instanceof SpanElement) {
                return this.measureText(element);
            }

            throw new Error("Not implemented");

        },

        measureText: function (span) {
            throw new Error("Not implemented");
        }

    });

});