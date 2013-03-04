define(['js/svg/SvgElement', 'text/operation/InsertTextOperation', 'text/operation/SplitParagraphOperation', 'text/operation/ApplyStyleToElementOperation', 'text/entity/TextFlow', 'text/entity/ParagraphElement', 'text/entity/SpanElement', 'text/entity/TextRange', 'text/operation/DeleteOperation', 'underscore'], function (SvgElement, InsertTextOperation, SplitParagraphOperation, ApplyStyleToElementOperation, TextFlow, ParagraphElement, SpanElement, TextRange, DeleteOperation, _) {

    return SvgElement.inherit('SvgTextArea', {

        defaults: {
            tagName: 'g',
            $internalText: "",
            selection: TextRange,
            composedTextFlow: null,
            textFlow: "{composedTextFlow.textFlow}",
            width: 100,
            height: 100,
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

        $classAttributes: ['scale', 'textRange', 'text', 'selection', 'selectionGroup', 'cursor', 'textFlow', 'width', 'height', 'anchor'],

        ctor: function () {
            this.$showCursor = true;
            this.callBase();
            this.bind('selection', 'change', this._onTextSelectionChange, this);
        },

        _onTextSelectionChange: function (e) {
            if (this.isRendered() && e.$.hasOwnProperty("activeIndex") || e.$.hasOwnProperty("anchorIndex")) {
                this._renderSelection(this.$.selection);
            }
        },

        _commitTextFlow: function (textFlow) {
            if (this.$.selection) {
                this.$.selection.set('textFlow', textFlow);
            }
        },

        handleKeyDown: function (e) {

            if (!this.$.editable) {
                return;
            }

            var keyCode = e.keyCode,
                textRange, operation, anchorIndex, cursorIndex;

            if (keyCode === 8) {
                e.preventDefault();
                e.stopPropagation();

                cursorIndex = this.$.selection.$.activeIndex;
                anchorIndex = this.$.selection.$.anchorIndex;

                if (anchorIndex === cursorIndex) {
                    anchorIndex = cursorIndex - 1;
                }
                // delete operation
                textRange = new TextRange({activeIndex: cursorIndex, anchorIndex: anchorIndex});
                operation = new DeleteOperation(textRange, this.$.textFlow);

                operation.doOperation();

                this._setCursorAfterOperation(this.$.selection.$.anchorIndex === cursorIndex ? -1 : 0);
            } else if (keyCode === 46) {
                e.preventDefault();
                e.stopPropagation();
                // delete operation
                cursorIndex = this.$.selection.$.activeIndex;
                anchorIndex = this.$.selection.$.anchorIndex;

                if (anchorIndex === cursorIndex) {
                    anchorIndex = cursorIndex + 1;
                }
                textRange = new TextRange({activeIndex: cursorIndex, anchorIndex: anchorIndex});
                operation = new DeleteOperation(textRange, this.$.textFlow);

                operation.doOperation();

                this._setCursorAfterOperation();
            } else if (keyCode === 37 || keyCode === 39 || keyCode === 38 || keyCode === 40) {
                e.preventDefault();
                e.stopPropagation();
                // move cursor
                cursorIndex = this.$.selection.$.activeIndex;
                anchorIndex = this.$.selection.$.anchorIndex;

                switch (keyCode) {
                    case 37:
                        cursorIndex--;
                        break;
                    case 39:
                        cursorIndex++;
                        break;
                }
                var indices = {
                    anchorIndex: anchorIndex,
                    activeIndex: cursorIndex
                };
                if (e.shiftKey && anchorIndex === -1) {
                    indices.anchorIndex = cursorIndex;
                } else if (!e.shiftKey && anchorIndex !== -1) {
                    indices.anchorIndex = cursorIndex;
                }
                this.$.selection.set(indices);
            } else if (keyCode === 13) {
                e.preventDefault();
                e.stopPropagation();
                // line break
                cursorIndex = this.$.selection.$.activeIndex;
                anchorIndex = this.$.selection.$.anchorIndex;

                if (cursorIndex !== anchorIndex) {
                    textRange = new TextRange({activeIndex: cursorIndex, anchorIndex: anchorIndex});
                    operation = new DeleteOperation(textRange, this.$.textFlow);
                    operation.doOperation();
                    this._setCursorAfterOperation();
                }

                textRange = new TextRange({activeIndex: cursorIndex});
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

        _renderSelection: function (selection) {
            if (!selection) {
                return;
            }
            var cursorPos = this._getPositionForTextIndex(selection.$.activeIndex),
                anchorPos;
            if (cursorPos) {
                this.$.cursor.set(cursorPos);
                if (selection.$.anchorIndex > -1 && selection.$.anchorIndex !== selection.$.index) {
                    anchorPos = this._getPositionForTextIndex(selection.$.anchorIndex);
                } else {
                    anchorPos = cursorPos;
                }
            }

            if (cursorPos && anchorPos) {
                var startPos = selection.$.anchorIndex === -1 || selection.$.activeIndex < selection.$.anchorIndex ? cursorPos : anchorPos,
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
                for (var i = 0; i < this.$.selectionGroup.$el.childNodes.length; i++) {
                    rect = this.$.selectionGroup.$el.childNodes[i];
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
                    rect.setAttribute('width', width > 0 ? width : 0);
                }
            }

        },

        _getPositionForTextIndex: function (index) {
            var textEl = this.$.text.$el;

            if (!this.$addedToDom || !textEl.childNodes.length) {
                return null;
            }

            var textLength = -1,
                child,
                i = 0,
                pos,
                childLength,
                line = -1,
                isIndexEndOfLine = false;

            while (i < textEl.childNodes.length && textLength <= index) {
                child = textEl.childNodes[i];
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

            if (child) {
                if (child.textContent === "" && child.getAttribute('y')) {
                    pos = {
                        x: child.getAttribute("x"),
                        y: parseFloat(child.getAttribute("y"))
                    };
                } else {
                    if (isIndexEndOfLine) {
                        i = index - line - 1;
                        pos = textEl.getEndPositionOfChar(i >= textEl.textContent.length ? textEl.textContent.length - 1 : i);
                    } else {
                        i = index - line;
                        pos = textEl.getStartPositionOfChar(i >= textEl.textContent.length ? textEl.textContent.length - 1 : i);
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
            } else {
                return null;
            }

        },

        addChar: function (chr) {
            if (this.$.textFlow) {
                var operation = new InsertTextOperation(this.$.selection, this.$.textFlow, chr);
                operation.doOperation();
                this._setCursorAfterOperation(1);
            }
        },

        _setCursorAfterOperation: function (add) {
            add = add || 0;

            var cursorIndex = this.$.selection.$.activeIndex <= this.$.selection.$.anchorIndex ? this.$.selection.$.activeIndex : this.$.selection.$.anchorIndex;
            this.$.selection.set({
                activeIndex: cursorIndex + add,
                anchorIndex: cursorIndex + add
            }, {force: true});
        },

        _onDomAdded: function () {
            this.callBase();
            if (this.$.selection) {
                this._renderSelection(this.$.selection);
            }
            var self = this;

            if (this.$.selectable) {
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
            var $selectionGroup = this.$.selectionGroup.$el;
            while ($selectionGroup.firstChild) {
                $selectionGroup.removeChild($selectionGroup.firstChild);
            }

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
                            tspan.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve");
                            tspan.textContent = lineElement.$.text;
                            text.$el.appendChild(tspan);
                        }

                        // add empty selection element
                        var selectionRect = this.$stage.$document.createElementNS(SvgElement.SVG_NAMESPACE, "rect");
                        selectionRect.setAttribute("style", "fill: #a8cbf9;");
                        selectionRect.setAttribute("y", y - maxFontSize);
                        selectionRect.setAttribute("height", lineHeight);
                        selectionRect.setAttribute("width", 0);
                        selectionRect.setAttribute("class", "text-selection");

                        $selectionGroup.appendChild(selectionRect);

                        y += lineHeight - textHeight;

                    }
                }
            }

            text.set("visible", true);

            this._renderSelection(this.$.selection);
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

            var target = e.target;

            var index = this._getCursorIndexForMousePosition(this._getMousePositionForEvent(e), target);
            if (index > -1) {
                this.$.selection.set({
                    'activeIndex': index
                });
            }
            this.$mouseDown = false;
        },

        _onTextMouseDown: function (e) {

            if (!this.$.selectable) {
                return;
            }

            var target = e.target;

//            e.stopPropagation();

            var index = this._getCursorIndexForMousePosition(this._getMousePositionForEvent(e), target);
            if (index > -1) {
                this.$mouseDown = true;
                this.$.selection.set({
                    activeIndex: index,
                    anchorIndex: index
                });
            }
        },

        _onTextMouseMove: function (e) {

            if (!this.$.selectable) {
                return;
            }

            if (this.$mouseDown) {
//                e.stopPropagation();
//                e.preventDefault();
                var domEvent = e.pointerEvent,
                    target = e.target;
                var index = this._getCursorIndexForMousePosition(this._getMousePositionForEvent(e), target);
                if (index > -1) {
                    this.$.selection.set('activeIndex', index);
                }
            }
        },

        _getMousePositionForEvent: function (e) {
            var pointerEvent = e.pointerEvent;
            if (e.isTouch) {
                return {x: pointerEvent.pageX, y: pointerEvent.pageY};
            } else {
                return {x: pointerEvent.clientX, y: pointerEvent.clientY};
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

                        if (y) {
                            if (i > 0) {
                                index++;
                            }
                            if (Math.round(parseFloat(y), 2) >= startPos.y) {
                                break;
                            }
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