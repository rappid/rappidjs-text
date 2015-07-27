define(['text/entity/FlowGroupElement', 'js/core/List', 'text/entity/SpanElement'], function (FlowGroupElement, List, SpanElement) {

    var undefined;

    var Paragraph = FlowGroupElement.inherit('text.entity.ParagraphElement', {
        getNextParagraph: function () {
            var parent = this.$parent;
            while (parent.$parent) {
                parent = parent.$parent;
            }

            var list = this._getParagraphsOfElement(parent);
            var index = list.indexOf(this);
            if (index < list.size() - 1) {
                return list.at(index + 1);
            }

            return null;
        },

        getPreviousParagraph: function () {
            var parent = this.$parent;
            while (parent.$parent) {
                parent = parent.$parent;
            }

            var list = this._getParagraphsOfElement(parent);
            var index = list.indexOf(this);
            if (index > 0) {
                return list.at(index - 1);
            }

            return null;
        },

        _getParagraphsOfElement: function (element) {
            var ret = [],
                self = this;
            element.$.children.each(function (child) {
                if (child instanceof Paragraph) {
                    ret.push(child);
                } else {
                    ret = ret.concat(self._getParagraphsOfElement(element));
                }
            });

            return new List(ret);

        },

        addChild: function (child, options) {
            if (!child.isLeaf) {
                // TODO: allow LinkElements etc..
                throw new Error("Only FlowLeafElements can be added to paragraph");
            }

            this.callBase(child, options);
        },

        textLength: function () {
            return this.callBase() + 1;
        },

        findChildIndexAtPosition: function (textPosition) {
            var textLength = 0, childLength, ret = -1;
            this.$.children.find(function (child, index) {
                textPosition -= child.textLength();
                if (textPosition <= 0) {
                    ret = index;
                    return true;
                }
                return false;
            });

            if (textPosition > 0) {
                return this.$.children.size() - 1;
            }

            return ret;
        },
        mergeElements: function () {
            var length = this.$.children.size(),
                child = null, previousChild = null;
            for (var i = length - 1; i >= 0; i--) {
                child = this.$.children.at(i);
                if (previousChild) {
                    if (previousChild.textLength() === 0) {
                        this.removeChild(previousChild);
                    } else if (previousChild.hasSameStyle(child)) {
                        child.set('text', child.$.text + previousChild.$.text);
                        this.removeChild(previousChild);
                    }
                }
                previousChild = child;
            }
        },
        shallowCopy: function (relativeStart, relativeEnd) {
            var textLength = this.textLength();
            if (relativeStart >= textLength) {
                relativeStart = textLength - 1;
            }

            var copy = this.callBase(relativeStart, relativeEnd),
                firstLeaf = copy.getFirstLeaf();

            if (copy.$.children.size() > 1 && firstLeaf.textLength() === 0) {
                copy.removeChild(firstLeaf);
            }

            return copy;
        },
        text: function (relativeStart, relativeEnd, paragraphSeparator) {
            if (paragraphSeparator === undefined) {
                paragraphSeparator = "";
            }
            return this.callBase(relativeStart, relativeEnd, paragraphSeparator) + paragraphSeparator;
        }

    }, {

        initializeFromText: function (text) {
            text = text || "";
            var paragraph = new Paragraph();

            paragraph.addChild(new SpanElement({
                text: text
            }));

            return paragraph;
        }

    });

    return Paragraph;


});