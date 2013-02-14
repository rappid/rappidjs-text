var expect = require('chai').expect,
    _ = require('underscore'),
    testRunner = require('rAppid.js').TestRunner.setup();

var C = {};


describe('text.entity.FlowGroupElement', function () {


    before(function (done) {
        testRunner.requireClasses({
            FlowGroupElement: 'text/entity/FlowGroupElement',
            Span: 'text/entity/SpanElement'
        }, C, done);

    });

    describe('#text()', function () {

        it('should return text of all children', function () {
            var paragraph = new C.FlowGroupElement();

            paragraph.addChild(new C.Span({text: "Hello "}));
            paragraph.addChild(new C.Span({text: "World"}));

            expect(paragraph.text()).to.be.equal("Hello World");

        });

        it('should return cut of text', function(){

            var paragraph = new C.FlowGroupElement();

            paragraph.addChild(new C.Span({text: "Hello "}));
            paragraph.addChild(new C.Span({text: "World"}));

            expect(paragraph.text(1,7)).to.be.equal("ello W");
        });


        it('should return text of all children', function(){
            var paragraph = new C.FlowGroupElement(),
                subElementA = new C.FlowGroupElement(),
                subElementB = new C.FlowGroupElement();

            subElementA.addChild(new C.Span({text: "This is the first "}));
            subElementA.addChild(new C.Span({text: "paragraph."}));

            subElementB.addChild(new C.Span({text: "And this is the "}));
            subElementB.addChild(new C.Span({text: "second paragraph."}));

            paragraph.addChild(subElementA);
            paragraph.addChild(subElementB);

            expect(paragraph.text()).to.be.equal("This is the first paragraph. And this is the second paragraph. ");
        });


        it('should return text of all children', function () {
            var paragraph = new C.FlowGroupElement(),
                subElementA = new C.FlowGroupElement(),
                subElementB = new C.FlowGroupElement();

            subElementA.addChild(new C.Span({text: "This is the first "}));
            subElementA.addChild(new C.Span({text: "paragraph."}));

            subElementB.addChild(new C.Span({text: "And this is the "}));
            subElementB.addChild(new C.Span({text: "second paragraph."}));

            paragraph.addChild(subElementA);
            paragraph.addChild(subElementB);

            expect(paragraph.text(3,31)).to.be.equal("s is the first paragraph. An");
        })


    });

    describe('#splitAtIndex', function () {
        it('should split at given index', function(){
            var paragraph = new C.FlowGroupElement();

            paragraph.addChild(new C.Span({text: "This is the first "}));
            paragraph.addChild(new C.Span({text: "paragraph."}));

            paragraph.addChild(new C.Span({text: "And this is the "}));
            paragraph.addChild(new C.Span({text: "second paragraph."}));

            var newParagraph = paragraph.splitAtIndex(2);
            expect(paragraph.numChildren()).to.be.equal(3);
            expect(newParagraph.numChildren()).to.be.equal(1);
        });
    });

    describe('#findLeaf', function(){
        it('should find first leaf for a given textPosition', function(){
            var paragraph = new C.FlowGroupElement(),
                subElementA = new C.FlowGroupElement(),
                subElementB = new C.FlowGroupElement();

            var mySpan = new C.Span({text: "paragraph."});

            subElementA.addChild(new C.Span({text: "This is the first "}));
            subElementA.addChild(mySpan);

            subElementB.addChild(new C.Span({text: "And this is the "}));
            subElementB.addChild(new C.Span({text: "second paragraph."}));

            paragraph.addChild(subElementA);
            paragraph.addChild(subElementB);

            expect(paragraph.findLeaf(20)).to.be.equal(mySpan);
        });
    });

    describe('#findChildIndexAtPosition', function(){

        it('should return 0 for textPosition 0', function(){
            var paragraph = new C.FlowGroupElement(),
                mySpan = new C.Span();

            paragraph.addChild(mySpan);

            expect(paragraph.findChildIndexAtPosition(0)).to.be.equal(0);
        });

        it('should return last index for textPosition outside of elements', function () {
            var paragraph = new C.FlowGroupElement(),
                mySpan = new C.Span();

            paragraph.addChild(mySpan);

            expect(paragraph.findChildIndexAtPosition(1)).to.be.equal(0);
        });

        it('should return the element with the bigger index', function(){
            var paragraph = new C.FlowGroupElement(),
                mySpan = new C.Span({text: "abc"}),
                mySpan2 = new C.Span({text: "def"});

            paragraph.addChild(mySpan);
            paragraph.addChild(mySpan2);

            var index = paragraph.findChildIndexAtPosition(3);

            expect(index).to.be.equal(1);
        });

    });

    describe('#getNextLeaf', function () {
        it('should find next leaf for a given leaf', function () {
            var paragraph = new C.FlowGroupElement(),
                subElementA = new C.FlowGroupElement(),
                subElementB = new C.FlowGroupElement();

            var mySpan = new C.Span({text: "paragraph."}),
                mySpan2 = new C.Span({text: "And this is the "}),
                mySpan3 = new C.Span({text: "second paragraph."});

            subElementA.addChild(new C.Span({text: "This is the first "}));
            subElementA.addChild(mySpan);

            subElementB.addChild(mySpan2);
            subElementB.addChild(mySpan3);

            paragraph.addChild(subElementA);
            paragraph.addChild(subElementB);

            expect(mySpan.getNextLeaf()).to.be.equal(mySpan2);
            expect(mySpan2.getNextLeaf()).to.be.equal(mySpan3);
        });
    });

    describe('#getPreviousLeaf', function () {
        it('should find previous leaf for a given leaf', function () {
            var paragraph = new C.FlowGroupElement(),
                subElementA = new C.FlowGroupElement(),
                subElementB = new C.FlowGroupElement();

            var mySpan = new C.Span({text: "paragraph."}),
                mySpan2 = new C.Span({text: "And this is the "}),
                mySpan3 = new C.Span({text: "second paragraph."});

            subElementA.addChild(new C.Span({text: "This is the first "}));
            subElementA.addChild(mySpan);

            subElementB.addChild(mySpan2);
            subElementB.addChild(mySpan3);

            paragraph.addChild(subElementA);
            paragraph.addChild(subElementB);

            expect(mySpan2.getPreviousLeaf()).to.be.equal(mySpan);
            expect(mySpan.getPreviousLeaf().getPreviousLeaf()).to.be.equal(null);
            expect(mySpan3.getPreviousLeaf()).to.be.equal(mySpan2);
        });
    })

});