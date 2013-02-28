var expect = require('chai').expect,
    _ = require('underscore'),
    testRunner = require('rAppid.js').TestRunner.setup();

var C = {};

describe('Composer', function () {

    var measurer = null;

    before(function (done) {
        testRunner.requireClasses({
            TextFlow: 'text/entity/TextFlow',
            Span: 'text/entity/SpanElement',
            Paragraph: 'text/entity/ParagraphElement',
            FlowGroupElement: 'text/entity/FlowGroupElement',
            FlowLeafElement: 'text/entity/FlowLeafElement',
            MeasurerMock: 'test/mock/MeasurerMock',
            TextRange: "text/entity/TextRange",
            ApplyStyleToElementOperation: 'text/operation/ApplyStyleToElementOperation',
            Style: "text/type/Style",
            Composer: "text/composer/Composer",
            Layout: "text/entity/Layout"
        }, C, done);

    });

    beforeEach(function () {
        measurer = new C.MeasurerMock();
    });

    var helper = {

        createTextFlow: function (text, style, paragraphStyle) {
            style = style || new C.Style({
                fontSize: 12
            });

            var flow = C.TextFlow.initializeFromText(text),
                operation = new C.ApplyStyleToElementOperation(
                    C.TextRange.createTextRange(0, flow.textLength()),
                    flow, style, paragraphStyle);

            operation.doOperation();

            return flow;
        }

    };

    describe('mock', function () {

        it("should return the length of the font in dependency of the text length", function () {

            var flow = helper.createTextFlow("foo");

            expect(flow.numChildren()).to.be.eql(1);

            var metric = measurer.measure(flow.$.children.at(0).$.children.at(0));
            expect(metric.width).to.be.eql(36);
            expect(metric.height).to.be.eql(12);

        });

    });

    describe('composer', function () {

        var composer = null,
            flow,
            longText = "This is a long text, but the container isn't that large.";

        before(function () {
            composer = new C.Composer(measurer);
        });

        beforeEach(function () {
            flow = helper.createTextFlow(longText);
        });

        it("should not break text", function () {

            var composed = composer._composeText(flow.$.children.at(0));

            expect(composed.children).to.have.length(1);
            expect(composed.children[0].getTextHeight()).to.eql(12);

        });

        it("should determinate the height of the line based on the largest inline element", function () {

            (new C.ApplyStyleToElementOperation(C.TextRange.createTextRange(0, 3), flow, {
                fontSize: 36,
                lineHeight: 2
            })).doOperation();

            (new C.ApplyStyleToElementOperation(C.TextRange.createTextRange(10, 3), flow, {
                fontSize: 8,
                lineHeight: 10
            })).doOperation();

            var composed = composer._composeText(flow.$.children.at(0));

            expect(flow.$.children.$items).to.have.length(1);
            expect(flow.$.children.at(0).$.children.$items).to.have.length(3);

            expect(composed.children).to.have.length(1);
            expect(composed.children[0].getTextHeight()).to.eql(36);
            expect(composed.children[0].getHeight()).to.eql(80);

        });

        it("should break text into lines on white space chars", function () {

            flow = helper.createTextFlow("Simple test.");

            (new C.ApplyStyleToElementOperation(C.TextRange.createTextRange(0, 1), flow, new C.Style({
                fontSize: 10
            }))).doOperation();

            (new C.ApplyStyleToElementOperation(C.TextRange.createTextRange(1, 2), flow, new C.Style({
                fontSize: 11
            }))).doOperation();

            (new C.ApplyStyleToElementOperation(C.TextRange.createTextRange(2, 3), flow, new C.Style({
                fontSize: 13
            }))).doOperation();

            var composed = composer._composeText(flow.$.children.at(0), new C.Layout({
                width: 100
            }));

            expect(composed.children).to.have.length(2);
            expect(composed.children[0].getHeight()).to.eql(13);
            expect(composed.children[1].getHeight()).to.eql(12);

        });


        describe('composeText', function () {

            describe("getWordSpans", function () {

                var composer,
                    data;

                before(function () {
                    composer = new C.Composer(measurer);

                    composer._getWordSpans = function (paragraph, word, wordStartPosition, spanPositions) {

                        var object = C.Composer.prototype._getWordSpans.apply(this, arguments);
                        data.push(object);
                        return object;

                    };
                });

                beforeEach(function () {
                    data = []
                });

                it("should generate the correct word spans", function () {
                    var paragraph = new C.Paragraph(),
                        spans = [new C.Span({text: "Text "}),
                            new C.Span({text: "Com"}),
                            new C.Span({text: "posing "}),
                            new C.Span({text: "is "}),
                            new C.Span({text: "dif"}),
                            new C.Span({text: "fi"}),
                            new C.Span({text: "cult"})];

                    for (var i = 0; i < spans.length; i++) {
                        paragraph.addChild(spans[i]);
                    }

                    var composed = composer._composeText(paragraph);

                    expect(data).to.have.length(4);

                    expect(data[0]).to.have.length(1);
                    expect(data[1]).to.have.length(2);
                    expect(data[2]).to.have.length(1);
                    expect(data[3]).to.have.length(3);

                    expect(data[0][0].$.text).to.eql("Text ");
                    expect(data[0][0].$.originalSpan).to.equal(spans[0]);

                    expect(data[1][0].$.text).to.eql("Com");
                    expect(data[1][0].$.originalSpan).to.equal(spans[1]);

                    expect(data[1][1].$.text).to.eql("posing ");
                    expect(data[1][1].$.originalSpan).to.equal(spans[2]);

                    expect(data[2][0].$.text).to.eql("is ");
                    expect(data[2][0].$.originalSpan).to.equal(spans[3]);

                    expect(data[3][0].$.text).to.eql("dif");
                    expect(data[3][0].$.originalSpan).to.equal(spans[4]);

                    expect(data[3][1].$.text).to.eql("fi");
                    expect(data[3][1].$.originalSpan).to.equal(spans[5]);

                    expect(data[3][2].$.text).to.eql("cult");
                    expect(data[3][2].$.originalSpan).to.equal(spans[6]);

                });

            });

            describe("composeSoftLine", function () {

                var composer,
                    data;

                before(function () {
                    composer = new C.Composer(measurer);

                    composer._composeSoftLine = function (paragraph, softLine, softLineStartPosition, layout) {
                        data.push({
                            paragraph: paragraph,
                            softLine: softLine,
                            softLineStartPosition: softLineStartPosition
                        });

                        return C.Composer.prototype._composeSoftLine.apply(this, arguments);

                    };
                });

                beforeEach(function () {
                    data = []
                });

                it("should split up the paragraph data and call composeSoftLine", function () {
                    var paragraph = new C.Paragraph(),
                        span = new C.Span({text: "Composing\nis\ndifficult."});

                    paragraph.addChild(span);

                    composer._composeText(paragraph);

                    expect(data).to.have.length(3);
                    expect(data[0].softLineStartPosition).to.eql(0);
                    expect(data[0].softLine).to.eql("Composing");

                    expect(data[1].softLineStartPosition).to.eql(10);
                    expect(data[1].softLine).to.eql("is");

                    expect(data[2].softLineStartPosition).to.eql(13);
                    expect(data[2].softLine).to.eql("difficult.");
                });

            });

            it("should break after the first word", function () {
                var flow = helper.createTextFlow("A Textflow", {
                    fontSize: 12
                });

                var composed = composer._compose(flow, {
                    width: 100
                });

                expect(composed).to.exist;
                expect(composed.children).to.have.length(1); // one paragraph

                expect(composed.children[0].children).to.have.length(1); // one soft line

                expect(composed.children[0].children[0].children).to.have.length(2); // wrapped into two lines

                expect(composed.children[0].children[0].children[0].children).to.have.length(1);
                expect(composed.children[0].children[0].children[0].children[0].item.$.text).to.be.eql("A");

                expect(composed.children[0].children[0].children[1].children).to.have.length(1);
                expect(composed.children[0].children[0].children[1].children[0].item.$.text).to.be.eql("Textflow");
            });

        })
    });


});