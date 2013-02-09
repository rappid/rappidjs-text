define(['js/svg/SvgElement', 'text/operation/InsertTextOperation', 'text/operation/SplitParagraphOperation', 'text/operation/ApplyFormatToElementOperation', 'text/entity/TextFlow', 'text/entity/ParagraphElement', 'text/entity/SpanElement'], function (SvgElement, InsertTextOperation, SplitParagraphOperation, ApplyFormatToElementOperation, TextFlow, ParagraphElement, SpanElement) {

    return SvgElement.inherit('SvgTextArea', {

        defaults: {
            tagName: 'g',
            $internalText: "",
            textFlow: null,
            width: 100,
            height: 100
        },

        $tSpanTransformMap: {
            "fontFamily": "font-family",
            "fontWeight": "font-weight",
            "fontStyle": "font-style",
            "fontSize": "font-size",
            "color": "fill"
        },

        $textTransformMap: {
            "fontFamily": "font-family",
            "fontWeight": "font-weight",
            "fontStyle": "font-style",
            "fontSize": "font-size",
            "color": "fill",
            "textAnchor": "text-anchor"
        },

        $classAttributes: ['textElement', 'textContainer', 'cursor', 'textFlow', 'width', 'height'],

        _onDomAdded: function () {
            this.callBase();
            var self = this;
            this.$stage.$window.setInterval(function () {
//                self.$.cursor.set('visible', !self.$.cursor.$.visible);
            }, 600);
        },

        _renderTextFlow: function (textFlow) {
            if (textFlow) {
                var self = this;
                this.$.textContainer.removeAllChildren();
                this.$currentLine = 0;
                textFlow.$.children.each(function (child) {
                    self._renderElement(child, self.$.textContainer);
                });
            }

        },
        _renderElement: function (element, textContainer) {

            if (element instanceof ParagraphElement) {
                var self = this;

                // TODO: use correct line height -> can only be determinated after composing
                var textElement = this.createComponent(SvgElement, {
                    tagName: "text",
                    y: this.$currentLine * 16
                });

                textElement.$textElement = element;
                var x = 0,
                    transformedStyle = this._transformStyle(element.getComputedStyle(), this.$textTransformMap);

                switch (transformedStyle["text-anchor"]) {
                    case "middle":
                        x = this.$.width / 2;
                        break;
                    case "end":
                        x = this.$.width
                }

                transformedStyle.x = x;
                transformedStyle["text-rendering"] = "geometricprecision";

                textElement.set(transformedStyle);


                element.$.children.each(function (child) {
                    self._renderElement(child, textElement);
                });

                textElement.bind('on:mouseup', this._onTextMouseUp, this);
                textElement.bind('on:mousedown', this._onTextMouseDown, this);
                textElement.bind('on:mousemove', this._onTextMouseMove, this);

                textContainer.addChild(textElement);
                this.$currentLine++;
            } else if (element.isLeaf) {
                var tspan = this.$templates["tspan"].createInstance({
                    $text: element.text()
                });

                tspan.$textElement = element;
                var style = this._transformStyle(element.getComputedStyle(), this.$tSpanTransformMap);

                style["alignment-baseline"] = "before-edge";

                tspan.set(style);

                textContainer.addChild(tspan);
            }

        },

        _transformStyle: function(style, map) {

            var ret = {};

            for (var key in style) {
                if (style.hasOwnProperty(key) && map.hasOwnProperty(key)) {
                    ret[map[key]] = style[key];
                }
            }

            return ret;
        },

        _onTextMouseUp: function (e) {
            var domEvent = e.domEvent,
                target = e.target;

            var pos = this._getCursorPositionForMousePosition({x: domEvent.clientX, y: domEvent.clientY}, target);
            if (pos) {
                this.$.cursor.set(pos);
                console.log(window.getSelection());
            }
            this.$mouseDown = false;
        },

        _onTextMouseDown: function (e) {
            var domEvent = e.domEvent,
                target = e.target;

            e.stopPropagation();
            e.preventDefault();

            var pos = this._getCursorPositionForMousePosition({x: domEvent.clientX, y: domEvent.clientY}, target);
            if (pos) {
                this.$mouseDown = true;
                pos.width = 0;
                this.$anchorPosition = pos;
                this.$.selection.set({
                    width: 0
                });
            }
        },

        _onTextMouseMove: function (e) {
            if (this.$mouseDown) {
                var domEvent = e.domEvent,
                    target = e.target;
                var pos = this._getCursorPositionForMousePosition({x: domEvent.clientX, y: domEvent.clientY}, target);
                if (pos) {
                    this.$.cursor.set(pos);
                    var x, width;
                    if (this.$anchorPosition.x <= this.$.cursor.$.x) {
                        x = this.$anchorPosition.x;
                        width = this.$.cursor.$.x - this.$anchorPosition.x;
                    } else {
                        x = this.$.cursor.$.x;
                        width = this.$anchorPosition.x - this.$.cursor.$.x;
                    }
                    this.$.selection.set({
                        x: x,
                        width: width
                    })
                }
            }
        },

        _getCursorPositionForMousePosition: function (mousePosition, target) {
            var svgRoot = target.getSvgRoot();
            if (svgRoot) {
                var rootRect = this.$.textContainer.$el.getBoundingClientRect(),
                    point = svgRoot.$el.createSVGPoint();
                var factor = svgRoot.globalToLocalFactor();

                point.x = (mousePosition.x - rootRect.left) * factor.x;
                point.y = (mousePosition.y - rootRect.top) * factor.y;

                var num = target.$el.getCharNumAtPosition(point);
                if (num > -1) {
                    var pos = target.$el.getEndPositionOfChar(num),
                        pos2 = target.$el.getStartPositionOfChar(num);
                    if (Math.abs(point.x - pos.x) > Math.abs(point.x - pos2.x)) {
                        pos = pos2;
                    }
                    pos.y -= 10;
                    return {
                        x: pos.x,
                        y: pos.y
                    };
                }
            }
            return null;

        },

        _positionCursor: function (e) {
            var domEvent = e.domEvent;

            var targetElement = domEvent.target;


        },

        _getWidthForText: function (text) {
            if (this.isRendered()) {
                this.$.textElement.$children[0].set('textContent', text);
                return this.$.textElement.$el.getComputedTextLength();
            }

            return 0;
        },

        _getLineHeight: function () {
            if (this.isRendered()) {
                this.$.textElement.$children[0].set('textContent', "A");
                return this.$.textElement.$el.getBBox().height;
            }

            return 0;
        },

        _wrapText: function (text) {

            var bbox = this.$el.getBBox(),
                words = text.split(" "),
                width = 50,
                spaceWidth = this._getWidthForText("_"),
                wordWidth,
                word,
                wordStack = [],
                lineHeight = this._getLineHeight(),
                currentLineLength = 0,
                splitIndex,
                originalWord,
                linebreaks,
                linebreakStack;

            this.$.textBlock.removeAllChildren();

            while (words.length) {
                word = words.shift();

                if (word === 1) {
                    wordStack.push(word);
                    currentLineLength = 0;
                    continue;
                }

                if (word.indexOf("\n") > 0) {
                    linebreakStack = [];
                    linebreaks = word.split("\n");
                    if (linebreaks.length) {
                        for (var k = 0; k < linebreaks.length; k++) {
                            if (k > 0) {
                                linebreakStack.push(1, linebreaks[k]);
                            } else {
                                word = linebreaks[k];
                            }
                        }
                    }
                    words = linebreakStack.concat(words);
                }

                wordWidth = this._getWidthForText(word);
                splitIndex = word.length;

                if (currentLineLength + wordWidth > width) {

                    if (currentLineLength > 0) {
                        wordStack.push(1);

                        currentLineLength = 0;
                    }


                    originalWord = word;
                    while (wordWidth > width) {
                        splitIndex = word.length - 1;
                        word = word.substr(0, splitIndex);
                        wordWidth = this._getWidthForText(word);
                    }

                    if (word.length !== originalWord.length) {
                        // add linebreak
                        words.unshift(originalWord.substr(splitIndex));
                        words.unshift(1);
                    }
                }
                word = word.trim();

                wordStack.push(word);
                currentLineLength += wordWidth;

            }

            var realWords = [], line, lineNumber = 1;
            for (var j = 0; j < wordStack.length; j++) {
                if (wordStack[j] === 1) {
                    line = realWords.join(" ") || " ";
                    this._addTextWrap(line, lineHeight * lineNumber);
                    lineNumber++;
                    realWords = [];
                } else {
                    realWords.push(wordStack[j]);
                }
            }

            if (realWords.length) {
                this._addTextWrap(realWords.join(" "), lineHeight * (lineNumber));
            }

        },

        _addTextWrap: function (text, y) {
            var tspan = this.$templates["tspan"].createInstance({text: text, y: y, x: 0, "text-anchor": "middle"});

            this.$.textBlock.addChild(tspan);
        }

    });


});