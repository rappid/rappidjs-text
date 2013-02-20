define(["js/core/Base", "js/core/Bindable", "text/entity/Layout", "text/entity/SpanElement"], function (Base, Bindable, Layout, SpanElement) {

    var Composer = Base.inherit('text.composer.Composer', {

        ctor: function (measurer) {
            this.$spaceWidthCache = {};

            if (!measurer) {
                throw new Error("No Measurer defined for Composer");
            }

            this.$measurer = measurer;
            this.callBase();
        },

        compose: function (group, layout) {

            // simplification: group could either hold groups or spans

        },

        _measureWord: function() {

        },

        _composeText: function (paragraph, layout) {
            layout = layout || new Layout();

            var lines = [], i,
                ret = new Composer.Element({
                    item: paragraph,
                    lines: lines
                }),
                measurer = this.$measurer;

            var line = new Composer.Line();
            lines.push(line);

            var layoutWidth = layout.$.width;

            if (layoutWidth) {
                // break into lines
                var text = paragraph.text(),
                    lineWidth = 0,
                    softLines = text.split("\n"),
                    charPosition = 0,
                    leafPosition = 0;

                for (var j = 0; j < softLines.length; j++) {

                    var softLine = softLines[j],
                        words = softLine.split(" ");

                    for (var k = 0; k < words.length; k++) {
                        var word = words[k];
                        var start = charPosition;
                        var end = charPosition + word.length;

                        var startLeaf = paragraph.findLeaf(start);
                        var endLeaf = paragraph.findLeaf(end);

                        var leafs = [startLeaf];
                        var leaf;

                        if (startLeaf !== endLeaf) {
                            leaf = startLeaf;
                            // find all leafs
                            do {
                                leaf = leaf.getNextLeaf(paragraph);
                                leafs.push(leaf);
                            } while (leaf && leaf !== endLeaf);
                        }

                        var wordSpans = [],
                            inlineWordSpans = [];

                        // create new span elements for split words
                        if (leafs.length === 1) {
                            // word exists of just one leaf
                            wordSpans = [new Composer.WordSpan({
                                text: word,
                                originalSpan: startLeaf
                            })]
                        } else {
                            // word consists of multiple spans
                            var wordPosition = start,
                                leafStartPosition = leafPosition;

                            for (var l = 0; l < leafs.length; l++) {
                                leaf = leafs[l];
                                var wordSpanLength = leafStartPosition + leaf.textLength() - wordPosition;
                                wordSpans.push(new Composer.WordSpan({
                                    text: word.substr(wordPosition, wordSpanLength),
                                    originalSpan: leaf
                                }));

                                leafStartPosition += leaf.textLength();
                                wordPosition += wordSpanLength;
                            }
                        }

                        var wordWidth = 0;
                        for (i = 0; i < wordSpans.length; i++) {
                            var inlineElement = Composer.InlineElement.createFromElement(wordSpans[i], measurer);
                            inlineWordSpans.push(inlineElement);
                            wordWidth += inlineElement.measure.$.width;
                        }

                        if (lineWidth + wordWidth <= layoutWidth) {
                            // word fits line, add it to line

                            lineWidth += wordWidth;
                            // TODO: white space width

                        } else if (wordWidth < layoutWidth || true) { // FIXME: if the word is larger than the layout, split it up on chars
                            // word can be placed on a new line
                            line = new Composer.Line();
                            lines.push(line);
                            lineWidth = wordWidth;
                        }

                        for (i = 0; i < inlineWordSpans.length; i++) {
                            line.addInlineElement(inlineWordSpans[i]);
                        }

                        charPosition += word.length;
                    }


                    charPosition++;
                }

            } else {
                // one line -> push all spans to line

                for (i = 0; i < paragraph.$.children.$items.length; i++) {
                    line.addInlineElement(Composer.InlineElement.createFromElement(
                        paragraph.$.children.$items[i], measurer));
                }

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


    Composer.WordSpan = SpanElement.inherit('text.composer.Composer.WordSpan', {

        defaults: {
            originalSpan: null
        },

        composeStyle: function() {
            return this.$.originalSpan.composeStyle();
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