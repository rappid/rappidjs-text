define(["text/operation/FlowOperation", "text/entity/FlowElement", "underscore"], function (FlowOperation, FlowElement, _) {

    return FlowOperation.inherit('text.operation.ApplyStyleToElementOperation', {
        ctor: function (textRange, flowElement, leafStyle, paragraphStyle, containerStyle) {
            if (!(flowElement instanceof FlowElement)) {
                throw new Error("Only elements of FlowElement allowed");
            }

            this.$textRange = textRange;
            this.$leafStyle = leafStyle || null;
            this.$paragraphStyle = paragraphStyle || null;
            this.$containerStyle = containerStyle || null;

            this.callBase(flowElement);
        },

        getRelativeOffset: function (paragraph, offset) {
            var relativeStart = offset,
                prev = paragraph.getPreviousParagraph();
            while (prev) {
                relativeStart -= prev.textLength();
                prev = prev.getPreviousParagraph();
            }

            return relativeStart;
        },

        doOperation: function () {
            var element = this.$targetElement,
                absoluteStart = this.$textRange.$.absoluteStart,
                absoluteEnd = this.$textRange.$.absoluteEnd,
                endParagraph,
                startParagraph,
                firstLeaf,
                lastLeaf;

            if (this.$leafStyle) {
                firstLeaf = element.findLeaf(absoluteStart);
                lastLeaf = element.findLeaf(absoluteEnd);

                if (absoluteStart === absoluteEnd && firstLeaf.textLength() == 0) {
                    firstLeaf.applyStyle(this.$leafStyle);
                } else if (absoluteStart !== absoluteEnd) {
                    startParagraph = firstLeaf.$flowParent;
                    endParagraph = lastLeaf.$flowParent;

                    var relativeStart = this.getRelativeOffset(startParagraph, absoluteStart),
                        relativeEnd = this.getRelativeOffset(endParagraph, absoluteEnd);

                    var splittedEnd = relativeEnd == endParagraph.textLength() - 1 ? endParagraph : endParagraph.splitAtPosition(relativeEnd),
                        splittedStart = relativeStart == 0 ? startParagraph : startParagraph.splitAtPosition(relativeStart);

                    var leaf = splittedStart.getFirstLeaf(),
                        tmpLeaf;
                    while (leaf) {
                        leaf.applyStyle(this.$leafStyle);
                        tmpLeaf = leaf;
                        leaf = leaf.getNextLeaf(splittedStart);

                        if (tmpLeaf.$flowParent !== startParagraph) {
                            tmpLeaf.$flowParent.removeChild(tmpLeaf);
                            startParagraph.addChild(tmpLeaf);
                        }
                    }

                    startParagraph !== endParagraph && startParagraph.mergeElements();

                    leaf = endParagraph.getFirstLeaf();
                    tmpLeaf = null;

                    if (startParagraph !== endParagraph) {
                        while (leaf) {
                            leaf.applyStyle(this.$leafStyle);
                            leaf = leaf.getNextLeaf(endParagraph);
                        }

                        var nextParagraph = startParagraph.getNextParagraph();
                        while (nextParagraph !== endParagraph) {
                            leaf = nextParagraph.getFirstLeaf();
                            while (leaf) {
                                leaf.applyStyle(this.$leafStyle);
                                leaf = leaf.getNextLeaf(nextParagraph);
                            }
                            nextParagraph.mergeElements();
                            nextParagraph = nextParagraph.getNextParagraph();
                        }
                    }
                    if (splittedEnd !== endParagraph) {
                        splittedEnd.$.children.each(function (child) {
                            if (child.textLength()) {
                                endParagraph.addChild(child);
                            }
                        });
                    }

                    endParagraph.mergeElements();
                }

            }

            if (this.$paragraphStyle) {
                firstLeaf = element.findLeaf(absoluteStart);
                lastLeaf = element.findLeaf(absoluteEnd);

                var paragraph = firstLeaf.$flowParent;

                endParagraph = lastLeaf.$flowParent;

                if (this.$targetElement !== endParagraph && !this.$targetElement.isLeaf) {
                    var previousParagraph = endParagraph;
                    while (previousParagraph && previousParagraph !== paragraph) {
                        previousParagraph.applyStyle(this.$paragraphStyle);
                        previousParagraph = previousParagraph.getPreviousParagraph();
                    }
                    paragraph.applyStyle(this.$paragraphStyle);
                }
            }

            this.callBase();


        },

        applyLeafStyleOnParagraph: function (paragraph, style) {

        }

    });
});