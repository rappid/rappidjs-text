var expect = require('chai').expect,
    _ = require('underscore'),
    testRunner = require('rAppid.js').TestRunner.setup();

var C = {};


describe('text.operation.InsertTextOperation', function () {


    before(function (done) {
        testRunner.requireClasses({
            TextFlow: 'text/entity/TextFlow',
            Span: 'text/entity/SpanElement',
            Paragraph: 'text/entity/ParagraphElement',
            TextRange: 'text/entity/TextRange',
            InsertTextOperation: 'text/operation/InsertTextOperation'
        }, C, done);

    });

    describe('#doOperation()', function () {

        it('should insert text on position of element', function () {
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                span1 = new C.Span({text: "This is text."}),
                textRange;

            paragraph.addChild(span1);
            textFlow.addChild(paragraph);

            textRange = new C.TextRange({
                textFlow: textFlow,
                anchorIndex: 7,
                activeIndex: 7
            });

            var operation = new C.InsertTextOperation(textRange, textFlow, " bold");
            operation.doOperation();

            expect(textFlow.text()).to.be.equal("This is bold text. ");
        });

        it('should insert text at the end of element', function () {
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                span1 = new C.Span({text: "ABC"}),
                textRange;

            paragraph.addChild(span1);
            textFlow.addChild(paragraph);

            textRange = new C.TextRange({
                textFlow: textFlow,
                activeIndex: 3,
                anchorIndex: 3
            });

            var operation = new C.InsertTextOperation(textRange, textFlow, "DE");
            operation.doOperation();

            expect(textFlow.text()).to.be.equal("ABCDE ");
        });

        it('should insert at first position of second paragraph', function () {
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                paragraph2 = new C.Paragraph(),
                span1 = new C.Span({text: "ABC"}),
                textRange;

            paragraph.addChild(span1);
            paragraph2.addChild(new C.Span());
            textFlow.addChild(paragraph);
            textFlow.addChild(paragraph2);

            textRange = new C.TextRange({
                textFlow: textFlow,
                activeIndex: 4,
                anchorIndex: 4
            });

            var operation = new C.InsertTextOperation(textRange, textFlow, "DE");
            operation.doOperation();

            expect(textFlow.text()).to.be.equal("ABC DE ");
        });

        it('should insert text over range', function () {
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                span1 = new C.Span({text: "This is a"}),
                span2 = new C.Span({text: "awesome "}),
                span3 = new C.Span({text: "splitted Text"}),
                textRange;

            paragraph.addChild(span1);
            paragraph.addChild(span2);
            paragraph.addChild(span3);
            textFlow.addChild(paragraph);

            textRange = new C.TextRange({
                textFlow: textFlow,
                anchorIndex: 4,
                activeIndex: 25
            });

            var operation = new C.InsertTextOperation(textRange, textFlow, " is a new");
            operation.doOperation();

            expect(textFlow.text()).to.be.equal("This is a new Text ");
            expect(textFlow.getChildAt(0).numChildren()).to.be.equal(2);
        });

        it('should delete text', function(){
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                span1 = new C.Span({text: "This is a"}),
                span2 = new C.Span({text: "awesome "}),
                span3 = new C.Span({text: "splitted Text"}),
                textRange;

            paragraph.addChild(span1);
            paragraph.addChild(span2);
            paragraph.addChild(span3);
            textFlow.addChild(paragraph);

            textRange = new C.TextRange({
                textFlow: textFlow,
                anchorIndex: 4,
                activeIndex: 25
            });

            var operation = new C.InsertTextOperation(textRange, textFlow, "");
            operation.doOperation();

            expect(textFlow.text()).to.be.equal("This Text ");
            expect(textFlow.getChildAt(0).numChildren()).to.be.equal(2);


        });
    });

});