var expect = require('chai').expect,
    _ = require('underscore'),
    testRunner = require('rAppid').TestRunner.setup();

var C = {};


describe('text.operation.ApplyFormatToElementOperation', function () {


    before(function (done) {
        testRunner.requireClasses({
            TextFlow: 'text/entity/TextFlow',
            Span: 'text/entity/SpanElement',
            Paragraph: 'text/entity/ParagraphElement',
            TextRange: 'text/entity/TextRange',
            Style: 'text/type/Style',
            ApplyFormatToElementOperation: 'text/operation/ApplyFormatToElementOperation'
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

            var operation = new C.ApplyFormatToElementOperation(textRange, textFlow, new C.Style({fontWeight: "bold"}));
            operation.doOperation();

            expect(textFlow.getChildAt(0).numChildren()).to.be.equal(3);
        });

        it('should apply style to over whole paragraph, dont split up and apply style to paragraph', function () {
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

            var operation = new C.ApplyFormatToElementOperation(textRange, textFlow, new C.Style({fontWeight: "bold"}));
            operation.doOperation();

            expect(paragraph.numChildren()).to.be.equal(1);
            expect(paragraph.getChildAt(0).getComputedStyle()).to.be.eql({fontWeight: "bold"});
            expect(paragraph.getComputedStyle()).to.be.eql({fontWeight: "bold"});
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

            var operation = new C.ApplyFormatToElementOperation(textRange, textFlow, new C.Style({fontWeight: "bold"}));
            operation.doOperation();

            expect(paragraph.getChildAt(1).text()).to.be.equal("CDEFGH");
            expect(paragraph.getChildAt(1).getComputedStyle()).to.be.eql({fontWeight: "bold"});
        });

        it('should apply style in specific paragraph', function(){
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
                activeIndex: 6
            });

            var operation = new C.ApplyFormatToElementOperation(textRange, textFlow, new C.Style({fontWeight: "bold"}));
            operation.doOperation();

            expect(paragraph2.numChildren()).to.be.equal(3);
            expect(paragraph2.getChildAt(0).getComputedStyle()).to.be.eql({});
            expect(paragraph2.getChildAt(1).getComputedStyle()).to.be.eql({fontWeight: "bold"});
            expect(paragraph2.text()).to.be.equal("DEF");
        });

        it('should apply style in specific paragraph', function () {
            var textFlow = new C.TextFlow(),
                paragraph = new C.Paragraph(),
                span1 = new C.Span({text: "ABC", style: new C.Style({fontWeight: "bold"})}),
                span2 = new C.Span({text: "DEF"}),
                textRange;

            paragraph.addChild(span1);
            paragraph.addChild(span2);

            textFlow.addChild(paragraph);

            textRange = new C.TextRange({
                anchorIndex: 5,
                activeIndex: 6
            });

            var operation = new C.ApplyFormatToElementOperation(textRange, textFlow, new C.Style({fontStyle: "italic"}));
            operation.doOperation();

            expect(paragraph.numChildren()).to.be.equal(3);
            expect(paragraph.getChildAt(0).getComputedStyle()).to.be.eql({fontWeight: "bold"});
            expect(paragraph.getChildAt(1).getComputedStyle()).to.be.eql({});
            expect(paragraph.getChildAt(2).getComputedStyle()).to.be.eql({fontStyle: "italic"});
            expect(paragraph.text()).to.be.equal("ABCDEF");
        });

        it('should apply style style on last element without creating new element', function(){
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

            var operation = new C.ApplyFormatToElementOperation(textRange, textFlow, new C.Style({fontStyle: "italic"}));
            operation.doOperation();

            expect(paragraph.numChildren()).to.be.equal(2);
            expect(paragraph.getChildAt(0).getComputedStyle()).to.be.eql({});
            expect(paragraph.getChildAt(1).getComputedStyle()).to.be.eql({fontStyle: "italic"});
            expect(paragraph.text()).to.be.equal("ABCDEF");
        });

        it('should apply correct original style', function(){
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

            var operation = new C.ApplyFormatToElementOperation(textRange, textFlow, new C.Style({fontWeight: "bold"}));
            operation.doOperation();

            expect(paragraph.numChildren()).to.be.equal(4);
            expect(paragraph.getChildAt(1).getComputedStyle()).to.be.eql({fontStyle: "italic"});
            expect(paragraph.getChildAt(2).getComputedStyle()).to.be.eql({fontWeight: "bold"});
            expect(paragraph.getChildAt(3).getComputedStyle()).to.be.eql({});

        });
    });

});