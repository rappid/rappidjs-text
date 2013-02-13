define(['js/svg/SvgElement', 'text/operation/InsertTextOperation', 'text/operation/SplitParagraphOperation', 'text/operation/ApplyFormatToElementOperation', 'text/entity/TextFlow', 'text/entity/ParagraphElement', 'text/entity/SpanElement', 'text/entity/TextRange', 'text/operation/DeleteOperation'], function (SvgElement, InsertTextOperation, SplitParagraphOperation, ApplyFormatToElementOperation, TextFlow, ParagraphElement, SpanElement, TextRange, DeleteOperation) {

    return SvgElement.inherit('SvgTextArea', {

        defaults: {
            tagName: 'g',
            $internalText: "",
            textFlow: null,
            width: 100,
            height: 100,
            _cursorIndex: 0,
            _anchorIndex: 0
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

        handleKeyDown: function (e) {
            var keyCode = e.keyCode,
                textRange, operation, anchorIndex;

            if (keyCode === 8) {
                e.preventDefault();
                e.stopPropagation();
                anchorIndex = this.$._anchorIndex;
                if(this.$._anchorIndex === this.$._cursorIndex){
                    anchorIndex = this.$._cursorIndex - 1;
                }
                // delete operation
                textRange = new TextRange({activeIndex: this.$._cursorIndex, anchorIndex: anchorIndex});
                operation = new DeleteOperation(textRange, this.$.textFlow);

                operation.doOperation();
                this._renderTextFlow(this.$.textFlow);
                this._setCursorAfterOperation(this.$._anchorIndex === this.$._cursorIndex ? -1 : 0);
            } else if(keyCode === 46){
                e.preventDefault();
                e.stopPropagation();
                // delete operation
                anchorIndex = this.$._anchorIndex;
                if (this.$._anchorIndex === this.$._cursorIndex) {
                    anchorIndex = this.$._cursorIndex + 1;
                }
                textRange = new TextRange({activeIndex: this.$._cursorIndex, anchorIndex: anchorIndex});
                operation = new DeleteOperation(textRange, this.$.textFlow);

                operation.doOperation();

                this._renderTextFlow(this.$.textFlow);
                this._setCursorAfterOperation();
            } else if (keyCode === 37 || keyCode === 39 || keyCode === 38 || keyCode === 40) {
                e.preventDefault();
                // move cursor
                var cursorIndex = this.$._cursorIndex;
                switch (keyCode) {
                    case 37:
                        cursorIndex--;
                        break;
                    case 39:
                        cursorIndex++;
                        break;
                }
                if (e.shiftKey && this.$._anchorIndex === -1) {
                    this.set('_anchorIndex', this.$._cursorIndex);
                } else if (!e.shiftKey && this.$._anchorIndex !== -1) {
                    this.set('_anchorIndex', cursorIndex);
                }
                if (cursorIndex > -1) {
                    this.set('_cursorIndex', cursorIndex);
                }
            } else if (keyCode === 13) {
                e.preventDefault();
                // line break

                textRange = new TextRange({activeIndex: this.$._cursorIndex});
                operation = new SplitParagraphOperation(textRange, this.$.textFlow);

                operation.doOperation();
                this._renderTextFlow(this.$.textFlow);
                this._setCursorAfterOperation(1);
            }
        },

        handleKeyPress: function (e) {
            var keyCode = e.keyCode;

            if (keyCode !== 13 && e.keyIdentifier) {
                // insert text
                this.addChar(String.fromCharCode(keyCode));
            }

        },

        _render_cursorIndex: function (index) {
            var pos = this._getPositionForTextIndex(index);
            if (pos) {
                this.$.cursor.set(pos);
            }
            if (this.$._anchorIndex > -1 && this.$._anchorIndex !== index) {
                pos = this._getPositionForTextIndex(this.$._anchorIndex);
                if (pos) {
                    this.$.anchor.set(pos);
                }
            } else {
                this.$.anchor.set({x: 0, y: 0});
            }
        },

        _commit_cursorIndex: function(index){

            if(index < 0){
                return false;
            }

            if(this.$.textFlow){
                if(index >= this.$.textFlow.textLength()){
                    return false;
                }
            }

            return true;
        },

        _getPositionForTextIndex: function (index) {
            var target,
                textLength = 0,
                child,
                pos,
                charNum,
                childLength;

            for (var i = 0; i < this.$.textContainer.$children.length; i++) {
                child = this.$.textContainer.$children[i];
                target = child;
                childLength = child.$el.textContent.length + 1;
                textLength += childLength;
                if (textLength > index) {
                    charNum = index - (textLength - childLength);

                    if(charNum > 0 && charNum === childLength - 1){
                        charNum--;
                        i = 0;
                        while(charNum > 0 && child.$el.textContent.charAt(charNum) == " "){
                            i++;
                            charNum--;
                        }
                        pos = target.$el.getEndPositionOfChar(charNum);
                        pos.x += i * 4; // TODO: calculate space width
                    } else {
                        pos = target.$el.getStartPositionOfChar(charNum);
                    }
                    return {
                        x: pos.x,
                        y: pos.y
                    };
                }
            }
            return null;
        },

        addChar: function (chr) {
            if (this.$.textFlow) {
                var operation = new InsertTextOperation(new TextRange({activeIndex: this.$._cursorIndex, anchorIndex: this.$._anchorIndex}), this.$.textFlow, chr);
                operation.doOperation();
                this._renderTextFlow(this.$.textFlow);
                this._setCursorAfterOperation(1);
            }
        },

        _setCursorAfterOperation: function(add){
            add = add || 0;

            var cursorIndex = this.$._cursorIndex <= this.$._anchorIndex ? this.$._cursorIndex : this.$._anchorIndex;
            this.set({
                _cursorIndex: cursorIndex + add,
                _anchorIndex: cursorIndex + add
            });
        },

        _onDomAdded: function () {
            this.callBase();
            var self = this;
//            this.$stage.$window.setInterval(function () {
//                self.$.cursor.set('visible', !self.$.cursor.$.visible);
//            }, 600);
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
                    y: this.$currentLine * 16,
                    $textElement: element
                });

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
                    $textElement: element
                });
                var style = this._transformStyle(element.getComputedStyle(), this.$tSpanTransformMap);

                style["alignment-baseline"] = "before-edge";

                tspan.set(style);

                textContainer.addChild(tspan);
            }

        },

        _transformStyle: function (style, map) {

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

            var index = this._getCursorIndexForMousePosition({x: domEvent.clientX, y: domEvent.clientY}, target);
            if (index > -1) {
                this.set({
                    '_cursorIndex': index
                });
            }
            this.$mouseDown = false;
        },

        _onTextMouseDown: function (e) {
            var domEvent = e.domEvent,
                target = e.target;

            e.stopPropagation();
            e.preventDefault();

            var index = this._getCursorIndexForMousePosition({x: domEvent.clientX, y: domEvent.clientY}, target);
            if (index > -1) {
                this.$mouseDown = true;
                this.set({
                    '_anchorIndex': index,
                    '_cursorIndex': index
                });

            }
        },

        _onTextMouseMove: function (e) {
            if (this.$mouseDown) {
                var domEvent = e.domEvent,
                    target = e.target;
                var index = this._getCursorIndexForMousePosition({x: domEvent.clientX, y: domEvent.clientY}, target);
                if (index > -1) {
                    this.set('_cursorIndex',index);
                }
            }
        },

        _getCursorIndexForMousePosition: function (mousePosition, target) {
            var svgRoot = target.getSvgRoot();
            if (svgRoot) {
                var rootRect = this.$.textContainer.$el.getBoundingClientRect(),
                    point = svgRoot.$el.createSVGPoint();
                var factor = svgRoot.globalToLocalFactor();

                point.x = (mousePosition.x - rootRect.left) * factor.x;
                point.y = (mousePosition.y - rootRect.top) * factor.y;

                var num = target.$el.getCharNumAtPosition(point);
                if (num > -1) {
                    var pos = target.$el.getStartPositionOfChar(num),
                        pos2 = target.$el.getEndPositionOfChar(num);
                    if (Math.abs(point.x - pos.x) > Math.abs(point.x - pos2.x)) {
                        num++;
                    }
                }
                var parent = target.$el.parentNode;
                var i = 0;
                while(parent.childNodes[i] !== target.$el){
                    num += parent.childNodes[i].textContent.length + 1;
                    i++;
                }

                return num;
            }
            return num;

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