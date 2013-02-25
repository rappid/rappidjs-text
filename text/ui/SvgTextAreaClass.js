define(['js/svg/SvgElement', 'text/operation/InsertTextOperation', 'text/operation/SplitParagraphOperation', 'text/operation/ApplyStyleToElementOperation', 'text/entity/TextFlow', 'text/entity/ParagraphElement', 'text/entity/SpanElement', 'text/entity/TextRange', 'text/operation/DeleteOperation', 'underscore'], function (SvgElement, InsertTextOperation, SplitParagraphOperation, ApplyStyleToElementOperation, TextFlow, ParagraphElement, SpanElement, TextRange, DeleteOperation, _) {

    return SvgElement.inherit('SvgTextArea', {

        defaults: {
            tagName: 'g',
            $internalText: "",
            textRange: TextRange,
            composedTextFlow: null,
            textFlow: "{composedTextFlow.textFlow}",
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

        $classAttributes: ['textRange', 'text', 'selection', 'cursor', 'textFlow', 'width', 'height', 'anchor'],

        getSelection: function () {
            return this.$.textRange;
        },

        handleKeyDown: function (e) {
            var keyCode = e.keyCode,
                textRange, operation, anchorIndex;

            if (keyCode === 8) {
                e.preventDefault();
                e.stopPropagation();
                anchorIndex = this.$._anchorIndex;
                if (this.$._anchorIndex === this.$._cursorIndex) {
                    anchorIndex = this.$._cursorIndex - 1;
                }
                // delete operation
                textRange = new TextRange({activeIndex: this.$._cursorIndex, anchorIndex: anchorIndex});
                operation = new DeleteOperation(textRange, this.$.textFlow);

                operation.doOperation();

                this._setCursorAfterOperation(this.$._anchorIndex === this.$._cursorIndex ? -1 : 0);
            } else if (keyCode === 46) {
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

                this._setCursorAfterOperation();
            } else if (keyCode === 37 || keyCode === 39 || keyCode === 38 || keyCode === 40) {
                e.preventDefault();
                e.stopPropagation();
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
                var indieces = {
                    _anchorIndex: -1,
                    _cursorIndex: cursorIndex
                };
                if (e.shiftKey && this.$._anchorIndex === -1) {
                    indieces._anchorIndex = this.$._cursorIndex;
                } else if (!e.shiftKey && this.$._anchorIndex !== -1) {
                    indieces._anchorIndex = cursorIndex;
                }
                this.set(indieces);
            } else if (keyCode === 13) {
                e.preventDefault();
                e.stopPropagation();
                // line break
                if (this.$._cursorIndex !== this.$._anchorIndex) {
                    textRange = new TextRange({activeIndex: this.$._cursorIndex, anchorIndex: this.$._anchorIndex});
                    operation = new DeleteOperation(textRange, this.$.textFlow);
                    operation.doOperation();
                    this._setCursorAfterOperation();
                }

                textRange = new TextRange({activeIndex: this.$._cursorIndex});
                operation = new SplitParagraphOperation(textRange, this.$.textFlow);

                operation.doOperation();
                this._setCursorAfterOperation(1);
            }
        },

        handleKeyPress: function (e) {
            var keyCode = e.keyCode;

            if (e.charCode) {
                // insert text
                this.addChar(String.fromCharCode(e.charCode));
            }

        },

        _render_cursorIndex: function (index) {
            var pos = this._getPositionForTextIndex(index);
            if (pos) {
                this.$.cursor.set(pos);
            }
            if (this.$._anchorIndex > -1) {
                if (this.$._anchorIndex !== index) {
                    pos = this._getPositionForTextIndex(this.$._anchorIndex);
                }
                if (pos) {
                    this.$.anchor.set(pos);
                }
            } else {
                this.$.anchor.set({x: 0, y: 0});
            }
        },

        _commit_cursorIndex: function (index) {

            if (index < 0) {
                return false;
            }

            if (this.$.textFlow) {
                if (index >= this.$.textFlow.textLength()) {
                    return false;
                }
            }

            return true;
        },

        _commit_anchorIndex: function (index) {

            if (index < 0) {
                return false;
            }

            if (this.$.textFlow) {
                if (index >= this.$.textFlow.textLength()) {
                    return false;
                }
            }

            return true;
        },

        _commitChangedAttributes: function ($) {
            this.callBase();

            if (this._hasSome($, ['_anchorIndex', '_cursorIndex'])) {
                this.$.textRange.set({
                    activeIndex: this.$._cursorIndex,
                    anchorIndex: this.$._anchorIndex
                });
            }

        },

        _getPositionForTextIndex: function (index) {
            if (!this.$.text.$children.length) {
                return null;
            }

            var textLength = -1,
                child,
                i = 0,
                pos,
                childLength,
                line = -1,
                isIndexEndOfLine = false;

            while (i < this.$.text.$children.length && textLength <= index) {
                child = this.$.text.$children[i];
                childLength = child.$el.textContent.length;
                if (child.has('y')) {
                    textLength++;
                    line++;
                }
                textLength += childLength;
                i++;
                if (index > 0 && textLength === index) {
                    isIndexEndOfLine = true;
                    break;
                }
            }
            if(child.$el.textContent === "" && child.has('y')){
                return {
                    x: child.$el.getAttribute("x"),
                    y: child.$el.getAttribute("y")
                };
            }


            if (isIndexEndOfLine) {
                pos = this.$.text.$el.getEndPositionOfChar(index - line - 1);
            } else {
                pos = this.$.text.$el.getStartPositionOfChar(index - line);
            }
            if (pos) {
                return {
                    x: pos.x,
                    y: pos.y
                };
            } else {
                return null;
            }
        },

        addChar: function (chr) {
            if (this.$.textFlow) {
                var operation = new InsertTextOperation(new TextRange({activeIndex: this.$._cursorIndex, anchorIndex: this.$._anchorIndex}), this.$.textFlow, chr);
                operation.doOperation();
                this._setCursorAfterOperation(1);
            }
        },

        _setCursorAfterOperation: function (add) {
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

        _renderComposedTextFlow: function (composedTextFlow) {

            var text = this.$.text;
            if (!text) {
                return;
            }

            text.removeAllChildren();

            if (!composedTextFlow) {
                return;
            }

            // transform the tree into a list of paragraphs and lines

            var y = 0,
                tspan;

            for (var i = 0; i < composedTextFlow.composed.children.length; i++) {
                var paragraph = composedTextFlow.composed.children[i],
                    paragraphStyle = paragraph.item.composeStyle();

                for (var j = 0; j < paragraph.children.length; j++) {
                    var softLine = paragraph.children[j];

                    for (var k = 0; k < softLine.children.length; k++) {

                        var line = softLine.children[k];

                        y += line.getTextHeight();

                        for (var l = 0; l < line.children.length; l++) {
                            var lineElement = line.children[l].item;

                            tspan = this.$templates["tspan"].createInstance({
                                $text: lineElement.$.text
                            });

                            var style = this._transformStyle(lineElement.composeStyle(), this.$tSpanTransformMap);

                            if (l === 0) {
                                // apply paragraph style
                                _.extend(style, this._transformStyle(paragraphStyle, this.$textTransformMap));

                                var x = 0;

                                switch (style["text-anchor"]) {
                                    case "middle":
                                        x = this.$.width / 2;
                                        break;
                                    case "end":
                                        x = this.$.width;
                                }

                                style.x = x;
                                style.y = y;

                            }

                            tspan.set(style);
                            text.addChild(tspan);
                        }

                        y += line.getHeight() - line.getTextHeight();

                    }
                }
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
                    this.set('_cursorIndex', index);
                }
            }
        },

        _getCursorIndexForMousePosition: function (mousePosition, target) {
            var svgRoot = target.getSvgRoot(),
                num;

            if (svgRoot) {
                var rootRect = this.$.text.$el.getBoundingClientRect(),
                    point = svgRoot.$el.createSVGPoint();
                var factor = svgRoot.globalToLocalFactor();

                point.x = (mousePosition.x - rootRect.left) * factor.x;
                point.y = (mousePosition.y - rootRect.top) * factor.y;

                num = target.$el.getCharNumAtPosition(point);
                if (num > -1) {
                    var startPos = target.$el.getStartPositionOfChar(num),
                        endPos = target.$el.getEndPositionOfChar(num);
                    if (Math.abs(point.x - startPos.x) > Math.abs(point.x - endPos.x)) {
                        num++;
                    }
                }
                var parent = target.$el.parentNode;
                var i = 0;
                while (parent.childNodes[i] !== target.$el) {
                    num += parent.childNodes[i].textContent.length + 1;
                    i++;
                }

                return num;
            }
            return num;

        }

    });


});