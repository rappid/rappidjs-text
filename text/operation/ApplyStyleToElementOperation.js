define(["text/operation/FlowOperation", "text/entity/FlowElement", "underscore"], function (FlowOperation, FlowElement, _) {

    return FlowOperation.inherit('text.operation.ApplyStyleToElementOperation', {
        ctor: function (textRange, flowElement, leafStyle, paragraphStyle, containerStyle) {
            if (!(flowElement instanceof FlowElement)) {
                throw new Error("Only elements of FlowElement allowed");
            }

            this.$targetElement = flowElement;
            this.$textRange = textRange;
            this.$leafStyle = leafStyle || null;
            this.$paragraphStyle = paragraphStyle || null;
            this.$containerStyle = containerStyle || null;
        },

        doOperation: function () {
            var element = this.$targetElement,
                absoluteStart = this.$textRange.$.absoluteStart,
                absoluteEnd = this.$textRange.$.absoluteEnd,
                firstLeaf,
                lastLeaf;

            if (this.$leafStyle) {
                if (absoluteStart !== absoluteEnd) {
                    var parent,
                        endParent,
                        currentLeaf,
                        nextLeaf,
                        lastElement = element.splitAtPosition(absoluteEnd),
                        styleElement;

                    if (absoluteStart > 0) {
                        styleElement = element.splitAtPosition(absoluteStart);
                    } else {
                        styleElement = element;
                    }
                    firstLeaf = styleElement.getFirstLeaf();
                    var leaf = firstLeaf;
                    while (leaf) {
                        leaf.applyStyle(this.$leafStyle);
                        leaf = leaf.getNextLeaf(styleElement);
                    }

                    lastLeaf = element.getLastLeaf();

                    if (styleElement !== element) {
                        styleElement.$.children.each(function (child) {
                            if (!child.isLeaf) {
                                element.addChild(child);
                            }
                        });

                        if (lastLeaf && firstLeaf) {
                            parent = lastLeaf.$parent;
                            endParent = firstLeaf.$parent;

                            currentLeaf = firstLeaf;

                            while (currentLeaf) {
                                nextLeaf = currentLeaf.getNextLeaf(endParent);
                                currentLeaf.$parent.removeChild(currentLeaf);
                                if (currentLeaf.textLength() > 0) {
                                    parent.addChild(currentLeaf);
                                }
                                currentLeaf = nextLeaf;
                            }

                            endParent.$parent && endParent.$parent.removeChild(endParent);
                        }
                    }


                    firstLeaf = lastElement.getFirstLeaf();
                    lastLeaf = element.getLastLeaf();

                    lastElement.$.children.each(function (child) {
                        if (!child.isLeaf) {
                            element.addChild(child);
                        }
                    });

                    if (lastLeaf && firstLeaf) {
                        parent = lastLeaf.$parent;
                        endParent = firstLeaf.$parent;

                        currentLeaf = firstLeaf;

                        while (currentLeaf) {
                            nextLeaf = currentLeaf.getNextLeaf(endParent);
                            currentLeaf.$parent.removeChild(currentLeaf);
                            if (currentLeaf.textLength() > 0) {
                                parent.addChild(currentLeaf);
                            }
                            currentLeaf = nextLeaf;
                        }

                        endParent.$parent && endParent.$parent.removeChild(endParent);
                    }

                    parent.mergeElements();

                }
            }

            if (this.$paragraphStyle) {
                firstLeaf = element.findLeaf(absoluteStart);
                lastLeaf = element.findLeaf(absoluteEnd);

                var paragraph = firstLeaf.$parent,
                    endParagraph = lastLeaf.$parent,
                    reachedFirstParagraph = paragraph === endParagraph;

                if (this.$targetElement !== endParagraph && !this.$targetElement.isLeaf) {
                    var previousParagraph = endParagraph.getPreviousParagraph();
                    while (previousParagraph) {
                        if (previousParagraph === paragraph) {
                            reachedFirstParagraph = true;
                        }

                        if (!reachedFirstParagraph) {
                            if (this.$paragraphStyle) {
                                previousParagraph.applyStyle(this.$paragraphStyle);
                            }
                        }

                        previousParagraph = previousParagraph.getPreviousParagraph();
                    }
                }

                endParagraph.applyStyle(this.$paragraphStyle);
                paragraph.applyStyle(this.$paragraphStyle);

            }

            this.callBase();


        }

    });
});