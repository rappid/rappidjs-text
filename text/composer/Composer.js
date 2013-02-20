define(["js/core/Base", "js/core/Bindable", "text/entity/Layout"], function (Base, Bindable, Layout) {

    var Composer = Base.inherit('text.composer.Composer', {

        ctor: function (measurer) {
            if (!measurer) {
                throw new Error("No Measurer defined for Composer");
            }

            this.$measurer = measurer;
            this.callBase();
        },

        compose: function (group, layout) {

            // simplification: group could either hold groups or spans

        },

        _composeText: function (paragraph, layout) {
            layout = layout || new Layout();

            var lines = [], i,
                ret = new Composer.Element({
                    item: paragraph,
                    lines: lines
                });

            if (layout.width) {
                // break into lines
            } else {
                // one line -> push all spans to line
                var line = new Composer.Line();

                for (i = 0; i < paragraph.$.children.$items.length; i++) {
                    line.addInlineElement(Composer.InlineElement.createFromElement(
                        paragraph.$.children.$items[i], this.$measurer));
                }

                lines.push(line);

            }

            var height = 0,
                width = 0;

            for (i = 0; i < lines.length; i++) {
                var measure = lines[i]._measure();

                height += measure.lineHeight;
                width = Math.max(width, width)

            }

            ret.set({
                height: height,
                width: width
            });

            return ret;
        }

    });

    Composer.Element = Bindable.inherit("text.composer.Composer.Element", {

        defaults: {

            item: null,

            x: NaN,
            y: NaN,
            width: NaN,
            height: NaN
        }

    });

    Composer.Line = Base.inherit("text.composer.Composer.Line", {

        defaults: {
            measure: null
        },

        ctor: function () {
            this.inlineElements = [];

            this.callBase();
        },

        addInlineElement: function (inlineElement) {
            this.inlineElements.push(inlineElement);
        },

        _measure: function () {
            var ret = {
                height: 0,
                lineHeight: 0,
                width: 0
            };

            for (var i = 0; i < this.inlineElements.length; i++) {
                var inlineElement = this.inlineElements[i],
                    height = inlineElement.measure.$.height || 0,
                    lineHeight = height * (inlineElement.element.composeStyle().lineHeight || 1);

                ret.height = Math.max(ret.height, height);
                ret.lineHeight = Math.max(ret.lineHeight, lineHeight);
                ret.width += inlineElement.measure.$.width || 0;
            }

            this.measure = ret;

            return ret;
        }
    });

    Composer.InlineElement = Base.inherit("text.composer.Composer.InlineElement", {

        ctor: function(element, measure) {
            this.element = element;
            this.measure = measure;
        }
    }, {
        createFromElement: function(element, measurer) {
            return new Composer.InlineElement(element, measurer.measure(element));
        }
    });


    return Composer;


});