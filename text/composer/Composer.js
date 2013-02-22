define(["js/core/Base", "js/core/Bindable", "text/entity/Layout", "text/entity/SpanElement", "text/entity/ParagraphElement"], function (Base, Bindable, Layout, SpanElement, ParagraphElement) {

    var Composer = Base.inherit('text.composer.Composer', {

        ctor: function (measurer) {
            if (!measurer) {
                throw new Error("No Measurer defined for Composer");
            }

            this.$measurer = measurer;
            this.callBase();
        },

        compose: function(textFlow, layout, callback) {

            callback = callback || this.emptyCallback();

            var self = this;
            this.$measurer.loadAssets(textFlow, function(err) {

                if (err) {
                    callback(err);
                } else {

                    var result = {
                        textFlow: textFlow,
                        layout: layout,
                        composed: self._compose(textFlow, layout)
                    };

                    callback(null, result);
                }
            });
        },

        _compose: function (group, layout) {
            // simplification: group could either hold groups or spans
            layout = layout || new Layout();

            if (!(layout instanceof Layout)) {
                layout = new Layout(layout);
            }

            // TODO: Margins, Borders, Padding

            var ret = new Composer.BlockElement(group),
                child;

            var newLayout = layout,
                y = 0;

            if (group instanceof ParagraphElement) {
                child = this._composeText(group, newLayout);
                child.y = y;
                ret.children.push(child);
            } else {
                for (var i = 0; i < group.$.children.$items.length; i++) {
                    child = this._compose(group.$.children.$items[i], newLayout);

                    child.y = y;
                    y += child.height;
                    ret.children.push(child);
                }
            }

            return ret;

        },

        _composeText: function (paragraph, layout) {
            layout = layout || new Layout();

            if (!(layout instanceof Layout)) {
                layout = new Layout(layout);
            }

            var lines = [], i,
                ret = new Composer.BlockElement(paragraph),
                measurer = this.$measurer;

            ret.children = lines;

            var line = new Composer.Line();
            lines.push(line);

            var layoutWidth = layout.$.width;

            if (layoutWidth) {
                // break into lines
                var text = paragraph.text(),
                    lineWidth = 0,
                    softLines = text.split("\n"),
                    charPosition = 0,
                    leafPosition = 0,
                    softLine,
                    words,
                    word,
                    start,
                    end,
                    startLeaf,
                    endLeaf,
                    leaves,
                    leaf,
                    wordWidth;

                for (var j = 0; j < softLines.length; j++) {

                    softLine = softLines[j];
                    words = softLine.split(" ");

                    for (var k = 0; k < words.length; k++) {
                        word = words[k];
                        start = charPosition;
                        end = charPosition + word.length;

                        startLeaf = paragraph.findLeaf(start);
                        endLeaf = paragraph.findLeaf(end);

                        leaves = [startLeaf];

                        if (startLeaf !== endLeaf) {
                            leaf = startLeaf;
                            // find all leaves
                            do {
                                leaf = leaf.getNextLeaf(paragraph);
                                leaves.push(leaf);
                            } while (leaf && leaf !== endLeaf);
                        }

                        var wordSpans = [],
                            inlineWordSpans = [];

                        // create new span elements for split words
                        if (leaves.length === 1) {
                            // word exists of just one leaf
                            wordSpans = [new Composer.WordSpan({
                                text: word,
                                originalSpan: startLeaf
                            })];
                        } else {
                            // word consists of multiple spans
                            var wordPosition = start,
                                leafStartPosition = leafPosition;

                            for (var l = 0; l < leaves.length; l++) {
                                leaf = leaves[l];
                                var wordSpanLength = leafStartPosition + leaf.textLength() - wordPosition;
                                wordSpans.push(new Composer.WordSpan({
                                    text: word.substr(wordPosition, wordSpanLength),
                                    originalSpan: leaf
                                }));

                                leafStartPosition += leaf.textLength();
                                wordPosition += wordSpanLength;
                            }
                        }

                        wordWidth = 0;
                        for (i = 0; i < wordSpans.length; i++) {
                            var inlineElement = Composer.InlineElement.createFromElement(wordSpans[i], measurer);
                            inlineWordSpans.push(inlineElement);
                            wordWidth += inlineElement.measure.width;
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
                width = Math.max(width, width);
            }

            ret.height = height;
            ret.width = width;

            return ret;
        }

    });

    Composer.Element = Base.inherit("text.composer.Composer.Element", {
        ctor: function(item) {
            this.item = item;
        },

        getWidth: function() {
            return this.width;
        },

        getHeight: function () {
            return this.height;
        }
    });

    Composer.BlockElement = Composer.Element.inherit("text.composer.Composer.BlockElement", {
        ctor: function(item) {
            this.callBase(item);
            this.children = [];
        }
    });

    Composer.InlineElement = Composer.Element.inherit("text.composer.Composer.InlineElement", {

        ctor: function(item, measure) {
            this.callBase();
            this.measure = measure;
        }

    }, {
        createFromElement: function (element, measurer) {
            return new Composer.InlineElement(element, measurer.measure(element));
        }
    });

    Composer.Line = Composer.BlockElement.inherit("text.composer.Composer.Line", {

        ctor: function (item) {
            this.callBase(item);
        },

        addInlineElement: function (inlineElement) {
            this.children.push(inlineElement);
            this.measure = null;
        },

        getWidth: function() {
            this.measure = this.measure || this._measure();
            return this.measure.width;
        },

        getHeight: function() {
            this.measure = this.measure || this._measure();
            return this.measure.lineHeight;
        },

        getTextHeight: function() {
            this.measure = this.measure || this._measure();
            return this.measure.height;
        },

        _measure: function () {
            var ret = {
                height: 0,
                lineHeight: 0,
                width: 0
            };

            for (var i = 0; i < this.children.length; i++) {
                var inlineElement = this.children[i],
                    composeStyle = inlineElement.item.composeStyle() || {},
                    height = inlineElement.measure.height || 0,
                    lineHeight = height * (composeStyle.lineHeight || 1);

                ret.height = Math.max(ret.height, height);
                ret.lineHeight = Math.max(ret.lineHeight, lineHeight);
                ret.width += inlineElement.measure.width || 0;
            }

            return ret;
        }
    });


    Composer.WordSpan = SpanElement.inherit('text.composer.Composer.WordSpan', {

        defaults: {
            originalSpan: null
        },

        composeStyle: function () {
            return this.$.originalSpan.composeStyle();
        }

    });


    return Composer;


});