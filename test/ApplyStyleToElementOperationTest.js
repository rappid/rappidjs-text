var expect = require('chai').expect,
    _ = require('underscore'),
    testRunner = require('rAppid.js').TestRunner.setup();

var C = {};


describe('text.operation.ApplyStyleToElementOperation', function () {


    before(function (done) {
        testRunner.requireClasses({
            TextFlow: 'text/entity/TextFlow',
            Span: 'text/entity/SpanElement',
            Paragraph: 'text/entity/ParagraphElement',
            TextRange: 'text/entity/TextRange',
            Style: 'text/type/Style',
            ApplyStyleToElementOperation: 'text/operation/ApplyStyleToElementOperation'
        }, C, done);

    });

    describe('#doOperation()', function () {

        it('should apply style to one span and dont split up', function () {
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                span1 = new C.Span({text: "This is bold text."}),
                textRange;

            paragraph.addChild(span1);
            textFlow.addChild(paragraph);

            textRange = new C.TextRange({
                anchorIndex: 5,
                activeIndex: 12
            });

            var operation = new C.ApplyStyleToElementOperation(textRange, textFlow, new C.Style({fontWeight: "bold"}));
            operation.doOperation();

            expect(textFlow.getChildAt(0).numChildren()).to.be.equal(3);
        });

        it('should apply style over whole paragraph, dont split up and apply style to paragraph', function () {
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                span1 = new C.Span({text: "ABC"}),
                textRange;

            paragraph.addChild(span1);
            textFlow.addChild(paragraph);

            textRange = new C.TextRange({
                anchorIndex: 0,
                activeIndex: 3
            });

            var operation = new C.ApplyStyleToElementOperation(textRange, textFlow, new C.Style({fontWeight: "bold"}));
            operation.doOperation();

            expect(paragraph.numChildren()).to.be.equal(1);
            expect(paragraph.getChildAt(0).composeStyle()).to.be.eql({fontWeight: "bold"});
            expect(paragraph.composeStyle()).to.be.eql(null);
        });

        it('should split up text and create new paragraph', function () {
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                span1 = new C.Span({text: "ABC"}),
                span2 = new C.Span({text: "DEF"}),
                span3 = new C.Span({text: "GHI"}),
                textRange;

            paragraph.addChild(span1);
            paragraph.addChild(span2);
            paragraph.addChild(span3);

            textFlow.addChild(paragraph);

            textRange = new C.TextRange({
                anchorIndex: 2,
                activeIndex: 8
            });

            var operation = new C.ApplyStyleToElementOperation(textRange, textFlow, new C.Style({fontWeight: "bold"}));
            operation.doOperation();

            expect(paragraph.getChildAt(1).text()).to.be.equal("CDEFGH");
            expect(paragraph.getChildAt(1).composeStyle()).to.be.eql({fontWeight: "bold"});
        });

        it('should apply style in specific paragraph', function () {
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                paragraph2 = new C.Paragraph(),
                span1 = new C.Span({text: "ABC"}),
                span2 = new C.Span({text: "DEFG", style: new C.Style({fontWeight: "normal"})}),
                textRange;

            paragraph.addChild(span1);
            paragraph2.addChild(span2);

            textFlow.addChild(paragraph);
            textFlow.addChild(paragraph2);

            textRange = new C.TextRange({
                anchorIndex: 5,
                activeIndex: 6
            });

            var operation = new C.ApplyStyleToElementOperation(textRange, textFlow, new C.Style({fontWeight: "bold"}));
            operation.doOperation();

            expect(paragraph2.numChildren()).to.be.equal(3);
            expect(paragraph2.getChildAt(0).composeStyle()).to.be.eql({fontWeight: "normal"});
            expect(paragraph2.getChildAt(1).composeStyle()).to.be.eql({fontWeight: "bold"});
            expect(paragraph2.text()).to.be.equal("DEFG");
        });

        it('should apply leaf style on leafs over all paragraphs in range', function () {
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                paragraph2 = new C.Paragraph(),
                span1 = new C.Span({text: "ABC"}),
                span2 = new C.Span({text: "DEF"}),
                textRange;

            paragraph.addChild(span1);
            paragraph2.addChild(span2);

            textFlow.addChild(paragraph);
            textFlow.addChild(paragraph2);

            textRange = new C.TextRange({
                anchorIndex: 2,
                activeIndex: 5
            });

            var operation = new C.ApplyStyleToElementOperation(textRange, textFlow, new C.Style({fontStyle: "italic"}));
            operation.doOperation();

            expect(paragraph.numChildren()).to.be.equal(2);
            expect(paragraph.getChildAt(0).composeStyle()).to.be.eql(null);
            expect(paragraph.getChildAt(0).text()).to.be.equal("AB");
            expect(paragraph.getChildAt(1).composeStyle()).to.be.eql({fontStyle: "italic"});
            expect(paragraph.getChildAt(1).text()).to.be.equal("C");


            paragraph2 = textFlow.getChildAt(1);
            expect(paragraph2.numChildren()).to.be.equal(2);
            expect(paragraph2.getChildAt(0).composeStyle()).to.be.eql({fontStyle: "italic"});
            expect(paragraph2.getChildAt(1).composeStyle()).to.be.eql(null);
        });

        it('should apply style on last element without creating new element', function () {
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                span1 = new C.Span({text: "ABC"}),
                span2 = new C.Span({text: "DEF"}),
                textRange;

            paragraph.addChild(span1);
            paragraph.addChild(span2);

            textFlow.addChild(paragraph);

            textRange = new C.TextRange({
                anchorIndex: 4,
                activeIndex: 6
            });

            var operation = new C.ApplyStyleToElementOperation(textRange, textFlow, new C.Style({fontStyle: "italic"}));
            operation.doOperation();

            expect(paragraph.numChildren()).to.be.equal(2);
            expect(paragraph.getChildAt(0).composeStyle()).to.be.eql(null);
            expect(paragraph.getChildAt(1).composeStyle()).to.be.eql({fontStyle: "italic"});
            expect(paragraph.text()).to.be.equal("ABCDEF");
        });

        it('should apply correct original style', function () {
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                span1 = new C.Span({text: "ABC"}),
                span2 = new C.Span({text: "DEF", style: new C.Style({fontStyle: 'italic'})}),
                span3 = new C.Span({text: "GHI"}),
                textRange;

            paragraph.addChild(span1);
            paragraph.addChild(span2);
            paragraph.addChild(span3);

            textFlow.addChild(paragraph);

            textRange = new C.TextRange({
                anchorIndex: 6,
                activeIndex: 8
            });

            var operation = new C.ApplyStyleToElementOperation(textRange, textFlow, new C.Style({fontWeight: "bold"}));
            operation.doOperation();

            expect(paragraph.numChildren()).to.be.equal(4);
            expect(paragraph.getChildAt(1).composeStyle()).to.be.eql({fontStyle: "italic"});
            expect(paragraph.getChildAt(2).composeStyle()).to.be.eql({fontWeight: "bold"});
            expect(paragraph.getChildAt(3).composeStyle()).to.be.eql(null);

        });

        it('should apply paragraph style only in one paragraph when range is 0', function () {
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                paragraph2 = new C.Paragraph(),
                span1 = new C.Span({text: "ABC"}),
                span2 = new C.Span({text: "DEF"}),
                textRange;

            paragraph.addChild(span1);
            paragraph2.addChild(span2);

            textFlow.addChild(paragraph);
            textFlow.addChild(paragraph2);

            textRange = new C.TextRange({
                anchorIndex: 5,
                activeIndex: 5
            });

            var operation = new C.ApplyStyleToElementOperation(textRange, textFlow, null, new C.Style({textAlign: "left"}));
            operation.doOperation();

            expect(paragraph.composeStyle()).to.be.eql(null);
            expect(paragraph2.composeStyle()).to.be.eql({textAlign: "left"});
        });

        it('should apply paragraph style on all paragraphs that are in range', function () {
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                paragraph2 = new C.Paragraph(),
                paragraph3 = new C.Paragraph(),
                span1 = new C.Span({text: "ABC"}),
                span2 = new C.Span({text: "DEF"}),
                span3 = new C.Span({text: "GHI"}),
                textRange;

            paragraph.addChild(span1);
            paragraph2.addChild(span2);
            paragraph3.addChild(span3);

            textFlow.addChild(paragraph);
            textFlow.addChild(paragraph2);
            textFlow.addChild(paragraph3);

            textRange = new C.TextRange({
                anchorIndex: 2,
                activeIndex: 10
            });

            var operation = new C.ApplyStyleToElementOperation(textRange, textFlow, null, new C.Style({textAlign: "left"}));
            operation.doOperation();

            expect(paragraph.composeStyle()).to.be.eql({textAlign: "left"});
            expect(paragraph2.composeStyle()).to.be.eql({textAlign: "left"});
            expect(paragraph3.composeStyle()).to.be.eql({textAlign: "left"});
        });

        it('should apply paragraph style on all paragraphs that are in range', function () {
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                span = new C.Span({text: "Simple test."});

            paragraph.addChild(span);
            textFlow.addChild(paragraph);

            (new C.ApplyStyleToElementOperation(C.TextRange.createTextRange(0, 1), textFlow, {
                fontSize: 10
            })).doOperation();

            (new C.ApplyStyleToElementOperation(C.TextRange.createTextRange(1, 2), textFlow, {
                fontSize: 11
            })).doOperation();

            (new C.ApplyStyleToElementOperation(C.TextRange.createTextRange(2, 3), textFlow, {
                fontSize: 12
            })).doOperation();

            expect(paragraph.numChildren()).to.eql(4);

        });


        it('should apply leaf style on whole text flow and merge same elements', function () {
            var textFlow = C.TextFlow.initializeFromText("Dude\n\nDude");
            (new C.ApplyStyleToElementOperation(C.TextRange.createTextRange(0, textFlow.textLength()), textFlow, {
                color: '#00FF00'
            }, null)).doOperation();

            (new C.ApplyStyleToElementOperation(C.TextRange.createTextRange(0, 2), textFlow, {
                color: '#FFFF00'
            })).doOperation();

            (new C.ApplyStyleToElementOperation(C.TextRange.createTextRange(2, 4), textFlow, {
                color: '#FF0000'
            })).doOperation();

            expect(textFlow.getChildAt(0).numChildren()).to.eql(2);

            (new C.ApplyStyleToElementOperation(C.TextRange.createTextRange(0, textFlow.textLength()), textFlow, {
                color: '#000000'
            })).doOperation();

            expect(textFlow.getChildAt(0).numChildren()).to.eql(1);
        });

        it('should not add empty leaf element', function () {
            var textFlow = C.TextFlow.initializeFromText("Dude\nDude");
            var operation = new C.ApplyStyleToElementOperation(C.TextRange.createTextRange(5, textFlow.textLength()), textFlow, {
                color: '#00FF00'
            }, null);
            operation.doOperation();

            expect(textFlow.getChildAt(1).getFirstLeaf().text()).to.eql("Dude");

            operation = new C.ApplyStyleToElementOperation(C.TextRange.createTextRange(5, 5), textFlow, {
                color: '#00FF00'
            }, null);
            operation.doOperation();

            expect(textFlow.getChildAt(1).getFirstLeaf().text()).to.eql("Dude");
        });

        it('should set style on empty leaf', function () {
            var textFlow = C.TextFlow.initializeFromText("");
            var operation = new C.ApplyStyleToElementOperation(C.TextRange.createTextRange(0, 0), textFlow, {
                color: '#00FF00'
            }, null);
            operation.doOperation();

            expect(textFlow.getFirstLeaf().composeStyle()).to.eql({color: '#00FF00'});

            textFlow = C.TextFlow.initializeFromText("Dude");
            operation = new C.ApplyStyleToElementOperation(C.TextRange.createTextRange(0, 0), textFlow, {
                color: '#00FF00'
            }, null);
            operation.doOperation();

            expect(textFlow.getFirstLeaf().composeStyle()).to.eql(null);
        });

        it('should keep paragraphs when applying leaf style', function () {
            var textFlow = C.TextFlow.initializeFromText("Dude\n\nDude");
            (new C.ApplyStyleToElementOperation(C.TextRange.createTextRange(0, textFlow.textLength()), textFlow, {
                color: '#00FF00'
            }, null)).doOperation();

            (new C.ApplyStyleToElementOperation(C.TextRange.createTextRange(0, 2), textFlow, {
                color: '#FFFF00'
            })).doOperation();

            (new C.ApplyStyleToElementOperation(C.TextRange.createTextRange(2, 4), textFlow, {
                color: '#FF0000'
            })).doOperation();

            var lastParagraph = textFlow.getChildAt(2);

            expect(textFlow.getChildAt(0).numChildren()).to.eql(2);

            (new C.ApplyStyleToElementOperation(C.TextRange.createTextRange(0, 4), textFlow, {
                color: '#000000'
            })).doOperation();

            expect(textFlow.getChildAt(2)).to.be.eql(lastParagraph);
        });


        it('create new text flow and apply style on complete text flow should result in one paragraph with one span', function () {
            var textFlow = new C.TextFlow.initializeFromText("rAppid:js is awesome.\nWhat do you think?");

            (new C.ApplyStyleToElementOperation(C.TextRange.createTextRange(0, textFlow.textLength()), textFlow, new C.Style({
                fontSize: 10
            }))).doOperation();

            expect(textFlow.numChildren()).to.eql(2);
            expect(textFlow.getChildAt(0).numChildren()).to.eql(1);
            expect(textFlow.getChildAt(1).numChildren()).to.eql(1);

        });

    });

});