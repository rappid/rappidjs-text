define(["js/core/EventDispatcher", "js/core/Bindable", "text/entity/Layout", "text/entity/SpanElement", "text/entity/ParagraphElement", "underscore"], function (EventDispatcher, Bindable, Layout, SpanElement, ParagraphElement, _) {

    var LINEBREAK_THRESHOLD = 2;

    var Composer = EventDispatcher.inherit('text.composer.Composer', {

        ctor: function (measurer) {
            if (!measurer) {
                throw new Error("No Measurer defined for Composer");
            }
            this.$brokenIdCounter = 1;
            this.$measurer = measurer;
            this.callBase();
        },

        compose: function (textFlow, layout, callback) {

            callback = callback || this.emptyCallback();
            this.$brokenIdCounter = 1;

            var self = this;
            this.$measurer.loadAssets(textFlow, function (err) {

                if (err) {
                    callback(err);
                } else {

                    var result = new Composer.ComposedTextFlow({
                        textFlow: textFlow,
                        layout: layout,
                        composed: self._compose(textFlow, layout)
                    });
                    result.measure = self.$measurer.measureComposedTextFlow(result);

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
                y += child.getHeight();
                ret.children.push(child);
            } else {
                for (var i = 0; i < group.$.children.$items.length; i++) {
                    child = this._compose(group.$.children.$items[i], newLayout);

                    child.y = y;
                    y += child.getHeight();
                    ret.children.push(child);
                }
            }

            return ret;

        },

        _composeText: function (paragraph, layout) {

            var lines = [], i,
                ret = new Composer.BlockElement(paragraph);


            // split up to soft lines
            var paragraphText = paragraph.text(),
                softLines = paragraphText.split("\n"),
                softLineStartPosition = 0,
                leafPosition = 0,
                spanPositions = {};

            for (var j = 0; j < paragraph.$.children.$items.length; j++) {
                var span = paragraph.$.children.$items[j];
                spanPositions[span.$cid] = leafPosition;
                leafPosition += span.textLength();
            }

            for (var l = 0; l < softLines.length; l++) {
                var softLineContent = softLines[l];
                lines = lines.concat(this._composeSoftLine(paragraph, softLineContent, softLineStartPosition, spanPositions, layout));
                softLineStartPosition += softLineContent.length + 1;
            }

            var height = 0,
                width = 0;

            for (i = 0; i < lines.length; i++) {
                var measure = lines[i]._measure();
                height += measure.lineHeight;
                width = Math.max(width, width);
            }

            ret.children = lines;
            ret.height = height;
            ret.width = width;

            return ret;

        },

        _composeSoftLine: function (paragraph, softLine, softLineStartPosition, spanPositions, layout) {

            var lastLineElement;
            layout = layout || new Layout();

            if (!(layout instanceof Layout)) {
                layout = new Layout(layout);
            }

            var layoutWidth = layout.$.width,
                measurer = this.$measurer,
                words = softLine.split(/[ \u2002]/g),
                lines = [],
                line = new Composer.Line(),
                lineWidth = 0,
                wordPosition = 0;

            lines.push(line);

            for (var w = 0; w < words.length; w++) {
                var word = words[w];
                var wordSpans = this._getWordSpans(paragraph, word, wordPosition + softLineStartPosition, spanPositions);

                var wordWidth = 0,
                    inlineElement,
                    inlineWordSpans = [],
                    i;

                for (i = 0; i < wordSpans.length; i++) {
                    inlineElement = Composer.InlineElement.createFromElement(wordSpans[i], measurer);
                    inlineWordSpans.push(inlineElement);
                    wordWidth += inlineElement.measure.width;
                }


                if (layout.$.autoFlow || !layoutWidth || lineWidth + wordWidth <= layoutWidth) {
                    // word fits line, add it to line

                    lineWidth += wordWidth;
                    // TODO: white space width


                } else if (wordWidth - LINEBREAK_THRESHOLD < layoutWidth) {
                    // word must be placed on a new line
                    if (line.children.length > 0) {
                        lastLineElement = line.children[line.children.length - 1];
                        lastLineElement.item.$.text = lastLineElement.item.$.text.substr(0, lastLineElement.item.$.text.length - 1);
                    }

                    line = new Composer.Line();
                    lines.push(line);
                    lineWidth = wordWidth;
                } else {
                    // split word at char and place it on new lines

                    inlineWordSpans = [];

                    var width = 0;
                    var wordSpanClone;

                    if (line.children.length > 0) {
                        // start with a fresh line

                        lastLineElement = line.children[line.children.length - 1];
                        lastLineElement.item.$.text = lastLineElement.item.$.text.substr(0, lastLineElement.item.$.text.length - 1);
                        line = new Composer.Line();
                        lines.push(line);
                    }

                    lineWidth = 0;
                    for (i = 0; i < wordSpans.length; i++) {
                        var wordSpan = wordSpans[i],
                            wordSpanAdded = false,
                            textStartPosition = 0;

                        for (var c = 0; c < wordSpan.$.text.length; c++) {
                            var charSpan = wordSpan.clone();
                            charSpan.$.text = wordSpan.$.text.charAt(c);

                            inlineElement = Composer.InlineElement.createFromElement(charSpan, measurer);
                            var charWidth = inlineElement.measure.width;

                            if (width + charWidth - LINEBREAK_THRESHOLD < layoutWidth) {
                                // char fits in line
                                width += charWidth;
                            } else {

                                // word span must be split

                                wordSpanClone = wordSpan.clone();
                                wordSpanClone.$.text = wordSpanClone.$.text.substring(textStartPosition, c);
                                wordSpanClone.$.broken = this.$brokenIdCounter;
                                inlineWordSpans.push(Composer.InlineElement.createFromElement(wordSpanClone, measurer));

                                for (var j = 0; j < inlineWordSpans.length; j++) {
                                    line.addInlineElement(inlineWordSpans[j]);
                                }
                                inlineWordSpans = [];

                                wordSpanAdded = (c === wordSpan.$.text.length);
                                textStartPosition = c;
//                                wordPosition++;

                                line = new Composer.Line();
                                lines.push(line);
                                width = 0;
                            }

                        }

                        if (!wordSpanAdded) {
                            wordSpanClone = wordSpan.clone();
                            wordSpanClone.$.text = wordSpanClone.$.text.substring(textStartPosition, c);
                            wordSpanClone.$.broken = this.$brokenIdCounter;
                            inlineElement = Composer.InlineElement.createFromElement(wordSpanClone, measurer);
                            inlineWordSpans.push(inlineElement);

                            lineWidth = width;

                        } else {
                            inlineElement = null;
                        }

                        this.$brokenIdCounter++;

                    }

                    // check how many chars fit into the layout
                    // then create a new line for each fitting chars
                }

                if (inlineElement && w !== words.length - 1) {
                    // not the last word on the soft line
                    inlineElement.item.$.text += " ";

                    var withWhiteSpace = Composer.InlineElement.createFromElement(inlineElement.item, measurer);
                    inlineWordSpans[inlineWordSpans.length - 1] = withWhiteSpace;
                    lineWidth += (withWhiteSpace.measure.width - inlineElement.measure.width);

                    wordPosition++;
                }


                for (i = 0; i < inlineWordSpans.length; i++) {
                    line.addInlineElement(inlineWordSpans[i]);
                }

                // word length + white space
                wordPosition += word.length;

            }

            return lines;

        },

        _getWordSpans: function (paragraph, word, wordStartPosition, spanPositions) {

            var startLeaf = paragraph.findLeaf(wordStartPosition + 1),
                endLeaf = paragraph.findLeaf(wordStartPosition + word.length),
                leaves = [startLeaf],
                leaf,
                wordSpans = [],
                wordPosition = 0;

            if (startLeaf !== endLeaf) {
                leaf = startLeaf;
                // find all leaves
                do {
                    leaf = leaf.getNextLeaf(paragraph);
                    if (leaf) {
                        leaves.push(leaf);
                    }
                } while (leaf && leaf !== endLeaf);
            }

            var startPosition = spanPositions[startLeaf.$cid];
            var firstLeafOffset;

            if (startPosition) {
                firstLeafOffset = wordStartPosition - startPosition;
            } else {
                firstLeafOffset = wordStartPosition;
            }

            for (var i = 0; i < leaves.length; i++) {
                leaf = leaves[i];

                try {
                    var length = leaf.textLength() - firstLeafOffset;
                } catch (e) {
                    console.log(e);
                }


                wordSpans.push(new Composer.WordSpan({
                    text: word.substr(wordPosition, length),
                    originalSpan: leaf
                }));

                wordPosition += length;
                firstLeafOffset = 0;
            }

            return wordSpans;

        }
    });

    Composer.ComposedTextFlow = EventDispatcher.inherit('text.composer.Composer.ComposedTextFlow', {
        ctor: function (attributes) {
            _.extend(this, attributes);
        },

        alignmentToFactor: function(alignment) {
            var alignmentFactor = 0;
            switch (alignment) {
                case "middle":
                    alignmentFactor = 0.5;
                    break;
                case "end":
                    alignmentFactor = 1;
                    break;
            }
            return alignmentFactor;
        },

        getAlignmentOfWidestSpan: function() {
            var paragraph = this.composed.getWidestChild(),
                paragraphStyle = paragraph.item.composeStyle(),
                softLine = paragraph.getWidestChild(),
                line = softLine.getWidestChild(),
                lineElement = line.children[0],
                style = lineElement.item.composeStyle();

            _.extend(style, paragraphStyle);
            return style["textAnchor"];
        }
    });

    Composer.Element = EventDispatcher.inherit("text.composer.Composer.Element", {
        ctor: function (item) {
            this.item = item;
        },

        getWidth: function () {
            return this.width;
        },

        getHeight: function () {
            return this.height;
        }
    });

    Composer.BlockElement = Composer.Element.inherit("text.composer.Composer.BlockElement", {
        ctor: function (item) {
            this.callBase(item);
            this.children = [];
        },

        getHeight: function () {
            var ret = 0;

            for (var i = 0; i < this.children.length; i++) {
                ret += (this.children[i].getHeight() || 0);
            }

            return ret;
        },

        getWidth: function() {
            if (_.isEmpty(this.children)) {
                return 0;
            }

            var maxWidth = null;

            _.each(this.children, function(child) {
                var currentWidth = child.getWidth();
                if (maxWidth === null || currentWidth > maxWidth) {
                    maxWidth = currentWidth;
                }
            });

            return maxWidth;
        },

        getWidestChild: function() {
            if (_.isEmpty(this.children)) {
                return null;
            }

            return _.max(this.children, function(child) {
                return child.getWidth();
            });
        }
    });

    Composer.InlineElement = Composer.Element.inherit("text.composer.Composer.InlineElement", {

        ctor: function (item, measure) {
            this.callBase();
            this.measure = measure;

            var composeStyle = item.composeStyle() || {};
            var height = (composeStyle.fontSize || 0);
            measure.fontHeight = height;
            measure.lineHeight = height * (composeStyle.lineHeight || 1);

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

        getWidth: function () {
            this.measure = this.measure || this._measure();
            return this.measure.width;
        },

        getHeight: function () {
            this.measure = this.measure || this._measure();
            return this.measure.lineHeight;
        },

        getTextHeight: function () {
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
                    height = inlineElement.measure.height || 0,
                    lineHeight = inlineElement.measure.lineHeight;

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

        ctor: function () {
            this.callBase();

            if (!this.$.style && this.$.originalSpan) {
                this.$.style = this.$.originalSpan.$.style;
            }
        },

        composeStyle: function () {
            return this.$.originalSpan.composeStyle();
        }

    });


    return Composer;


});