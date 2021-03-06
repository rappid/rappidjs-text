define(['text/ui/SvgTextAreaBaseClass', 'js/svg/SvgElement', 'text/operation/InsertTextOperation', 'text/operation/SplitParagraphOperation', 'text/operation/ApplyStyleToElementOperation', 'text/entity/TextFlow', 'text/entity/ParagraphElement', 'text/entity/SpanElement', 'text/entity/TextRange', 'text/operation/DeleteOperation', 'underscore', "js/core/DomElement"], function (SvgTextAreaBaseClass, SvgElement, InsertTextOperation, SplitParagraphOperation, ApplyStyleToElementOperation, TextFlow, ParagraphElement, SpanElement, TextRange, DeleteOperation, _, DomElement) {

    var editBoxInstance = null;

    return SvgTextAreaBaseClass.inherit('text.ui.SvgTextAreaClass', {

        defaults: {

            selection: TextRange,

            focused: false,
            editable: true,
            selectable: true,
            showSelection: true,
            _selectedText: null
        },

        $classAttributes: ['scale', 'focused', 'showSelection', 'editable', 'selectable', 'textRange', 'text', 'selection', 'selectionGroup', 'cursor', 'textFlow', 'width', 'height'],

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

        render: function () {
            var ret = this.callBase();
            if (!editBoxInstance && !this.$stage.$browser.hasTouch) {
                editBoxInstance = this.$templates.editBox.createInstance();
                this.$stage.addChild(editBoxInstance);
                editBoxInstance.bind('on:blur', function () {
                    editBoxInstance.set('focused', false);
                });
            }

            return ret;
        },

        _renderFocused: function (focused) {
            if (focused) {
                var self = this;
                this.$blinkInterval = setInterval(function () {
                    var showCursor;
                    if (self.isFocused() && self.$.showSelection) {
                        showCursor = !self.$.cursor.$.selected;
                    } else {
                        showCursor = false;
                    }
                    self.$.cursor.set('selected', showCursor);
                }, 550);

            } else {
                if (this.$blinkInterval) {
                    clearInterval(this.$blinkInterval);
                }
                this.$.cursor.set('selected', false);
            }

        },

        _commitTextFlow: function (textFlow) {
            if (this.$.selection) {
                this.$.selection.set('textFlow', textFlow);
            }
        },

        _handleEditBoxKeyDown: function (e) {
            var domEvent = e.domEvent;

            var currentTextArea = e.target.$._currentTextArea;
            if (currentTextArea) {
                currentTextArea.handleKeyDown(domEvent);
            }

        },

        _handleEditBoxKeyPress: function (e) {
            e = e.domEvent;
            var currentTextArea = editBoxInstance.$._currentTextArea;
            if (currentTextArea && !(e.metaKey || e.ctrlKey)) {
                currentTextArea.handleKeyPress(e);
            }
        },

        handleKeyDown: function (e) {
            if (!this.$.editable || (!this.isFocused())) {
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
                e.stopPropagation();
                e.preventDefault();

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
            } else if (keyCode >= 35 && keyCode <= 40) {
                e.preventDefault();
                e.stopPropagation();
                // move cursor
                cursorIndex = this.$.selection.$.activeIndex;
                anchorIndex = this.$.selection.$.anchorIndex;

                switch (keyCode) {
                    case 35:
                        cursorIndex = this.$.textFlow.textLength() - 1;
                        break;
                    case 36:
                        cursorIndex = 0;
                        break;
                    case 37:
                        cursorIndex--;
                        break;
                    case 39:
                        cursorIndex++;
                        break;
                    case 38:
                        cursorIndex = this._getPreviousLineIndex(cursorIndex);
                        break;
                    case 40:
                        cursorIndex = this._getNextLineIndex(cursorIndex);
                        break;
                }

                if ((e.altKey || e.ctrlKey) && (keyCode == 37 || keyCode == 39)) {
                    var totalLength = this.$.textFlow.textLength(),
                        text = this.$.textFlow.text(0, totalLength, " "),
                        words = text.split(" "),
                        length = 0,
                        oldLength;
                    for (var i = 0; i < words.length; i++) {
                        oldLength = length;
                        length += (words[i].length);
                        if (cursorIndex >= oldLength && cursorIndex <= length) {
                            if (keyCode == 37) {
                                cursorIndex = oldLength;
                            } else {
                                cursorIndex = Math.min(length + 1, totalLength - 1);
                            }
                            break;
                        }
                        length++;
                    }
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

                this._afterSelectionFinished();
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
            } else if (keyCode === 65 && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                e.stopPropagation();

                this.$.selection.set({
                    anchorIndex: 0,
                    activeIndex: this.$.textFlow.textLength() - 1
                });

                this._afterSelectionFinished();
            }
        },

        handleKeyPress: function (e) {
            if (!this.$.editable) {
                return;
            }

            e.preventDefault();

            if (e.charCode) {
                e.stopPropagation();
                // insert text
                this.addChar(String.fromCharCode(e.charCode));
            }

        },

        _getNextLineIndex: function (cursorIndex) {
            var bbox = this.$.cursor.$el.getBBox(),
                point = this.getSvgRoot().$el.createSVGPoint();
            point.y = bbox.y + bbox.height * 1.5;
            point.x = bbox.x;
            var index = this._getCursorIndexForRelativePosition(point);
            if (index < 0) {
                var tSpanIndex = this.$.cursor.$.tSpanIndex,
                    i = tSpanIndex + 1,
                    j = 0,
                    tspans = this.$.text.$el.childNodes;
                index = 0;
                while (i < tspans.length && !tspans[i].getAttribute("y")) {
                    i++;
                }
                while (j < tspans.length && j <= i) {
                    index += tspans[j].textContent.length;
                    if (j > 0 && tspans[j].getAttribute("y")) {
                        index++;
                    }
                    j++;
                }
            }
            return index;
        },

        _getPreviousLineIndex: function (cursorIndex) {
            var bbox = this.$.cursor.$el.getBBox(),
                point = this.getSvgRoot().$el.createSVGPoint();
            point.y = bbox.y - bbox.height * 0.5;
            point.x = bbox.x;
            var index = this._getCursorIndexForRelativePosition(point);
            if (index < 0) {
                var tSpanIndex = this.$.cursor.$.tSpanIndex,
                    i = tSpanIndex,
                    j = 0,
                    tspans = this.$.text.$el.childNodes;
                index = 0;
                while (i >= 0 && !tspans[i].getAttribute("y")) {
                    i--;
                }
                while (j < tspans.length && j < i) {
                    index += tspans[j].textContent.length;
                    if (j > 0 && tspans[j].getAttribute("y")) {
                        index++;
                    }
                    j++;
                }
            }
            return index > -1 ? index : cursorIndex;
        },

        _renderShowSelection: function (showSelection, wasShowSelection) {
            if (!wasShowSelection) {
                this._renderSelection(this.$.selection);
            }
        },

        _renderSelection: function (selection) {
            if (!selection || !this.$.showSelection) {
                return;
            }
            var cursorPos = this._getPositionForTextIndex(selection.$.activeIndex),
                anchorPos;
            if (cursorPos) {
                this.$.cursor.set(cursorPos);
                if (selection.$.anchorIndex > -1 && selection.$.anchorIndex !== selection.$.activeIndex) {
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
                    elementX,
                    width,
                    textBox = this.$.text.$el.getBBox(),
                    textWidth = textBox.width,
                    textX = 0;

                // go through all selection rectangles
                if (this.$.selectionGroup.isRendered()) {

                    for (var i = 0; i < this.$.selectionGroup.$el.childNodes.length; i++) {
                        rect = this.$.selectionGroup.$el.childNodes[i];
                        elementX = (parseFloat(rect.getAttribute("data-x")) || 0);
                        textWidth = parseFloat(rect.getAttribute("data-max-width"));
                        height = parseFloat(rect.getAttribute("height"));
                        y = Math.round(parseFloat(rect.getAttribute("y")) + height, 2);
                        if (i >= startPos.line && i <= endPos.line) {
                            // if line is where the cursor is
                            if (i === startPos.line) {
                                x = startPos.x;
                            } else {
                                // else it's the start of the text
                                x = textX + elementX;
                            }

                            if (cursorPos !== anchorPos) {
                                // if  it is the element in the endPos line
                                if (i === endPos.line) {
                                    width = endPos.x - x;
                                } else if (i === startPos.line) {
                                    width = textWidth - (x - textX - elementX);
                                } else {
                                    width = textWidth
                                }
                            } else {
                                x = elementX;
                                width = 0;
                            }
                        } else {
                            x = elementX;
                            width = 0;
                        }
                        rect.setAttribute('x', x);
                        rect.setAttribute('width', width > 0 ? width : 0);
                    }
                }
                if (this.$.textFlow && editBoxInstance) {
                    var start = selection.$.anchorIndex > selection.$.activeIndex ? selection.$.activeIndex : selection.$.anchorIndex,
                        end = selection.$.anchorIndex <= selection.$.activeIndex ? selection.$.activeIndex : selection.$.anchorIndex;

                    var matrix = this.$el.getScreenCTM();
                    var point = this.getSvgRoot().$el.createSVGPoint();
                    point.x = anchorPos.x;
                    point.y = anchorPos.y;

                    point = point.matrixTransform(matrix);

                    editBoxInstance.$el.innerHTML = this.$.textFlow.text(start, end, "\n");
                    editBoxInstance.set('_currentTextArea', this);

                    editBoxInstance.set({
                        left: point.x,
                        top: point.y,
                        width: textBox.width,
                        height: textBox.height
                    });

                }
            }


        },

        _handlePaste: function () {
            var self = editBoxInstance.$._currentTextArea,
                range = self.$.selection;

            setTimeout(function () {
                if (self.$.textFlow) {
                    var text = editBoxInstance.$el.textContent.replace("\n", " ");
                    var operation = new InsertTextOperation(range, self.$.textFlow, text);
                    operation.doOperation();
                    self.$.selection.set({
                        activeIndex: self.$.selection.$.anchorIndex + text.length,
                        anchorIndex: self.$.selection.$.anchorIndex + text.length
                    });
                }
            }, 100);
        },

        _handleCut: function () {
            var self = editBoxInstance.$._currentTextArea,
                range = self.$.selection;
            setTimeout(function () {
                if (self.$.textFlow) {
                    var operation = new InsertTextOperation(range, self.$.textFlow, "");
                    operation.doOperation();
                    self._setCursorAfterOperation(0);
                }
            }, 100);

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
                boxedIndex = 0,
                isIndexEndOfLine = false,
                realLines = -1,
                lastBrokenElement = false;


            while (i < textEl.childNodes.length && textLength <= index) {
                child = textEl.childNodes[i];
                childLength = child.textContent.length;
                if (child.getAttribute('y')) {
                    if (!lastBrokenElement || (lastBrokenElement != child.getAttribute("data-broken"))) {
                        textLength++;
                        realLines++;
                    }
                    line++;
                }
                textLength += childLength;
                if (index >= 0 && textLength === index) {
                    isIndexEndOfLine = true;
                    break;
                }
                lastBrokenElement = child.getAttribute("data-broken");
                i++;
            }

            if (child) {
                var lineHeight = parseFloat(child.getAttribute('data-height')),
                    fontSize = parseFloat(child.getAttribute("font-size"));

                if (child.textContent === "" && child.getAttribute('y')) {
                    pos = {
                        x: child.getAttribute("x"),
                        y: parseFloat(child.getAttribute("y"))
                    };
                } else {
                    if (isIndexEndOfLine) {
                        index = index - realLines - 1;
                        boxedIndex = Math.max(Math.min(index, textEl.textContent.length - 1), 0);
                        try {
                            pos = this._convertPositionForIE(textEl.getEndPositionOfChar(boxedIndex));
                        } catch (e) {
                            return null;
                        }

                    } else {
                        index = index - realLines;
                        boxedIndex = Math.max(Math.min(index, textEl.textContent.length - 1), 0);
                        try {
                            pos = this._convertPositionForIE(textEl.getStartPositionOfChar(boxedIndex));
                        } catch (e) {
                            return null;
                        }
                        i--;
                    }
                }

                pos.y = pos.y - 2 * fontSize + lineHeight;

                if (pos) {
                    return {
                        x: pos.x,
                        y: pos.y,
                        x1: pos.x,
                        y1: pos.y,
                        x2: pos.x,
                        y2: pos.y + lineHeight,
                        height: lineHeight,
                        line: line,
                        tSpanIndex: i
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
                this._afterSelectionFinished();
            }
        },

        _renderComposedTextFlow: function () {

            if (this.$.selectionGroup) {
                var selectionGroup = this.$.selectionGroup.$el;

                while (selectionGroup && selectionGroup.firstChild) {
                    selectionGroup.removeChild(selectionGroup.firstChild);
                }

            }


            this.callBase();

            this._renderSelection(this.$.selection);
        },

        _renderComposedTextFlowHook: function(firstTSpans, selectionGroup, composedTextFlow) {
            for (var i = 0; i < firstTSpans.length; i++) {
                var firstTspan = firstTSpans[i];
                // add empty selection element
                var selectionRect = this.$stage.$document.createElementNS(SvgElement.SVG_NAMESPACE, "rect");
                selectionRect.setAttribute("data-x", firstTspan.x);
                selectionRect.setAttribute("data-max-width", firstTspan.maxWidth);
                selectionRect.setAttribute("y", firstTspan.y - firstTspan.lineHeight);
                selectionRect.setAttribute("height", firstTspan.lineHeight);
                selectionRect.setAttribute("width", 0);
                selectionRect.setAttribute("class", "text-selection");
                selectionGroup && selectionGroup.appendChild(selectionRect);
            }

            if (selectionGroup) {
                composedTextFlow.$selectionGroup = selectionGroup.cloneNode(true);
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

        _afterSelectionFinished: function () {
            this._focus();
        },

        _focus: function () {
            if (editBoxInstance) {
                editBoxInstance.set('focused', true);
                editBoxInstance.focus();
                document.execCommand('selectAll', false, null);
            }
        },

        focus: function () {
            var selection = this.$.selection;
            if (selection) {
                this._renderSelection(selection);
            }

            this._focus();
        },

        _onTextMouseDown: function (e) {

            if (!e.isTouch && this.$.focused) {
                e.preventDefault();
            }

            var index = this._getCursorIndexForMousePosition(this._getMousePositionForEvent(e)),
                anchorIndex = index,
                self = this,
                document = this.dom(this.$stage.$document);

            if (!this.$pointerMoveHandler) {
                this.$pointerMoveHandler = function (e) {
                    self._onTextMouseMove(new DomElement.PointerEvent(e));
                }
            }

            if (!this.$pointerUpHandler) {
                this.$pointerUpHandler = function (e) {

                    document.unbindDomEvent('pointermove', self.$pointerMoveHandler);
                    document.unbindDomEvent('pointerup', self.$pointerUpHandler, true);
                    self._onTextMouseUp(new DomElement.PointerEvent(e));
                }
            }


            if (index > -1) {
                var pointerEvent = e.pointerEvent;
                if (pointerEvent.shiftKey) {
                    anchorIndex = this.$.selection.$.anchorIndex;
                }


                this.$mouseDown = true;
                document.bindDomEvent('pointermove', this.$pointerMoveHandler);
                document.bindDomEvent('pointerup', this.$pointerUpHandler, true);

                this.$.selection.set({
                    activeIndex: index,
                    anchorIndex: anchorIndex
                });
            }
        },

        _onTextMouseMove: function (e) {

            if (!this.$.selectable) {
                return;
            }

            if (this.$mouseDown) {
                e.stopPropagation();
                e.preventDefault();

                var index = this._getCursorIndexForMousePosition(this._getMousePositionForEvent(e));

                if (index > -1) {
                    this.$.selection.set('activeIndex', index);
                }
            }
        },

        _onTextMouseUp: function (e) {
            if (!this.$.selectable) {
                return;
            }

            this._afterSelectionFinished();

            this.$mouseDown = false;
        },

        isFocused: function () {
            if (this.$stage.$browser.hasTouch) {
                return this.$.focused;
            }

            return this.$.focused && (editBoxInstance.$._currentTextArea === this && editBoxInstance.$.focused);
        },

        _onTextDoubleClick: function (e) {
            e.pointerEvent = e.domEvent;

            var index = this._getCursorIndexForMousePosition(this._getMousePositionForEvent(e));

            if (index > -1 && this.$.textFlow) {
                var text = this.$.textFlow.text(0, -1, "\n"),
                    lines = text.split("\n");

                var i = 0,
                    l = 0,
                    k = 0,
                    startPosition = 0,
                    lineLength = 0,
                    endPosition = 0,
                    elements;

                while (l < lines.length && lineLength <= index) {
                    startPosition = lineLength;
                    lineLength += lines[l].length + 1;
                    if (lineLength > index) {
                        i = 0;
                        k = 0;
                        elements = lines[l].split(/[ \u2002]/g);
                        endPosition = startPosition;

                        while (i < elements.length && endPosition <= index) {

                            if (elements[i].length) {
                                startPosition = endPosition + (i > 0 ? 1 : 0);
                                endPosition = startPosition + elements[i].length;
                                k++;
                            } else {
                                endPosition++;
                            }
                            i++;
                        }
                    }
                    l++;
                }

                if (endPosition >= text.length) {
                    endPosition--;
                }

                this.$.selection.set({
                    activeIndex: endPosition,
                    anchorIndex: startPosition
                });

                this._afterSelectionFinished();
            }

        },

        _getMousePositionForEvent: function (e) {
            var pointerEvent = e.pointerEvent;

            if (this.$stage.$browser.isIOS) {
                return {x: pointerEvent.pageX, y: pointerEvent.pageY};
            } else {
                return {x: pointerEvent.clientX, y: pointerEvent.clientY};
            }
        },

        _getCursorIndexForRelativePosition: function (point) {
            var target = this.$.text,
                num = target.$el.getCharNumAtPosition(point),
                child,
                startPos,
                endPos,
                y;

            var index = num;

            if (num > -1) {
                startPos = this._convertPositionForIE(target.$el.getStartPositionOfChar(num));
                endPos = this._convertPositionForIE(target.$el.getEndPositionOfChar(num));
            } else {
                var maxLength = 0,
                    lastChild;

                // find right line of position
                for (var j = 0; j < target.$el.childNodes.length; j++) {
                    child = target.$el.childNodes[j];
                    if (lastChild) {
                        maxLength += lastChild.textContent.length;
                    }
                    y = child.getAttribute("y");
                    if (y) {
                        y = parseFloat(y);
                        if (j > 0) {
                            maxLength++;
                        }
                        if (y > point.y) {
                            // child with bigger y -> last child is right line
                            break;
                        }
                    }
                    lastChild = child;
                }


                // we are in a line with empty child -> return maxLength as index
                if (child && !child.textContent) {
                    return j === 0 ? 0 : maxLength;
                }

                var textLength = target.$el.textContent.length,
                    maxY = 0;


                for (var k = 0; k < textLength; k++) {
                    endPos = target.$el.getEndPositionOfChar(k);

                    if (endPos) {
                        if (maxY && endPos.y > maxY) {
                            index = k - 1;
                            break;
                        }
                        if (endPos.y >= point.y) {
                            if (!maxY) {
                                maxY = endPos.y;
                            }
                            if (endPos.x >= point.x) {
                                startPos = target.$el.getStartPositionOfChar(k);
                                index = k;
                                break;
                            }
                        }
                    }

                }
            }
            if (startPos && endPos) {
                if (Math.abs(point.x - startPos.x) > Math.abs(point.x - endPos.x)) {
                    index++;
                }
            } else {
                return -1;
            }


            var i = 0,
                lastLineBroken = false;
            while (i < this.$.text.$el.childNodes.length) {
                child = this.$.text.$el.childNodes[i];
                y = child.getAttribute('y');

                if (y) {
                    y = Math.round(parseFloat(y), 2);
                    if (i > 0) {
                        index++;
                    }
                    if (i > 0 && lastLineBroken && lastLineBroken == child.getAttribute("data-broken")) {
                        index--;
                    }

                    if (y >= point.y || y >= Math.round(startPos.y, 2)) {
                        break;
                    }
                }
                i++;
                lastLineBroken = child.getAttribute("data-broken");
            }

            return index;

        },
        _getCursorIndexForMousePosition: function (mousePosition) {
            var target = this.$.text,
                svgRoot = target.getSvgRoot(),
                num;

            if (svgRoot) {
                var point = svgRoot.$el.createSVGPoint();

                point.x = mousePosition.x;
                point.y = mousePosition.y;

                var matrix = target.$el.getScreenCTM();

                point = point.matrixTransform(matrix.inverse());

                return this._getCursorIndexForRelativePosition(point);
            }
            return num;

        },

        _onTextAreaMove: function (e) {

            if (!this.$.selectable) {
                return;
            }

            e.stopImmediatePropagation();
            e.preventDefault();
        }

    });

});