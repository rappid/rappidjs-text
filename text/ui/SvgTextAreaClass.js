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

        $classAttributes: ['textRange', 'text', 'selection', 'cursor', 'textFlow', 'width', 'height', 'anchor'],

        getSelection: function () {
            return this.$.textRange;
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

            if (!this.$.editable) {
                return;
            }

            if (e.charCode) {
                // insert text
                this.addChar(String.fromCharCode(e.charCode));
            }

        },
        _render_cursorIndex: function (index) {
            var pos = this._getPositionForTextIndex(index),
                cursorPos = pos,
                anchorPos;
            if (pos) {
                if (!this.$.cursor.$.visible) {
//                    this.$.cursor.set('visible',true);
                }
//                this.$.cursor.set(pos);
            }
            if (this.$._anchorIndex > -1) {
                if (!this.$.anchor.has('x') || this.$._anchorIndex !== index) {
                    pos = this._getPositionForTextIndex(this.$._anchorIndex);
                }
                if (pos) {
                    if (!this.$.anchor.$.visible) {
//                        this.$.anchor.set('visible', true);
                    }
                    anchorPos = pos;
                    this.$.anchor.set(pos);
                }
            } else {
//                this.$.anchor.set({x: 0, y: 0});
            }

            if (cursorPos && cursorPos && anchorPos) {
                var startPos = index < this.$._anchorIndex ? cursorPos : anchorPos,
                    endPos = startPos === cursorPos ? anchorPos : cursorPos,
                    rect,
                    y,
                    height,
                    x,
                    width,
                    textBox = this.$.text.$el.getBBox(),
                    textWidth = textBox.width,
                    textX = textBox.x || 0;

                // go through all selection rectangles
                for (var i = 0; i < this.$.selection.$el.childNodes.length; i++) {
                    rect = this.$.selection.$el.childNodes[i];
                    x = 0;
                    height = parseFloat(rect.getAttribute("height"));
                    y = Math.round(parseFloat(rect.getAttribute("y")) + height, 2);
                    if (y >= startPos.y && y <= endPos.y) {
                        if (y === startPos.y) {
                            x = startPos.x;
                        } else {
                            x = textX;
                        }
                        if (cursorPos !== anchorPos) {
                            if (y === endPos.y) {
                                width = endPos.x - x;
                            } else {
                                width = textX + (textWidth - x);
                            }
                        } else {
                            width = 1;
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
                return {
                    x: child.getAttribute("x"),
                    y: parseFloat(child.getAttribute("y"))
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
            }, {force: true});
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

                        var line = softLine.children[k];
                        // add empty selection element

                        var selectionRect = this.$stage.$document.createElementNS(SvgElement.SVG_NAMESPACE, "rect");
                        selectionRect.setAttribute("style", "fill: blue;");
                        selectionRect.setAttribute("y", y);
                        selectionRect.setAttribute("height", line.getHeight());
                        selectionRect.setAttribute("width", 0);
                        selectionRect.setAttribute("class", "text-selection");

                        this.$.selection.$el.appendChild(selectionRect);

                        y += line.getTextHeight();

                        for (var l = 0; l < line.children.length; l++) {
                            var lineElement = line.children[l].item;
                            tspan = this.$stage.$document.createElementNS(SvgElement.SVG_NAMESPACE, "tspan");

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

                            for (var key in style) {
                                if (style.hasOwnProperty(key)) {
                                    tspan.setAttribute(key, style[key]);
                                }
                            }
                            tspan.textContent = lineElement.$.text;
                            text.$el.appendChild(tspan);
                        }

                        y += line.getHeight() - line.getTextHeight();

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
                var rootRect = this.$.text.$el.getBoundingClientRect(),
                    boundingBox = this.$.text.$el.getBBox(),
                    point = svgRoot.$el.createSVGPoint();
                var factor = svgRoot.globalToLocalFactor(),
                    child;

                point.x = Math.round((mousePosition.x - rootRect.left) * factor.x) + boundingBox.x;
                point.y = Math.round((mousePosition.y - rootRect.top) * factor.y);

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