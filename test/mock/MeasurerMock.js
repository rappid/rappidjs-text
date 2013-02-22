define(["text/composer/Measurer", "text/metric/Metric"], function (Measurer, Metric) {

    return Measurer.inherit("test.mock.MeasurerMock", {

        loadAssets: function (textFlow, callback) {
            setTimeout(function() {
                callback && callback();
            }, 5);
        },

        measureText: function(span) {

            var style = span.composeStyle(),
                fontSize = style.fontSize || 0;

            return new Metric(span.textLength() * fontSize, fontSize);
        }

    });

});