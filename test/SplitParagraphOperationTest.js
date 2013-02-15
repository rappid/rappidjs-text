var expect = require('chai').expect,
    _ = require('underscore'),
    testRunner = require('rAppid.js').TestRunner.setup();

var C = {};


describe('text.operation.SplitParagraphOperation', function () {


    before(function (done) {
        testRunner.requireClasses({
            TextFlow: 'text/entity/TextFlow',
            Span: 'text/entity/SpanElement',
            Paragraph: 'text/entity/ParagraphElement',
            TextRange: 'text/entity/TextRange',
            SplitParagraphOperation: 'text/operation/SplitParagraphOperation',
            Style: 'text/type/Style'
        }, C, done);

    });

    describe('#doOperation()', function () {

        it('should split up text and create new paragraph', function () {
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                span1 = new C.Span({text: "This is one line of text."}),
                textRange;

            paragraph.addChild(span1);
            textFlow.addChild(paragraph);

            textRange = new C.TextRange({
                textFlow: textFlow,
                activeIndex: 8
            });

            var operation = new C.SplitParagraphOperation(textRange);
            operation.doOperation();

            expect(textFlow.numChildren()).to.be.equal(2);
            expect(textFlow.getChildAt(0).text()).to.be.equal("This is ");
            expect(textFlow.getChildAt(1).text()).to.be.equal("one line of text.");
        });

        it('should split up between two spans', function () {
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                span1 = new C.Span({text: "A B C"}),
                span2 = new C.Span({text: "D E F G"}),
                textRange;

            paragraph.addChild(span1);
            paragraph.addChild(span2);
            textFlow.addChild(paragraph);

            textRange = new C.TextRange({
                textFlow: textFlow,
                activeIndex: 5
            });

            var operation = new C.SplitParagraphOperation(textRange);
            operation.doOperation();

            expect(textFlow.numChildren()).to.be.equal(2);
        });

        it('should split up over more than one paragraph', function () {
            var textFlow = new C.TextFlow(),
                paragraph1 = new C.Paragraph(),
                paragraph2 = new C.Paragraph(),
                paragraph3 = new C.Paragraph(),
                span1 = new C.Span({text: "text in paragraph 1"}),
                span2 = new C.Span({text: "text in paragraph 2"}),
                span3 = new C.Span({text: "text in paragraph 3"}),
                textRange;

            paragraph1.addChild(span1);
            paragraph2.addChild(span2);
            paragraph3.addChild(span3);
            textFlow.addChild(paragraph1);
            textFlow.addChild(paragraph2);
            textFlow.addChild(paragraph3);

            textRange = new C.TextRange({
                textFlow: textFlow,
                activeIndex: 26
            });

            var operation = new C.SplitParagraphOperation(textRange);
            operation.doOperation();

            expect(textFlow.numChildren()).to.be.equal(4);
        });

        it('should split at end of paragraph', function () {
            var textFlow = new C.TextFlow(),
                paragraph1 = new C.Paragraph(),
                span1 = new C.Span({text: "ABC"}),
                textRange;

            paragraph1.addChild(span1);
            textFlow.addChild(paragraph1);

            textRange = new C.TextRange({
                activeIndex: 3
            });

            var operation = new C.SplitParagraphOperation(textRange, textFlow);
            operation.doOperation();

            expect(textFlow.numChildren()).to.be.equal(2);
        });

        it('should preserve style of splitted span element', function(){
            var textFlow = new C.TextFlow(),
                paragraph1 = new C.Paragraph(),
                span1 = new C.Span({text: "ABC", style: new C.Style({fontWeight: "bold"})}),
                textRange;

            paragraph1.addChild(span1);
            textFlow.addChild(paragraph1);

            textRange = new C.TextRange({
                activeIndex: 2
            });

            var operation = new C.SplitParagraphOperation(textRange, textFlow);
            operation.doOperation();

            expect(textFlow.getChildAt(1).getChildAt(0).composeStyle()).to.be.eql({fontWeight: "bold"});

        });

    });

});