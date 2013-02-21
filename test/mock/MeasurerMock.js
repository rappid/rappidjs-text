define(["text/composer/Measurer", "text/metric/Metric"], function (Measurer, Metric) {

    return Measurer.inherit("test.mock.MeasurerMock", {

        measureText: function(span) {

            var style = span.composeStyle(),
                fontSize = style.fontSize || 0;

            return new Metric(span.textLength() * fontSize, fontSize);
        }

    });

});