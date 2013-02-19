var expect = require('chai').expect,
    _ = require('underscore'),
    testRunner = require('rAppid.js').TestRunner.setup();

var C = {};


describe('text.entity.ParagraphElement', function () {


    before(function (done) {
        testRunner.requireClasses({
            Span: 'text/entity/SpanElement',
            Paragraph: 'text/entity/ParagraphElement'
        }, C, done);

    });

    describe('#findChildIndexAtPosition', function () {

        it('should return 0 for textPosition 0', function () {
            var paragraph = new C.Paragraph(),
                mySpan = new C.Span();

            paragraph.addChild(mySpan);

            expect(paragraph.findChildIndexAtPosition(0)).to.be.equal(0);
        });

        it('should return last index for textPosition outside of elements', function () {
            var paragraph = new C.Paragraph(),
                mySpan = new C.Span();

            paragraph.addChild(mySpan);

            expect(paragraph.findChildIndexAtPosition(1)).to.be.equal(0);
        });

        it('should return the element with the lower index', function () {
            var paragraph = new C.Paragraph(),
                mySpan = new C.Span({text: "abc"}),
                mySpan2 = new C.Span({text: "def"});

            paragraph.addChild(mySpan);
            paragraph.addChild(mySpan2);

            var index = paragraph.findChildIndexAtPosition(3);

            expect(index).to.be.equal(0);
        });
    });

    describe('#shallowCopy', function () {

        it('should create copy with single span', function(){

            var paragraph = new C.Paragraph(),
                span = new C.Span({text: "abc"});

            paragraph.addChild(span);

            var copy = paragraph.shallowCopy(1,2);

            expect(copy).to.be.instanceOf(C.Paragraph);
            expect(copy.text()).to.be.equal("b ");

        });

        it('should create a copy over range of spans', function(){
            var paragraph = new C.Paragraph(),
                span = new C.Span({text: "abc"}),
                span2 = new C.Span({text: "def"}),
                span3 = new C.Span({text: "ghi"});

            paragraph.addChild(span);
            paragraph.addChild(span2);
            paragraph.addChild(span3);

            var copy = paragraph.shallowCopy(2,8);

            expect(copy.text()).to.be.equal("cdefgh ");
            expect(copy.numChildren()).to.be.equal(3);
        });

        it('should create an empty copy', function () {
            var paragraph = new C.Paragraph(),
                span = new C.Span({text: "abc"}),
                span2 = new C.Span({text: "def"}),
                span3 = new C.Span({text: "ghi"});

            paragraph.addChild(span);
            paragraph.addChild(span2);
            paragraph.addChild(span3);

            var copy = paragraph.shallowCopy(2, 2);

            expect(copy.text()).to.be.equal(" ");
            expect(copy.numChildren()).to.be.equal(1);
        });


    });

    describe('#splitAtPosition', function () {
        it('should create new paragraph', function () {

            var paragraph = new C.Paragraph(),
                span = new C.Span({text: "abc"});

            paragraph.addChild(span);

            var newParagraph = paragraph.splitAtPosition(1);

            expect(paragraph.text()).to.be.equal("a ");
            expect(newParagraph.text()).to.be.equal("bc ");
            expect(newParagraph.numChildren()).to.be.equal(1);
        });

        it('should create a new paragraph with empty span', function(){

            var paragraph = new C.Paragraph(),
                span = new C.Span({text: "abc"});

            paragraph.addChild(span);

            var newParagraph = paragraph.splitAtPosition(3);

            expect(paragraph.text()).to.be.equal("abc ");
            expect(paragraph.numChildren()).to.be.equal(1);
            expect(newParagraph.text()).to.be.equal(" ");
            expect(newParagraph.numChildren()).to.be.equal(1);

        });

        it('should split all children', function () {
            var paragraph = new C.Paragraph(),
                span = new C.Span({text: "abc"}),
                span2 = new C.Span({text: "def"}),
                span3 = new C.Span({text: "ghi"});

            paragraph.addChild(span);
            paragraph.addChild(span2);
            paragraph.addChild(span3);

            var copy = paragraph.splitAtPosition(5);

            expect(paragraph.text()).to.be.equal("abcde ");
            expect(copy.text()).to.be.equal("fghi ");
            expect(copy.numChildren()).to.be.equal(2);
        });

    });

});