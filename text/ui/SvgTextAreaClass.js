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
            _anchorIndex: 0,
            scale: 1,

            editable: true,
            selectable: true,
            showSelection: true
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

        $classAttributes: ['scale','textRange', 'text', 'selection', 'cursor', 'textFlow', 'width', 'height', 'anchor'],

        getSelection: function () {
            return this.$.textRange;
        },

        ctor: function () {
            this.$showCursor = false;
            this.callBase();
            this.bind('textRange','change', this._onTextSelectionChange, this);
        },

        _onTextSelectionChange: function(e){
            this.set({
                _anchorIndex: this.$.textRange.$.anchorIndex,
                _cursorIndex: this.$.textRange.$.activeIndex
            });
        },

        handleKeyDown: function (e) {

            if (!this.$.editable) {
                return;
            }

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
                var indices = {
                    _anchorIndex: -1,
                    _cursorIndex: cursorIndex
                };
                if (e.shiftKey && this.$._anchorIndex === -1) {
                    indices._anchorIndex = this.$._cursorIndex;
                } else if (!e.shiftKey && this.$._anchorIndex !== -1) {
                    indices._anchorIndex = cursorIndex;
                }
                this.set(indices);
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

            if (!this.$.editable) {
                return;
            }

            if (e.charCode) {
                // insert text
                this.addChar(String.fromCharCode(e.charCode));
            }

        },

        _render_cursorIndex: function (index) {
            var cursorPos = this._getPositionForTextIndex(index),
                anchorPos;
            if (cursorPos) {
                this.$.cursor.set(cursorPos);
                if (this.$._anchorIndex > -1 && this.$._anchorIndex !== index) {
                    anchorPos = this._getPositionForTextIndex(this.$._anchorIndex);
                } else {
                    anchorPos = cursorPos;
                }
            }

            if (cursorPos && anchorPos) {
                var startPos = this.$._anchorIndex === -1 || index < this.$._anchorIndex ? cursorPos : anchorPos,
                    endPos = startPos === cursorPos ? anchorPos : cursorPos,
                    rect,
                    y,
                    height,
                    x,
                    width,
                    textBox = this.$.text.$el.getBBox(),
                    textWidth = textBox.width,
                    textX = textBox.x || 0;

                this.$showCursor = cursorPos === anchorPos;
                // go through all selection rectangles
                for (var i = 0; i < this.$.selection.$el.childNodes.length; i++) {
                    rect = this.$.selection.$el.childNodes[i];
                    x = 0;
                    height = parseFloat(rect.getAttribute("height"));
                    y = Math.round(parseFloat(rect.getAttribute("y")) + height, 2);
                    if (i >= startPos.line && i <= endPos.line) {
                        if (i === startPos.line) {
                            x = startPos.x;
                        } else {
                            x = textX;
                        }
                        if (cursorPos !== anchorPos) {
                            if (i === endPos.line) {
                                width = endPos.x - x;
                            } else {
                                width = textX + (textWidth - x);
                            }
                        } else {
                            width = 0;
                        }
                    } else {
                        x = 0;
                        width = 0;
                    }
                    rect.setAttribute('x', x);
                    rect.setAttribute('width', width);
                }
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
            if (!this.$addedToDom || !this.$.text.$el.childNodes.length) {
                return null;
            }

            var textLength = -1,
                child,
                i = 0,
                pos,
                childLength,
                line = -1,
                isIndexEndOfLine = false;

            while (i < this.$.text.$el.childNodes.length && textLength <= index) {
                child = this.$.text.$el.childNodes[i];
                childLength = child.textContent.length;
                if (child.getAttribute('y')) {
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
            if (child.textContent === "" && child.getAttribute('y')) {
                pos = {
                    x: child.getAttribute("x"),
                    y: parseFloat(child.getAttribute("y"))
                };
            } else {
                if (isIndexEndOfLine) {
                    pos = this.$.text.$el.getEndPositionOfChar(index - line - 1);
                } else {
                    pos = this.$.text.$el.getStartPositionOfChar(index - line);
                }
            }
            var lineHeight = parseFloat(child.getAttribute('data-height')),
                fontSize = parseFloat(child.getAttribute("font-size"));

            if (pos) {
                return {
                    x: pos.x,
                    y: pos.y - 2 * fontSize + lineHeight,
                    height: fontSize,
                    line: line
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
            }, {force: true});
        },

        _onDomAdded: function () {
            this.callBase();
            var self = this;
            if(this.$.selectable){
                this.$stage.$window.setInterval(function () {
                    var showCursor;
                    if (self.$showCursor && self.$.showSelection) {
                        showCursor = !self.$.cursor.$.visible;
                    } else {
                        showCursor = false;
                    }
                    self.$.cursor.set('visible', showCursor);
                }, 550);
            }
        },

        _renderComposedTextFlow: function (composedTextFlow) {

            var text = this.$.text;
            if (!text) {
                return;
            }

            text.$el.textContent = "";

            text.set("visible", false);
            this.$.selection.$el.data = null;

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

                        var line = softLine.children[k],
                            lineHeight = line.getHeight(),
                            textHeight = line.getTextHeight(),
                            maxFontSize = 0;


                        y += textHeight;

                        for (var l = 0; l < line.children.length; l++) {
                            var lineElement = line.children[l].item;
                            tspan = this.$stage.$document.createElementNS(SvgElement.SVG_NAMESPACE, "tspan");

                            var style = this._transformStyle(lineElement.composeStyle(), this.$tSpanTransformMap);

                            maxFontSize = Math.max(style["font-size"], maxFontSize);

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
                            style["data-height"] = textHeight;

                            for (var key in style) {
                                if (style.hasOwnProperty(key)) {
                                    tspan.setAttribute(key, style[key]);
                                }
                            }
                            tspan.textContent = lineElement.$.text;
                            text.$el.appendChild(tspan);
                        }

                        // add empty selection element
                        var selectionRect = this.$stage.$document.createElementNS(SvgElement.SVG_NAMESPACE, "rect");
                        selectionRect.setAttribute("style", "fill: blue;");
                        selectionRect.setAttribute("y", y - maxFontSize);
                        selectionRect.setAttribute("height", lineHeight);
                        selectionRect.setAttribute("width", 0);
                        selectionRect.setAttribute("class", "text-selection");

                        this.$.selection.$el.appendChild(selectionRect);

                        y += lineHeight - textHeight;

                    }
                }
            }

            text.set("visible", true);
            this._render_cursorIndex(this.$._cursorIndex);
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

            if (!this.$.selectable) {
                return;
            }

            var domEvent = e.pointerEvent,
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

            if (!this.$.selectable) {
                return;
            }

            var domEvent = e.pointerEvent,
                target = e.target;

//            e.stopPropagation();

            var index = this._getCursorIndexForMousePosition({x: domEvent.clientX, y: domEvent.clientY}, target);
            if (index > -1) {
                this.$mouseDown = true;
                this.set('_anchorIndex', index);
                this.set('_cursorIndex', index);
            }
        },

        _onTextMouseMove: function (e) {

            if (!this.$.selectable) {
                return;
            }

            if (this.$mouseDown) {
                e.stopPropagation();
                e.preventDefault();
                var domEvent = e.pointerEvent,
                    target = e.target;
                var index = this._getCursorIndexForMousePosition({x: domEvent.clientX, y: domEvent.clientY}, target);
                if (index > -1) {
                    this.set('_cursorIndex', index);
                }
            }
        },

        _onTextAreaMove: function (e) {

            if (!this.$.selectable) {
                return;
            }

            e.stopPropagation();
            e.preventDefault();
        },

        _getCursorIndexForMousePosition: function (mousePosition, target) {
            var svgRoot = target.getSvgRoot(),
                num;

            if (svgRoot) {
                var point = svgRoot.$el.createSVGPoint(),
                    child;

                point.x = mousePosition.x;
                point.y = mousePosition.y;

                var matrix = this.$.text.$el.getScreenCTM();

                point = point.matrixTransform(matrix.inverse());

                num = target.$el.getCharNumAtPosition(point);

                var index = num;
                if (num > -1) {
                    var startPos = target.$el.getStartPositionOfChar(num),
                        endPos = target.$el.getEndPositionOfChar(num);
                    if (Math.abs(point.x - startPos.x) > Math.abs(point.x - endPos.x)) {
                        index++;
                    }
                    var i = 0,
                        y;
                    while (i < this.$.text.$el.childNodes.length) {
                        child = this.$.text.$el.childNodes[i];
                        y = child.getAttribute('y');
                        if (y && parseFloat(y) >= startPos.y) {
                            break;
                        }
                        if (i > 0 && y) {
                            index++;
                        }
                        i++;
                    }
                }

                return index;
            }
            return num;

        }

    });

});