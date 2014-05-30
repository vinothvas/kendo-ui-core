(function() {
    var dataviz = kendo.dataviz,
        getElement = dataviz.getElement,
        Box2D = dataviz.Box2D,
        categoriesCount = dataviz.categoriesCount,
        chartBox = new Box2D(0, 0, 800, 600),
        series,
        view;

    function BarStub(box) {
        this.box = box;
    }

    BarStub.prototype = {
        reflow: function(box) {
            this.box = box;
        }
    };

    function setupBarChart(plotArea, options) {
        view = new ViewStub();

        options.gap = 1.5;
        series = new dataviz.BarChart(plotArea, options);
        series.reflow();
    }

    function stubPlotArea(getCategorySlot, getValueSlot, options) {
        return new function() {
            this.categoryAxis = this.primaryCategoryAxis = {
                getSlot: getCategorySlot,
                options: {
                    axisCrossingValue: 0,
                    categories: options.categoryAxis.categories
                }
            };

            this.valueAxis = {
                getSlot: getValueSlot,
                options: {
                    axisCrossingValue: 0
                },
                startValue: function() {
                    return 0;
                }
            };

            this.namedCategoryAxes = { };
            this.namedValueAxes = {};

            this.seriesCategoryAxis = function(series) {
                return series.categoryAxis ?
                    this.namedCategoryAxes[series.categoryAxis] : this.primaryCategoryAxis;
            };

            this.options = options;
        };
    }

    (function() {
        var positiveSeries = { data: [1, 2], labels: {} },
            negativeSeries = { data: [-1, -2], labels: {} },
            sparseSeries = { data: [undefined, 2], labels: {} },
            VALUE_AXIS_MAX = 2,
            CATEGORY_AXIS_Y = 2,
            TOLERANCE = 0.1;

        var plotArea = stubPlotArea(
                function(categoryIndex) {
                    return new Box2D(categoryIndex, CATEGORY_AXIS_Y,
                    categoryIndex + 1, CATEGORY_AXIS_Y);
                },
                function(from, to) {
                    var reverse = this.options.reverse,
                        fromY = CATEGORY_AXIS_Y + (reverse ? from : -from),
                        toY = CATEGORY_AXIS_Y + (reverse ? to : -to),
                        slotTop = Math.min(fromY, toY),
                        slotBottom = Math.max(fromY, toY);

                    return new Box2D(0, slotTop, 0, slotBottom);
                },
                {
                    categoryAxis: {
                        categories: ["A", "B"]
                    }
                }
            );

        // ------------------------------------------------------------
        module("Bar Chart", {
            setup: function() {
                setupBarChart(plotArea, { series: [ positiveSeries ] });
                series.getViewElements(view);
            }
        });

        test("generates unique id", function() {
            ok(series.id);
        });

        test("renders group with series id and no animations", function() {
            var group = view.findInLog("group", function(item) {
                return item.options.id === series.id;
            });

            ok(group && !group.options.animation);
            equal(group.options.id, series.id);
        });

        // ------------------------------------------------------------
        module("Bar Chart / Positive Values", {
            setup: function() {
                setupBarChart(plotArea, { series: [ positiveSeries ] });
            }
        });

        test("Creates bars for series data points", function() {
            equal(series.points.length, positiveSeries.data.length);
        });

        test("Reports minimum value for default axis", function() {
            deepEqual(series.valueAxisRanges[undefined].min, positiveSeries.data[0]);
        });

        test("Reports maximum value for default axis", function() {
            deepEqual(series.valueAxisRanges[undefined].max, positiveSeries.data[1]);
        });

        test("Reports correct range with string value", function() {
            setupBarChart(plotArea, { series: [{ data: ["1", "2", "3"] }] });

            deepEqual(series.valueAxisRanges[undefined].min, 1);
            deepEqual(series.valueAxisRanges[undefined].max, 3);
        });

        test("Reports number of categories", function() {
            setupBarChart(plotArea, {series: [ positiveSeries ]});
            equal(categoriesCount(series.options.series), positiveSeries.data.length);
        });

        test("bars are distributed across category axis", function() {
            var barsX = $.map(series.points, function(bar) {
                return bar.box.x1;
            });

            arrayClose(barsX, [0.3, 1.3], TOLERANCE);
        });

        test("bar bottoms are aligned to category axis", function() {
            var barsY = $.map(series.points, function(bar) {
                return bar.box.y2;
            });

            deepEqual(barsY, [CATEGORY_AXIS_Y, CATEGORY_AXIS_Y]);
        });

        test("bars have set width", function() {
            $.each(series.points, function() {
                close(this.box.width(), 0.4, TOLERANCE);
            });
        });

        test("bars have set height according to value", function() {
            var barHeights = $.map(series.points, function(bar) {
                return bar.box.height();
            });

            deepEqual(barHeights, [1, 2]);
        });

        test("sets bar owner", function() {
            ok(series.points[0].owner === series);
        });

        test("sets bar series", function() {
            ok(series.points[0].series === positiveSeries);
        });

        test("sets bar series index", function() {
            ok(series.points[0].seriesIx === 0);
        });

        test("sets bar category", function() {
            equal(series.points[0].category, "A");
        });

        test("sets bar dataItem", function() {
            equal(typeof series.points[0].dataItem, "number");
        });

        test("sets bar aboveAxis", function() {
            equal(series.points[0].aboveAxis, true);
        });

        test("sets bar aboveAxis for reversed value axis", function() {
            plotArea.valueAxis.options.reverse = true;

            setupBarChart(plotArea, { series: [ positiveSeries ] });
            equal(series.points[0].aboveAxis, false);

            plotArea.valueAxis.options.reverse = false;
        });

        test("Throws error when unable to locate value axis", function() {
            raises(function() {
                    setupBarChart(plotArea, {
                        series: [{ axis: "b", data: [1] }]
                    });
                },
                /Unable to locate value axis with name b/);
        });

        // ------------------------------------------------------------
        module("Bar Chart / Negative Values", {
            setup: function() {
                setupBarChart(plotArea, { series: [ negativeSeries ] });
            }
        });

        test("Reports minimum value for default axis", function() {
            deepEqual(series.valueAxisRanges[undefined].min, negativeSeries.data[1]);
        });

        test("Reports maximum value for default axis", function() {
            deepEqual(series.valueAxisRanges[undefined].max, negativeSeries.data[0]);
        });

        test("Reports correct range with string value", function() {
            setupBarChart(plotArea, { series: [{ data: ["-1", "-2", "-3"] }] });

            deepEqual(series.valueAxisRanges[undefined].min, -3);
            deepEqual(series.valueAxisRanges[undefined].max, -1);
        });

        test("bar tops are aligned to category axis", function() {
            var barsY = $.map(series.points, function(bar) {
                return bar.box.y1;
            });

            deepEqual(barsY, [CATEGORY_AXIS_Y, CATEGORY_AXIS_Y]);
        });

        test("bars have set height according to value", function() {
            var barHeights = $.map(series.points, function(bar) {
                return bar.box.height();
            });

            deepEqual(barHeights, [1, 2]);
        });

        test("sets bar aboveAxis", function() {
            equal(series.points[0].aboveAxis, false);
        });

        test("sets bar aboveAxis for reversed value axis", function() {
            plotArea.valueAxis.options.reverse = true;

            setupBarChart(plotArea, { series: [ negativeSeries ] });
            equal(series.points[0].aboveAxis, true);

            plotArea.valueAxis.options.reverse = false;
        });

        // ------------------------------------------------------------

        module("Bar Chart / Values exceeding value axis min or max options ", {});

        test("values are not limited", 2, function() {
            var plotArea = stubPlotArea(
                function(categoryIndex) {
                    return new Box2D(categoryIndex, CATEGORY_AXIS_Y,
                                     categoryIndex + 1, CATEGORY_AXIS_Y);
                },
                function(value, axisCrossingValue, limit) {
                    ok(!limit);
                    return Box2D();
                },
                {
                    categoryAxis: {
                        categories: ["A", "B"]
                    }
                }
            );

            setupBarChart(plotArea, { series: [ {data: [1, 2]} ] });
        });

        // ------------------------------------------------------------
        module("Bar Chart / Multiple Series", {
            setup: function() {
                plotArea.namedValueAxes.secondary = plotArea.valueAxis;

                setupBarChart(plotArea, {
                    series: [
                        $.extend({ }, negativeSeries ),
                        $.extend({ axis: "secondary" }, positiveSeries )
                    ] });
                }
        });

        test("Reports minimum value for primary axis", function() {
            deepEqual(series.valueAxisRanges[undefined].min, negativeSeries.data[1]);
        });

        test("Reports maximum value for primary axis", function() {
            deepEqual(series.valueAxisRanges[undefined].max, negativeSeries.data[0]);
        });

        test("Reports minimum value for secondary axis", function() {
            deepEqual(series.valueAxisRanges.secondary.min, positiveSeries.data[0]);
        });

        test("Reports maximum value for secondary axis", function() {
            deepEqual(series.valueAxisRanges.secondary.max, positiveSeries.data[1]);
        });

        test("Reports number of categories for two series", function() {
            equal(categoriesCount(series.options.series), positiveSeries.data.length);
        });

        test("aboveAxis is set independently for each bar", function() {
            equal(series.points[0].aboveAxis, false);
            equal(series.points[2].aboveAxis, false);
        });

        // ------------------------------------------------------------
        var chart;
        module("Bar Chart / Multiple Category Axes", {
            setup: function() {
                chart = createChart({
                    series: [{
                        type: "bar",
                        data: [1],
                        categoryAxis: "secondary"
                    }],
                    valueAxis: {
                        axisCrossingValue: [10, 0]
                    },
                    categoryAxis: [{
                        categories: ["A"]
                    }, {
                        name: "secondary",
                        categories: ["B"]
                    }]
                });

                series = chart._model._plotArea.charts[0];
            },
            teardown: destroyChart
        });

        test("sets category axis to first series category axis", function() {
            equal(series.categoryAxis.options.name, "secondary");
        });

        test("bar is marked as above axis with respect to its category axis", function() {
            equal(series.points[0].aboveAxis, true);
        });

        test("bar is rendered from its category axis", function() {
            equal(series.points[0].box.x1, series.categoryAxis.lineBox().x1);
        });

        test("axis crossing value is assumed to be 0", function() {
            delete chart.options.valueAxis.axisCrossingValue;
            chart.refresh();
            series = chart._model._plotArea.charts[0];

            equal(series.points[0].aboveAxis, true);
        });

        test("axisCrossingValues alias is accepted with precedence", function() {
            chart.options.valueAxis.axisCrossingValues = [10, 10]
            chart.refresh();
            series = chart._model._plotArea.charts[0];

            equal(series.points[0].aboveAxis, false);
        });

        test("hides the series if the visible is set to false", function() {
            chart = createChart({
                series: [{
                    type: "bar",
                    data: [1],
                    visible: false
                },{
                    type: "bar",
                    data: [1]
                }]
            });

            ok(series.points.length === 1);
        });

        // ------------------------------------------------------------
        module("Bar Chart / Mismatched series", {
            setup: function() {
                setupBarChart(plotArea, {
                series: [ { data: [1, 2, 3] },
                          positiveSeries
                    ]
                });
            }
        });

        test("Reports minimum value for default axis", function() {
            deepEqual(series.valueAxisRanges[undefined].min, 1);
        });

        test("Reports maximum value for default axis", function() {
            deepEqual(series.valueAxisRanges[undefined].max, 3);
        });

        test("Reports number of categories", function() {
            equal(categoriesCount(series.options.series), 3);
        });

        test("bar bottoms are aligned to category axis", 6, function() {
            $.each(series.points, function() {
                equal(this.box.y2, CATEGORY_AXIS_Y);
            });
        });

        // ------------------------------------------------------------
        module("Bar Chart / Missing values", {
            setup: function() {
                setupBarChart(plotArea, {
                    series: [{ data: [1, 2, null] }]
                });
            }
        });

        test("Missing values are represented as bars with zero height", function() {
            var barHeights = $.map(series.points, function(bar) {
                return bar.box.height();
            });

            deepEqual(barHeights, [1, 2, 0]);
        });

        test("ignores null values when reporting minimum series value", function() {
            equal(series.valueAxisRanges[undefined].min, 1);
        });

        // ------------------------------------------------------------
        module("Bar Chart / Cluster", {
            setup: function() {
                setupBarChart(plotArea, { series: [ positiveSeries, negativeSeries ] });
            },
            teardown: destroyChart
        });

        test("bars in first category are clustered", function() {
            equal(series.points[0].box.x2, series.points[1].box.x1);
        });

        test("bars in different panes are not clustered", function() {
            var chart = createChart({
                series: [{
                    type: "column",
                    data: [1]
                }, {
                    type: "column",
                    data: [2],
                    axis: "b"
                }],
                panes: [{
                    name: "top"
                }, {
                    name: "bottom"
                }],
                valueAxis: [{
                }, {
                    name: "b",
                    pane: "bottom"
                }],
                categoryAxis: {
                    categories: ["A"]
                }
            });

            var barCharts = chart._model._plotArea.charts;
            close(barCharts[0].points[0].box.x1, barCharts[1].points[0].box.x1, TOLERANCE);
        });

        // ------------------------------------------------------------
        var oldGetSlot;
        module("Bar Chart / Stack / Positive Values", {
            setup: function() {
                oldGetSlot = plotArea.valueAxis.getSlot;

                plotArea.valueAxis.getSlot = function(a, b) {
                    var a = typeof a === "undefined" ? 0 : a,
                        b = typeof b === "undefined" ? a : b,
                        top = VALUE_AXIS_MAX - Math.max(a, b),
                        bottom = VALUE_AXIS_MAX - Math.min(a, b),
                        slotTop = top,
                        slotBottom = bottom;

                    return new Box2D(0, slotTop, 0, slotBottom);
                };

                setupBarChart(plotArea, {
                    series: [ positiveSeries, positiveSeries ],
                    isStacked: true }
                );
            },
            teardown: function() {
                plotArea.valueAxis.getSlot = oldGetSlot;
            }
        });

        test("reports 0 as minumum value for default axis", function() {
            equal(series.valueAxisRanges[undefined].min, 0);
        });

        test("reports stacked maximum value for default axis", function() {
            equal(series.valueAxisRanges[undefined].max, 4);
        });

        test("bars in first category are stacked", function() {
            equal(series.points[1].box.y2, series.points[0].box.y1);
        });

        test("series have 75% margin", function() {
            close(series.points[0].box.x1, 0.3, TOLERANCE);
        });

        test("bars have set height according to value", function() {
            var barHeights = $.map(series.points, function(bar) {
                return bar.box.height();
            });

            deepEqual(barHeights, [1, 1, 2, 2]);
        });

        test("stack base is set to zero value slot", function() {
            equal(series.points[0].options.stackBase, 2);
        });

        test("stack base is set to zero value slot when category axis is moved to top", function() {
            CATEGORY_AXIS_Y = 0;

            setupBarChart(plotArea, {
                series: [ positiveSeries, positiveSeries ],
                isStacked: true }
            );

            equal(series.points[0].options.stackBase, 2);

            CATEGORY_AXIS_Y = 2;
        });

        // ------------------------------------------------------------
        module("Bar Chart / Stack / Negative Values", {
            setup: function() {
                setupBarChart(plotArea, {
                    series: [ negativeSeries, negativeSeries ],
                    isStacked: true
                });
            }
        });

        test("reports stacked minumum value for default axis", function() {
            equal(series.valueAxisRanges[undefined].min, -4);
        });

        test("reports 0 as maximum value for default axis", function() {
            equal(series.valueAxisRanges[undefined].max, 0);
        });

        test("bars in first category are stacked", function() {
            equal(series.points[1].box.y1, series.points[0].box.y2);
        });

        test("stack tops are aligned to category axis", function() {
            deepEqual([series.points[0].box.y1, series.points[2].box.y1],
                 [CATEGORY_AXIS_Y, CATEGORY_AXIS_Y]);
        });

        test("bars have set height according to value", function() {
            var barHeights = $.map(series.points, function(bar) {
                return bar.box.height();
            });

            deepEqual(barHeights, [1, 1, 2, 2]);
        });

        test("stack tops are aligned to 0 line when category axis crossing value is changed", function() {
            CATEGORY_AXIS_Y = 4;

            setupBarChart(plotArea, {
                series: [ negativeSeries, negativeSeries ],
                isStacked: true
            });

            deepEqual([series.points[0].box.y1, series.points[2].box.y1],
                      [4, 4]);

            CATEGORY_AXIS_Y = 2;
        });

        test("stack base is set to zero value slot", function() {
            equal(series.points[0].options.stackBase, 2);
        });

        test("stack base is set to zero value slot when category axis is moved to bottom", function() {
            CATEGORY_AXIS_Y = 4;

            setupBarChart(plotArea, {
                series: [ negativeSeries, negativeSeries ],
                isStacked: true }
            );

            equal(series.points[0].options.stackBase, 4);

            CATEGORY_AXIS_Y = 2;
        });

        // ------------------------------------------------------------
        var oldGetSlot;
        module("Bar Chart / Stack / Mixed Values", {
            setup: function() {
                oldGetSlot = plotArea.valueAxis.getSlot;

                plotArea.valueAxis.getSlot = function(a, b) {
                    var a = typeof a === "undefined" ? 0 : a,
                        b = typeof b === "undefined" ? a : b,
                        top = VALUE_AXIS_MAX - Math.max(a, b),
                        bottom = VALUE_AXIS_MAX - Math.min(a, b),
                        slotTop = top,
                        slotBottom = bottom;

                    return new Box2D(0, slotTop, 0, slotBottom);
                };

                setupBarChart(plotArea, {
                    series: [{
                        data: [1, -1],
                        labels: {}
                    }],
                    isStacked: true
                });
            },
            teardown: function() {
                plotArea.valueAxis.getSlot = oldGetSlot;
            }
        });

        test("reports stacked minumum value for default axis", function() {
            equal(series.valueAxisRanges[undefined].min, -1);
        });

        test("reports stacked maximum value for default axis", function() {
            equal(series.valueAxisRanges[undefined].max, 1);
        });

        test("bars have set height according to value", function() {
            var barHeights = $.map(series.points, function(bar) {
                return bar.box.height();
            });

            deepEqual(barHeights, [1, 1]);
        });

        test("stack base is set to zero value slot", function() {
            equal(series.points[0].options.stackBase, 2);
        });

        test("stack base is set to zero value slot when category axis is moved to bottom (negative series first)", function() {
            CATEGORY_AXIS_Y = 4;

            setupBarChart(plotArea, {
                series: [ negativeSeries, positiveSeries ],
                isStacked: true }
            );

            equal(series.points[0].options.stackBase, 2);

            CATEGORY_AXIS_Y = 2;
        });

        test("stack base is set to zero value slot when category axis is moved to bottom (positive series first)", function() {
            CATEGORY_AXIS_Y = 4;

            setupBarChart(plotArea, {
                series: [ positiveSeries, negativeSeries ],
                isStacked: true }
            );

            equal(series.points[0].options.stackBase, 2);

            CATEGORY_AXIS_Y = 2;
        });

        test("stack base is set to zero value slot when category axis is moved to top (negative series first)", function() {
            CATEGORY_AXIS_Y = 0;

            setupBarChart(plotArea, {
                series: [ negativeSeries, positiveSeries ],
                isStacked: true }
            );

            equal(series.points[0].options.stackBase, 2);

            CATEGORY_AXIS_Y = 2;
        });

        test("stack base is set to zero value slot when category axis is moved to top (positive series first)", function() {
            CATEGORY_AXIS_Y = 0;

            setupBarChart(plotArea, {
                series: [ positiveSeries, negativeSeries ],
                isStacked: true }
            );

            equal(series.points[0].options.stackBase, 2);

            CATEGORY_AXIS_Y = 2;
        });

        // ------------------------------------------------------------
        module("Bar Chart / Stack / Mixed Series", {
            setup: function() {
                plotArea.namedValueAxes.a = plotArea.valueAxis;
                plotArea.namedValueAxes.b = plotArea.valueAxis;

                setupBarChart(plotArea, {
                    series: [
                        // Both series should be on the same axis.
                        // This rule is intentionally broken for the tests.
                        $.extend({ axis: "a" }, positiveSeries),
                        $.extend({ axis: "b" }, negativeSeries)
                    ],
                    isStacked: true
                });
            }
        });

        test("reports stacked minumum value for default axis", function() {
            equal(series.valueAxisRanges.a.min, -2);
        });

        test("reports stacked maximum value for default axis", function() {
            equal(series.valueAxisRanges.a.max, 2);
        });

        test("bars have set height according to value", function() {
            var barHeights = $.map(series.points, function(bar) {
                return bar.box.height();
            });

            deepEqual(barHeights, [1, 1, 2, 2]);
        });

        // ------------------------------------------------------------
        module("Bar Chart / Stack / Missing Values", {
            setup: function() {
                setupBarChart(plotArea, {
                    series: [ sparseSeries, sparseSeries ],
                    isStacked: true }
                );
            }
        });

        test("Reports minimum series value", function() {
            deepEqual(series.valueAxisRanges[undefined].min, 0);
        });

        test("Reports maximum series value", function() {
            deepEqual(series.valueAxisRanges[undefined].max, 4);
        });

        // ------------------------------------------------------------
        module("Bar Chart / 100% Stacked / Positive Values", {
            setup: function() {
                setupBarChart(plotArea, {
                    series: [ positiveSeries, positiveSeries ],
                    isStacked: true, isStacked100: true }
                );
            }
        });

        test("reports minumum value for default axis", function() {
            equal(series.valueAxisRanges[undefined].min, 0);
        });

        test("reports maximum value for default axis", function() {
            equal(series.valueAxisRanges[undefined].max, 1);
        });

        // ------------------------------------------------------------
        module("Bar Chart / 100% Stacked / Negative Values", {
            setup: function() {
                setupBarChart(plotArea, {
                    series: [ negativeSeries, negativeSeries ],
                    isStacked: true, isStacked100: true }
                );
            }
        });

        test("reports minumum value for default axis", function() {
            equal(series.valueAxisRanges[undefined].min, -1);
        });

        test("reports maximum value for default axis", function() {
            equal(series.valueAxisRanges[undefined].max, 0);
        });

        // ------------------------------------------------------------
        module("Bar Chart / 100% Stacked / Mixed Values", {
            setup: function() {
                setupBarChart(plotArea, {
                    series: [ negativeSeries, positiveSeries ],
                    isStacked: true, isStacked100: true }
                );
            }
        });

        test("reports minumum value for default axis", function() {
            equal(series.valueAxisRanges[undefined].min, -0.5);
        });

        test("reports maximum value for default axis", function() {
            equal(series.valueAxisRanges[undefined].max, 0.5);
        });

        // ------------------------------------------------------------
        module("Bar Chart / 100% Stacked / Missing Values", {
            setup: function() {
                setupBarChart(plotArea, {
                    series: [ sparseSeries, positiveSeries ],
                    isStacked: true, isStacked100: true }
                );
            }
        });

        test("reports minumum value for default axis", function() {
            equal(series.valueAxisRanges[undefined].min, 0);
        });

        test("reports maximum value for default axis", function() {
            equal(series.valueAxisRanges[undefined].max, 1);
        });

        // ------------------------------------------------------------
        module("Bar Chart / Grouped Stack / Positive Values", {
            setup: function() {
                setupBarChart(plotArea, {
                    series: [
                        $.extend({ stack: "a" }, positiveSeries),
                        $.extend({ stack: "a" }, positiveSeries),
                        $.extend({ stack: "b" }, positiveSeries),
                        $.extend({ stack: "b" }, positiveSeries)
                    ],
                    isStacked: true
                });
            }
        });

        test("reports 0 as minumum value for default axis", function() {
            equal(series.valueAxisRanges[undefined].min, 0);
        });

        test("reports stacked maximum value for default axis", function() {
            equal(series.valueAxisRanges[undefined].max, 4);
        });

        test("bars in first category, first group are stacked", function() {
            equal(series.points[1].box.y2, series.points[0].box.y1);
        });

        test("bars in first category, second group are stacked", function() {
            equal(series.points[3].box.y2, series.points[2].box.y1);
        });

        test("bars in first category, second group are in separate stack", function() {
            ok(series.points[2].box.y2 != series.points[1].box.y1);
        });

        test("stack base is set to zero value slot", function() {
            equal(series.points[0].options.stackBase, 2);
            equal(series.points[2].options.stackBase, 2);
        });

        test("groups with no stack are assigned to first stack", function() {
            setupBarChart(plotArea, {
                series: [
                    $.extend(true, { stack: "a" }, positiveSeries),
                    positiveSeries
                ],
                isStacked: true
            });

            equal(series.valueAxisRanges[undefined].max, 4);
        });

        // ------------------------------------------------------------
        module("Bar Chart / Grouped Stack / Negative Values", {
            setup: function() {
                setupBarChart(plotArea, {
                    series: [
                        $.extend({ stack: "a" }, negativeSeries),
                        $.extend({ stack: "a" }, negativeSeries),
                        $.extend({ stack: "b" }, negativeSeries),
                        $.extend({ stack: "b" }, negativeSeries)
                    ],
                    isStacked: true
                });
            }
        });

        test("reports stacked minumum value for default axis", function() {
            equal(series.valueAxisRanges[undefined].min, -4);
        });

        test("reports 0 as maximum value for default axis", function() {
            equal(series.valueAxisRanges[undefined].max, 0);
        });

        test("bars in first category, first group are stacked", function() {
            equal(series.points[1].box.y1, series.points[0].box.y2);
        });

        test("bars in first category, second group are stacked", function() {
            equal(series.points[3].box.y1, series.points[2].box.y2);
        });

        test("bars in first category, second group are in separate stack", function() {
            ok(series.points[2].box.y1 != series.points[1].box.y2);
        });

        test("stack base is set to zero value slot", function() {
            equal(series.points[0].options.stackBase, 2);
            equal(series.points[2].options.stackBase, 2);
        });

        // ------------------------------------------------------------
        module("Bar Chart / Grouped Stack / Mixed Values", {
            setup: function() {
                setupBarChart(plotArea, {
                    series: [
                        $.extend({ stack: "a" }, positiveSeries),
                        $.extend({ stack: "a" }, positiveSeries),
                        $.extend({ stack: "b" }, negativeSeries),
                        $.extend({ stack: "b" }, negativeSeries)
                    ],
                    isStacked: true
                });
            }
        });

        test("reports stacked minumum value for default axis", function() {
            equal(series.valueAxisRanges[undefined].min, -4);
        });

        test("reports stacked maximum value for default axis", function() {
            equal(series.valueAxisRanges[undefined].max, 4);
        });

        test("bars in first category, first group are stacked", function() {
            equal(series.points[1].box.y2, series.points[0].box.y1);
        });

        test("bars in first category, second group are stacked", function() {
            equal(series.points[3].box.y1, series.points[2].box.y2);
        });

        test("bars in first category, second group are in separate stack", function() {
            ok(series.points[2].box.y1 != series.points[1].box.y2);
        });

        test("bars in second category, first group are stacked", function() {
            equal(series.points[5].box.y2, series.points[4].box.y1);
        });

        test("bars in second category, second group are stacked", function() {
            equal(series.points[7].box.y1, series.points[6].box.y2);
        });

        test("stack base is set to zero value slot", function() {
            equal(series.points[0].options.stackBase, 2);
            equal(series.points[2].options.stackBase, 2);
        });

        // ------------------------------------------------------------
        module("Bar Chart / Grouped Stack / Mixed Values / Reversed Axes", {
            setup: function() {
                plotArea.valueAxis.options.reverse = true;
                setupBarChart(plotArea, {
                    series: [
                        $.extend({ stack: "a" }, positiveSeries),
                        $.extend({ stack: "a" }, positiveSeries),
                        $.extend({ stack: "b" }, negativeSeries),
                        $.extend({ stack: "b" }, negativeSeries)
                    ],
                    isStacked: true
                });
                plotArea.valueAxis.options.reverse = false;
            }
        });

        test("bars in first category, first group are stacked", function() {
            equal(series.points[1].box.y1, series.points[0].box.y2);
        });

        test("bars in first category, second group are stacked", function() {
            equal(series.points[3].box.y2, series.points[2].box.y1);
        });

        test("bars in second category, first group are stacked", function() {
            equal(series.points[5].box.y1, series.points[4].box.y2);
        });

        test("bars in second category, second group are stacked", function() {
            equal(series.points[7].box.y2, series.points[6].box.y1);
        });

        // ------------------------------------------------------------
        module("Bar Chart / Grouped Stack / Group Syntax", {
            setup: function() {
                setupBarChart(plotArea, {
                    series: [
                        $.extend({ stack: { group: "a" } }, positiveSeries),
                        $.extend({ stack: { group: "a" } }, positiveSeries),
                        $.extend({ stack: { group: "b" } }, positiveSeries),
                        $.extend({ stack: { group: "b" } }, positiveSeries)
                    ],
                    isStacked: true
                });
            }
        });

        test("two stacks are created", function() {
            var cluster = series.children[0];
            equal(cluster.children[0]._stackGroup, "a");
            equal(cluster.children[1]._stackGroup, "b");
        });

        // ------------------------------------------------------------
        module("Bar Chart / Grouped Stack / Multiple Axes", {
            setup: function() {
                var smallSeries = { stack: "a", data: [1, 2], axis: "A" };
                var largeSeries = { stack: "b", data: [10, 20], axis: "B" };
                setupBarChart($.extend(true, {
                    namedValueAxes: { "A": plotArea.valueAxis, "B": plotArea.valueAxis }
                }, plotArea), {
                    series: [
                        smallSeries,
                        smallSeries,
                        largeSeries,
                        largeSeries
                    ],
                    isStacked: true
                });
            }
        });

        test("reports stacked minumum value for first axis", function() {
            equal(series.valueAxisRanges["A"].min, 0);
        });

        test("reports stacked maximum value for first axis", function() {
            equal(series.valueAxisRanges["A"].max, 4);
        });

        test("reports stacked minumum value for second axis", function() {
            equal(series.valueAxisRanges["B"].min, 0);
        });

        test("reports stacked maximum value for second axis", function() {
            equal(series.valueAxisRanges["B"].max, 40);
        });


        // ------------------------------------------------------------
        module("Bar Chart / Stacked / Panes", {
            teardown: destroyChart
        });

        test("bars in different panes are not stacked", function() {
            var chart = createChart({
                series: [{
                    stack: true,
                    type: "column",
                    data: [1]
                }, {
                    type: "column",
                    data: [2],
                    axis: "b"
                }],
                panes: [{
                    name: "top"
                }, {
                    name: "bottom"
                }],
                valueAxis: [{
                }, {
                    name: "b",
                    pane: "bottom"
                }],
                categoryAxis: {
                    categories: ["A"]
                }
            });

            var barCharts = chart._model._plotArea.charts;
            notClose(barCharts[0].points[0].box.y1, barCharts[1].points[0].box.y2, TOLERANCE);
        });

    })();

    (function() {
        var BarLabel = kendo.dataviz.BarLabel,
            barLabel,
            paddingBox,
            text;

        module("BarLabel", {
            setup: function() {
                view = new ViewStub();
            }
        });

        test("renders no elements if visible option is false", function() {
            barLabel = new BarLabel("content", {visible: false});
            var result = barLabel.getViewElements(view);

            equal(result.length, 0);
            equal(view.log.text.length, 0);
            equal(view.log.rect.length, 0);
        });

        module("BarLabel / reflow / vertical", {});

        test("sets left and right padding to its textbox to fill the bar width", function() {
            barLabel = new BarLabel("content", {vertical: true, padding: {
                left: 0,
                right: 0
            }, margin: 0});
            text = barLabel.children[0];
            text.contentBox = Box2D(0, 0, 50, 50);
            barLabel.reflow(Box2D(0, 0, 100, 100));

            equal(text.options.padding.left, 25);
            equal(text.options.padding.right, 25);
        });

        test("does not set left and right padding to its textbox if its rotated", function() {
            barLabel = new BarLabel("content", {vertical: true, rotation: 45, padding: {
                left: 0,
                right: 0
            }, margin: 0});
            text = barLabel.children[0];
            text.contentBox = Box2D(0, 0, 50, 50);
            barLabel.reflow(Box2D(0, 0, 100, 100));

            equal(text.options.padding.left, 0);
            equal(text.options.padding.right, 0);
        });

        module("BarLabel / reflow / horizontal", {});

        test("sets top and bottom padding to its textbox to fill the bar height", function() {
            barLabel = new BarLabel("content", {vertical: false, padding: {
                top: 0,
                bottom: 0
            }, margin: 0});
            text = barLabel.children[0];
            text.contentBox = Box2D(0, 0, 50, 50);
            barLabel.reflow(Box2D(0, 0, 100, 100));

            equal(text.options.padding.top, 25);
            equal(text.options.padding.bottom, 25);
        });

        test("does not set top and bottom padding to its textbox if its rotated", function() {
            barLabel = new BarLabel("content", {vertical: false, rotation: 45, padding: {
                top: 0,
                bottom: 0
            }, margin: 0});
            text = barLabel.children[0];
            text.contentBox = Box2D(0, 0, 50, 50);
            barLabel.reflow(Box2D(0, 0, 100, 100));

            equal(text.options.padding.top, 0);
            equal(text.options.padding.bottom, 0);
        });

        module("BarLabel / Align to clip box / vertical", {
            setup: function() {
                barLabel = new BarLabel("content", {vertical: true, padding: 0, margin: 0});
                barLabel.reflow(Box2D(50, 50, 60, 60));
                text = barLabel.children[0];
                paddingBox = text.paddingBox.clone();
            }
        });

        test("label inside the box is not aligned", function() {
            barLabel.alignToClipBox(Box2D(0, paddingBox.y1 - 20, 100, paddingBox.y1 + 1));
            var result = text.paddingBox;
            equal(result.x1, paddingBox.x1);
            equal(result.x2, paddingBox.x2);
            equal(result.y1, paddingBox.y1);
            equal(result.y2, paddingBox.y2);
        });

        test("label above the box is aligned to the top of the box", 4, function() {
            text.reflow = function(result) {
                equal(result.x1, paddingBox.x1);
                equal(result.x2, paddingBox.x2);
                close(result.y1, paddingBox.y1 + 20, 0.1);
                equal(result.y2, paddingBox.y2 + 20);
            };
            barLabel.alignToClipBox(Box2D(0, paddingBox.y2 + 20, 100, paddingBox.y2 + 30));
        });

        test("label below the box is aligned to the bottom of the box", 4, function() {
            text.reflow = function(result) {
                equal(result.x1, paddingBox.x1);
                equal(result.x2, paddingBox.x2);
                equal(result.y1, paddingBox.y1 - 20);
                close(result.y2, paddingBox.y2 - 20, 0.1);
            };
            barLabel.alignToClipBox(Box2D(0, paddingBox.y1 - 30, 100, paddingBox.y1 - 20));
        });


        module("BarLabel / Align to clip box / horizontal", {
            setup: function() {
                barLabel = new BarLabel("content", {vertical: false, padding: 0, margin: 0});
                barLabel.reflow(Box2D(50, 50, 60, 60));
                text = barLabel.children[0];
                paddingBox = text.paddingBox.clone();
            }
        });

        test("label inside the box is not aligned", function() {
            barLabel.alignToClipBox(Box2D(paddingBox.x1 - 20, 0, paddingBox.x1 + 1, 100));
            var result = text.paddingBox;
            equal(result.x1, paddingBox.x1);
            equal(result.x2, paddingBox.x2);
            equal(result.y1, paddingBox.y1);
            equal(result.y2, paddingBox.y2);
        });

        test("label left from the box is aligned to the left side of the box", 4, function() {
            text.reflow = function(result) {
                equal(result.y1, paddingBox.y1);
                equal(result.y2, paddingBox.y2);
                close(result.x1, paddingBox.x1 + 20, 0.1);
                equal(result.x2, paddingBox.x2 + 20);
            };
            barLabel.alignToClipBox(Box2D(paddingBox.x2 + 20, 0, paddingBox.x2 + 30, 100));
        });

        test("label right from the box is aligned to the right side of the box", 4, function() {
            text.reflow = function(result) {
                equal(result.y1, paddingBox.y1);
                equal(result.y2, paddingBox.y2);
                equal(result.x1, paddingBox.x1 - 20);
                close(result.x2, paddingBox.x2 - 20, 0.1);
            };
            barLabel.alignToClipBox(Box2D(paddingBox.x1 - 30, 0, paddingBox.x1 - 20, 100));
        });

    })();

    (function() {
        var positiveData = [100, 150],
            negativeData = [-100, -150],
            VALUE_AXIS_MAX = 200,
            CATEGORY_AXIS_Y = 200,
            TOLERANCE = 0.1,
            MARGIN = 10,
            PADDING = 10,
            COLOR = "red",
            BACKGROUND = "blue",
            BORDER = {
                width: 4,
                color: "green",
                dashType: "dot"
            };

        var plotArea = stubPlotArea(
            function(categoryIndex) {
                return new Box2D(categoryIndex, CATEGORY_AXIS_Y,
                                 categoryIndex + 100, CATEGORY_AXIS_Y);
            },
            function(from, to) {
                var fromY = CATEGORY_AXIS_Y + from,
                    toY = CATEGORY_AXIS_Y + to,
                    slotTop = Math.min(fromY, toY),
                    slotBottom = Math.max(fromY, toY);

                return new Box2D(0, slotTop, 0, slotBottom);
            },
            {
                categoryAxis: {}
            }
        );

        // ------------------------------------------------------------
        module("Column Chart / Labels", {
            setup: function() {
                setupBarChart(plotArea, { series: [{
                    data: [10, 0, null],
                    labels: { visible: true }
                }] });
            }
        });

        test("creates labels for 0 values", function() {
            equal(series.points[1].label.children[0].content, "0");
        });

        test("creates empty labels for null values", function() {
            equal(series.points[2].label.children[0].content, "");
        });

        // ------------------------------------------------------------
        module("Column Chart / Labels / Positive Values", {
            setup: function() {
                setupBarChart(plotArea, { series: [{
                    data: positiveData,
                    labels: { position: "insideEnd", visible: true }
                }] });
            }
        });

        test("insideEnd position", function() {
            $.each(series.points, function() {
                var text = this.children[0].children[0];
                equal(this.box.y1, text.box.y1);
                ok(this.box.x1 > text.box.x1 && this.box.x2 < text.box.x2);
            });
        });

        test("insideBase position", function() {
            setupBarChart(plotArea, { series: [{
                data: positiveData,
                labels: {
                    position: "insideBase",
                    visible: true
                }
            }] });
            $.each(series.points, function() {
                var text = this.children[0].children[0];
                equal(this.box.y2, text.box.y2);
                ok(this.box.x1 > text.box.x1 && this.box.x2 < text.box.x2);
            });
        });

        test("outsideEnd position", function() {
            setupBarChart(plotArea, { series: [{
                data: positiveData,
                labels: {
                    position: "outsideEnd",
                    visible: true
                }
            }] });
            $.each(series.points, function() {
                var text = this.children[0].children[0];
                equal(this.box.y1 - text.box.height(), text.box.y1);
                ok(this.box.x1 > text.box.x1 && this.box.x2 < text.box.x2);
            });
        });

        test("center position", function() {
            setupBarChart(plotArea, { series: [{
                data: positiveData,
                labels: {
                    position: "center",
                    visible: true
                }
            }] });
            $.each(series.points, function() {
                var text = this.children[0].children[0],
                    margin = (this.box.height() - text.box.height()) / 2;
                equal(this.box.y1 + margin, text.box.y1);
                ok(this.box.x1 > text.box.x1 && this.box.x2 < text.box.x2);
            });
        });

        test("creates labels with full format", 1, function() {
            setupBarChart(plotArea, { series: [{
                data: positiveData,
                labels: {
                    format: "{0:C}",
                    visible: true
                }
            }] });

            deepEqual($.map(series.points, function(bar) {
                return bar.children[0].children[0].content }
            ), ["$100.00", "$150.00"]);
        });

        test("creates labels with simple format", 1, function() {
            setupBarChart(plotArea, { series: [{
                data: positiveData,
                labels: {
                    format: "C",
                    visible: true
                }
            }] });

            deepEqual($.map(series.points, function(bar) {
                return bar.children[0].children[0].content }
            ), ["$100.00", "$150.00"]);
        });

        test("width equals bar width", function() {
            $.each(series.points, function() {
                var label = this.children[0].children[0];
                equal(label.paddingBox.width(), this.box.width(), 0.1);
            });
        });

        test("labels have zIndex", function() {
            equal(series.points[0].children[0].options.zIndex, 1);
        });

        // ------------------------------------------------------------
        module("Column Chart / Labels / Negative Values", {
            setup: function() {
                setupBarChart(plotArea, { series: [{
                    data: negativeData,
                    labels: { position: "insideEnd", visible: true }
                    }] });
                }
        });

        test("insideEnd position", function() {
            $.each(series.points, function() {
                var text = this.children[0].children[0];
                equal(this.box.y2, text.box.y2);
                ok(this.box.x1 > text.box.x1 && this.box.x2 < text.box.x2);
            });
        });

        test("insideBase position", function() {
            setupBarChart(plotArea, { series: [{
                data: negativeData,
                    labels: {
                    position: "insideBase",
                    visible: true
                }
            }] });
            $.each(series.points, function() {
                var text = this.children[0].children[0];
                equal(this.box.y1, text.box.y1);
                ok(this.box.x1 > text.box.x1 && this.box.x2 < text.box.x2);
            });
        });

        test("outsideEnd position", function() {
            setupBarChart(plotArea, { series: [{
                data: negativeData,
                labels: {
                    position: "outsideEnd",
                    visible: true
                }
            }] });
            $.each(series.points, function() {
                var text = this.children[0].children[0];
                equal(this.box.y2, text.box.y1);
                ok(this.box.x1 > text.box.x1 && this.box.x2 < text.box.x2);
            });
        });

        test("center position", function() {
            setupBarChart(plotArea, { series: [{
                data: negativeData,
                labels: {
                    position: "center",
                    visible: true
                }
            }] });
            $.each(series.points, function() {
                var text = this.children[0].children[0],
                    margin = (this.box.height() - text.box.height()) / 2;
                equal(this.box.y1 + margin, text.box.y1);
                ok(this.box.x1 > text.box.x1 && this.box.x2 < text.box.x2);
            });
        });

        test("format", 1, function() {
            setupBarChart(plotArea, { series: [{
                data: positiveData,
                labels: {
                    format: "{0:C}",
                    visible: true
                }
            }] });

            deepEqual($.map(series.points, function(bar) {
                return bar.children[0].children[0].content }
            ), ["$100.00", "$150.00"]);
        });

        // ------------------------------------------------------------
        module("Column Chart / Labels / Rendering");

        test("color", function() {
            setupBarChart(plotArea, { series: [{
                data: [ 100 ],
                labels: {
                    color: COLOR,
                    visible: true
                }
            }] });
            series.getViewElements(view);
            equal(view.log.text[0].style.color, COLOR);
        });

        test("background color", function() {
            setupBarChart(plotArea, { series: [{
                data: [ 100 ],
                labels: {
                    background: BACKGROUND,
                    visible: true
                }
            }] });
            series.getViewElements(view);
            equal(view.log.rect[1].style.fill, BACKGROUND);
        });

        test("border", function() {
            setupBarChart(plotArea, { series: [{
                data: [ 100 ],
                labels: {
                    border: BORDER,
                    visible: true
                }
            }] });
            series.getViewElements(view);
            equal(view.log.rect[1].style.stroke, BORDER.color);
            equal(view.log.rect[1].style.strokeWidth, BORDER.width);
            equal(view.log.rect[1].style.dashType, BORDER.dashType);
        });

        test("padding and margin", function() {
            setupBarChart(plotArea, { series: [{
                data: [ 100 ],
                labels: {
                    margin: MARGIN,
                    border: { width: 0 },
                    visible: true
                }
            }] });
            series.getViewElements(view);
            var barLabel = series.points[0].children[0].children[0],
                paddingBox = barLabel.paddingBox,
                box = barLabel.box;

            equal(paddingBox.x1 - MARGIN, box.x1);
            equal(paddingBox.x2 + MARGIN, box.x2);
            equal(paddingBox.y1 - MARGIN, box.y1);
            equal(paddingBox.y2 + MARGIN, box.y2);
        });

    })();

    (function() {
        var positiveData = [100, 150],
            negativeData = [-100, -150],
            VALUE_AXIS_MAX = 200,
            CATEGORY_AXIS_X = 200,
            TOLERANCE = 0.1;

        var plotArea = stubPlotArea(
            function(categoryIndex) {
                return new Box2D(CATEGORY_AXIS_X, categoryIndex,
                                 CATEGORY_AXIS_X, categoryIndex + 1);
            },
            function(value) {
                var valueX = CATEGORY_AXIS_X + value,
                    slotLeft = Math.min(CATEGORY_AXIS_X, valueX),
                    slotRight = Math.max(CATEGORY_AXIS_X, valueX);

                return new Box2D(slotLeft, 0, slotRight, 0);
            },
            {
                categoryAxis: {}
            }
        );

        // ------------------------------------------------------------
        module("Bar Chart / Labels / Positive Values", {
            setup: function() {
                view = new ViewStub();
                setupBarChart(plotArea, { series: [{
                    data: positiveData,
                    labels: {
                        visible: true
                    }
                }], invertAxes: true });
            }
        });

        test("insideEnd position", function() {
            setupBarChart(plotArea, { series: [{
                data: positiveData,
                labels: {
                    visible: true,
                    position: "insideEnd"
                }
            }], invertAxes: true });

            $.each(series.points, function() {
                var text = this.children[0].children[0];
                equal(text.box.x1, this.box.x2 - text.box.width());
                ok(this.box.y1 > text.box.y1 && this.box.y2 < text.box.y2);
            });
        });

        test("insideBase position", function() {
            setupBarChart(plotArea, { series: [{
                data: positiveData,
                labels: {
                    position: "insideBase",
                    visible: true
                }
            }], invertAxes: true });
            $.each(series.points, function() {
                var text = this.children[0].children[0];
                equal(text.box.x1, this.box.x1);
                ok(this.box.y1 > text.box.y1 && this.box.y2 < text.box.y2);
            });
        });

        test("outsideEnd position", function() {
            setupBarChart(plotArea, { series: [{
                data: positiveData,
                labels: {
                    position: "outsideEnd",
                    visible: true
                }
            }], invertAxes: true });
            $.each(series.points, function() {
                var text = this.children[0].children[0];
                equal(this.box.x2, text.box.x1);
                ok(this.box.y1 > text.box.y1 && this.box.y2 < text.box.y2);
            });
        });

        test("center position", function() {
            setupBarChart(plotArea, { series: [{
                data: positiveData,
                labels: {
                    position: "center",
                    visible: true
                }
            }], invertAxes: true });
            $.each(series.points, function() {
                var text = this.children[0].children[0],
                margin = (this.box.width() - text.box.width()) / 2;
                equal(this.box.x1 + margin, text.box.x1);
                ok(this.box.y1 > text.box.y1 && this.box.y2 < text.box.y2);
            });
        });

        test("height equals bar height", function() {
            $.each(series.points, function() {
                var label = this.children[0].children[0];
                close(label.paddingBox.height(), this.box.height(), 0.1);
            });
        });

        // ------------------------------------------------------------
        module("Bar Chart / Labels / Negative Values", {
            setup: function() {
                view = new ViewStub();
                setupBarChart(plotArea, { series: [{
                    data: negativeData,
                    labels: {
                        visible: true,
                        position: "insideEnd"
                    }
                }], invertAxes: true });
            }
        });

        test("insideEnd position", function() {
            $.each(series.points, function() {
                var text = this.children[0].children[0];
                equal(this.box.x1, text.box.x1);
                ok(this.box.y1 > text.box.y1 && this.box.y2 < text.box.y2);
            });
        });

        test("insideBase position", function() {
            setupBarChart(plotArea, { series: [{
                data: negativeData,
                labels: {
                    position: "insideBase",
                    visible: true
                }
            }], invertAxes: true });
            $.each(series.points, function() {
                var text = this.children[0].children[0];
                equal(this.box.x2 - text.box.width(), text.box.x1);
                ok(this.box.y1 > text.box.y1 && this.box.y2 < text.box.y2);
            });
        });

        test("outsideEnd position", function() {
            setupBarChart(plotArea, { series: [{
                data: negativeData,
                labels: {
                    position: "outsideEnd",
                    visible: true
                }
            }], invertAxes: true });
            $.each(series.points, function() {
                var text = this.children[0].children[0];
                equal(this.box.x1 - text.box.width(), text.box.x1);
                ok(this.box.y1 > text.box.y1 && this.box.y2 < text.box.y2);
            });
        });

        test("center position", function() {
            setupBarChart(plotArea, { series: [{
                data: negativeData,
                labels: {
                    position: "center",
                    visible: true
                }
            }], invertAxes: true });
            $.each(series.points, function() {
                var text = this.children[0].children[0],
                    margin = (this.box.height() - text.box.height()) / 2;
                equal(this.box.y1 + margin, text.box.y1);
                ok(this.box.y1 > text.box.y1 && this.box.y2 < text.box.y2);
            });
        });
    })();

    (function() {
        var positiveSeries = { data: [1, 2], labels: {} },
            negativeSeries = { data: [-1, -2], labels: {} },
            CATEGORY_AXIS_X = 2,
            TOLERANCE = 0.1;

        var plotArea = stubPlotArea(
            function(categoryIndex) {
                return new Box2D(CATEGORY_AXIS_X, categoryIndex,
                               CATEGORY_AXIS_X, categoryIndex + 1);
            },
            function(from, to) {
                var fromX = CATEGORY_AXIS_X + from,
                    toX = CATEGORY_AXIS_X + to,
                    slotLeft = Math.min(fromX, toX),
                    slotRight = Math.max(fromX, toX);

                return new Box2D(slotLeft, 0, slotRight, 0);
            },
            {
                categoryAxis: {}
            }
        );

        // ------------------------------------------------------------
        module("Bar Chart / Horizontal / Positive Values", {
            setup: function() {
                setupBarChart(plotArea, { invertAxes: true, series: [ positiveSeries ] });
            }
        });

        test("bars are distributed across category axis", function() {
            var barsY = $.map(series.points, function(bar) {
                return bar.box.y1;
            });

            arrayClose(barsY, [0.3, 1.3], TOLERANCE);
        });

        test("bar sides are aligned to category axis", function() {
            var barsX = $.map(series.points, function(bar) {
                return bar.box.x1;
            });

            deepEqual(barsX, [CATEGORY_AXIS_X, CATEGORY_AXIS_X]);
        });

        test("bars have set height", function() {
            $.each(series.points, function() {
                close(this.box.height(), 0.4, TOLERANCE);
            });
        });

        test("bars have set width according to value", function() {
            var barWidths = $.map(series.points, function(bar) {
                return bar.box.width();
            });

            deepEqual(barWidths, [1, 2]);
        });

        // ------------------------------------------------------------
        module("Bar Chart / Horizontal / Negative Values", {
            setup: function() {
                setupBarChart(plotArea, { invertAxes: true, series: [ negativeSeries ] });
            }
        });

        test("Reports minimum value for default axis", function() {
            deepEqual(series.valueAxisRanges[undefined].min, negativeSeries.data[1]);
        });

        test("Reports maximum value for default axis", function() {
            deepEqual(series.valueAxisRanges[undefined].max, negativeSeries.data[0]);
        });

        test("bar sides are aligned to category axis", function() {
            var barsX = $.map(series.points, function(bar) {
                return bar.box.x2;
            });

            deepEqual(barsX, [CATEGORY_AXIS_X, CATEGORY_AXIS_X]);
        });

        test("bars have set width according to value", function() {
            var barWidths = $.map(series.points, function(bar) {
                return bar.box.width();
            });

            deepEqual(barWidths, [1, 2]);
        });

        // ------------------------------------------------------------
        module("Bar Chart / Horizontal / Missing values", {
            setup: function() {
                setupBarChart(plotArea, {
                    invertAxes: true,
                    series: [ { data: [1, 2, 3] },
                              positiveSeries
                        ]
                });
            }
        });

        test("Missing values are represented as bars with zero width", function() {
            var barWidths = $.map(series.points, function(bar) {
                return bar.box.width();
            });

            deepEqual(barWidths, [1, 1, 2, 2, 3, 0]);
        });

        // ------------------------------------------------------------
        module("Bar Chart / Horizontal / Cluster", {
            setup: function() {
                setupBarChart(plotArea,
                    { invertAxes: true,
                      series: [ positiveSeries, negativeSeries ]
                    }
                );
            },
            teardown: destroyChart
        });

        test("bars in first category are clustered", function() {
            equal(series.points[0].box.y2, series.points[1].box.y1);
        });

        // ------------------------------------------------------------
        module("Bar Chart / Horizontal / Stack / Positive Values", {
            setup: function() {
                setupBarChart(plotArea, {
                    invertAxes: true,
                    series: [ positiveSeries, positiveSeries ],
                    isStacked: true }
                );
            },
            teardown: destroyChart
        });

        test("reports 0 as minumum value for default axis", function() {
            equal(series.valueAxisRanges[undefined].min, 0);
        });

        test("reports stacked maximum value for default axis", function() {
            equal(series.valueAxisRanges[undefined].max, 4);
        });

        test("bars in first category are stacked", function() {
            equal(series.points[1].box.x1, series.points[0].box.x2);
        });

        test("bars have set width according to value", function() {
            var barWidths = $.map(series.points, function(bar) {
                return bar.box.width();
            });

            deepEqual(barWidths, [1, 1, 2, 2]);
        });

        test("series have 75% margin", function() {
            close(series.points[0].box.y1, 0.3, TOLERANCE);
        });

        // ------------------------------------------------------------
        module("Bar Chart / Horizontal / Stack / Negative Values", {
            setup: function() {
                setupBarChart(plotArea, {
                    invertAxes: true,
                    series: [ negativeSeries, negativeSeries ],
                    isStacked: true }
                );
            },
            teardown: destroyChart
        });

        test("reports stacked minumum value for default axis", function() {
            equal(series.valueAxisRanges[undefined].min, -4);
        });

        test("reports 0 as maximum value for default axis", function() {
            equal(series.valueAxisRanges[undefined].max, 0);
        });

        test("bars in first category are stacked", function() {
            equal(series.points[1].box.x2, series.points[0].box.x1);
        });

        test("stack sides are aligned to category axis", function() {
            deepEqual([series.points[0].box.x2, series.points[2].box.x2],
                 [CATEGORY_AXIS_X, CATEGORY_AXIS_X]);
        });

        test("bars have set width according to value", function() {
            var barWidths = $.map(series.points, function(bar) {
                return bar.box.width();
            });

            deepEqual(barWidths, [1, 1, 2, 2]);
        });

        // ------------------------------------------------------------
        module("Bar Chart / Horizontal / Stack / Mixed Values", {
            setup: function() {
                setupBarChart(plotArea, {
                    invertAxes: true,
                    series: [ positiveSeries, negativeSeries ],
                    isStacked: true }
                );
            },
            teardown: destroyChart
        });

        test("reports stacked minumum value for default axis", function() {
            equal(series.valueAxisRanges[undefined].min, -2);
        });

        test("reports stacked maximum value for default axis", function() {
            equal(series.valueAxisRanges[undefined].max, 2);
        });

        test("bars have set width according to value", function() {
            var barWidths = $.map(series.points, function(bar) {
                return bar.box.width();
            });

            deepEqual(barWidths, [1, 1, 2, 2]);
        });

    })();

    (function() {
        var barChart;

        var plotArea = stubPlotArea(
            function(categoryIndex) {
                return new Box2D();
            },
            function(value) {
                return new Box2D();
            },
            {
                categoryAxis: {
                    categories: ["A"]
                }
            }
        );

        // ------------------------------------------------------------
        module("Bar Chart / Configuration", {
            setup: function() {
                barChart = new dataviz.BarChart(plotArea, {
                    series: [{
                        data: [0, -1],
                        color: "#f00",
                        negativeColor: "#00f",
                        opacity: 0.5,
                        overlay: "none"
                    }]
                });
            }
        });

        test("applies series fill color to bars", function() {
            equal(barChart.points[0].color, "#f00");
        });

        test("applies series negative fill color to negative bars", function() {
            equal(barChart.points[1].color, "#00f");
        });

        test("applies series opacity color to bars", function() {
            equal(barChart.points[0].options.opacity, 0.5);
        });

        test("applies series overlay to bars", function() {
            equal(barChart.points[0].options.overlay, "none");
        });

        test("applies color function", function() {
            barChart = new dataviz.BarChart(plotArea, {
                series: [{
                    data: [0, 1],
                    color: function(bar) { return "#f00" }
                }]
            });

            equal(barChart.points[0].color, "#f00");
        });

        test("applies color function for each point", 2, function() {
            barChart = new dataviz.BarChart(plotArea, {
                series: [{
                    data: [0, 1],
                    color: function() { ok(true); }
                }]
            });
        });

        test("color fn argument contains value", 1, function() {
            new dataviz.BarChart(plotArea, {
                series: [{
                    data: [1],
                    color: function(bar) { equal(bar.value, 1); }
                }]
            });
        });

        test("color fn argument contains series", 1, function() {
            new dataviz.BarChart(plotArea, {
                series: [{
                    name: "series 1",
                    data: [1],
                    color: function(bar) { equal(bar.series.name, "series 1"); }
                }]
            });
        });

        test("color fn argument contains index", 1, function() {
            new dataviz.BarChart(plotArea, {
                series: [{
                    name: "series 1",
                    data: [1],
                    color: function(bar) { equal(bar.index, 0); }
                }]
            });
        });

    })();

    (function() {
        var cluster,
            bars,
            clusterBox = new Box2D(0, 0, 350, 350),
            barBox = new Box2D(1, 1, 1, 1),
            TOLERANCE = 0.1;

        function createCluster(options) {
            cluster = new dataviz.ClusterLayout(options);
            bars = [ new BarStub(barBox), new BarStub(barBox) ];
            [].push.apply(cluster.children, bars);
            cluster.reflow(clusterBox);
        }

        // ------------------------------------------------------------
        module("Cluster Layout / Horizontal", {
            setup: function() {
                createCluster({ gap: 0 });
            }
        });

        test("distributes width evenly", function() {
            $.each(bars, function() {
                equal(this.box.width(), clusterBox.width() / bars.length)
            });
        });

        test("positions children next to each other", function() {
            $.each(bars, function(index) {
                equal(this.box.x1, this.box.width() * index)
            });
        });

        test("leaves 75% gap on both sides", function() {
            createCluster({ gap: 1.5 });

            equal(bars[0].box.x1, 75);
            equal(bars[1].box.x2, 275);
        });

        test("positions children next to each other with spacing", function() {
            createCluster({ gap: 0, spacing: 1 });
            $.each(bars, function(index) {
                close(this.box.x1, (this.box.width() * 2) * index, TOLERANCE)
            });
        });

        // ------------------------------------------------------------
        module("Cluster Layout / Vertical", {
            setup: function() {
                createCluster({ vertical: true, gap: 0 });
            }
        });

        test("distributes height evenly", function() {
            $.each(bars, function() {
                equal(this.box.height(), clusterBox.height() / bars.length)
            });
        });

        test("positions children below each other", function() {
            $.each(bars, function(index) {
                equal(this.box.y1, this.box.height() * index)
            });
        });

        test("positions children next to each other with spacing", function() {
            createCluster({ vertical: true, gap: 0, spacing: 1 });
            $.each(bars, function(index) {
                close(this.box.y1, (this.box.height() * 2) * index, TOLERANCE)
            });
        });
    })();

    (function() {
        var stack,
            stackBox = new Box2D(50, 50, 100, 100);

        // ------------------------------------------------------------
        module("Stack Wrap / Vertical", {
            setup: function() {
                stack = new dataviz.StackWrap();

                stack.children.push(
                    new BarStub(new Box2D(0, 90, 100, 100)),
                    new BarStub(new Box2D(0, 80, 100, 100)),
                    new BarStub(new Box2D(0, 70, 100, 100))
                );

                stack.reflow(stackBox);
            }
        });

        test("updates children width to fit box", function() {
            equal(stack.children[0].box.width(), stackBox.width());
            equal(stack.children[1].box.width(), stackBox.width());
        });

        test("updates children X position to match targetBox", function() {
            equal(stack.children[0].box.x1, stackBox.x1);
            equal(stack.children[1].box.x1, stackBox.x1);
        });

        // ------------------------------------------------------------
        module("Stack Wrap / Horizontal", {
            setup: function() {
                stack = new dataviz.StackWrap({ vertical: false });
                stack.children.push(
                    new BarStub(new Box2D(0, 0, 20, 10)),
                    new BarStub(new Box2D(0, 0, 30, 10)),
                    new BarStub(new Box2D(0, 0, 40, 10))
                );

                stack.reflow(stackBox);
            }
        });

        test("updates children height to fit box", function() {
            equal(stack.children[0].box.height(), stackBox.height());
            equal(stack.children[1].box.height(), stackBox.height());
        });

        test("updates children Y position to match targetBox", function() {
            equal(stack.children[0].box.y1, stackBox.y1);
            equal(stack.children[1].box.y1, stackBox.y1);
        });

    })();

    (function() {
        var Bar = dataviz.Bar,
            bar,
            label,
            box,
            rect,
            root,
            VALUE = 1,
            CATEGORY = "A",
            SERIES_NAME = "series",
            TOOLTIP_OFFSET = 5;

        function createBar(options, clipBox) {
            box = new Box2D(0, 0, 100, 100);
            bar = new Bar(VALUE, kendo.deepExtend({}, Bar.fn.defaults, options));

            bar.category = CATEGORY;
            bar.dataItem = { value: VALUE };
            bar.percentage = 0.5;
            bar.series = { name: SERIES_NAME };
            bar.owner = {
                pane: {
                    clipBox: function(){
                        return clipBox || new Box2D(0, 0, 100, 100);
                    }
                },
                formatPointValue: function() { return "foo"; }
            };

            root = new dataviz.RootElement();
            root.append(bar);

            bar.reflow(box);
            label = bar.children[0];

            view = new ViewStub();
            bar.getViewElements(view);
            rect = view.log.rect[0];
        }

        // ------------------------------------------------------------
        module("Bar", {
            setup: function() {
                createBar();
            }
        });

        test("sets value", function() {
            equal(bar.value, VALUE);
        });

        test("aboveAxis is true by default", function() {
            equal(bar.aboveAxis, true);
        });

        test("aboveAxis is set from options", function() {
            createBar({ aboveAxis: false });
            equal(bar.aboveAxis, false);
        });

        test("fills target box", function() {
            sameBox(bar.box, box);
        });

        test("renders rectangle", function() {
            sameBox(rect, box);
        });

        test("does not render rectangle when box height is zero", function() {
            bar.reflow(new Box2D(0, 0, 100, 0));

            view = new ViewStub();
            bar.getViewElements(view);

            equal(view.log.rect.length, 0);
        });

        test("does not render rectangle when box width is zero", function() {
            bar.reflow(new Box2D(0, 0, 0, 100));

            view = new ViewStub();
            bar.getViewElements(view);

            equal(view.log.rect.length, 0);
        });

        test("sets fill color", function() {
            deepEqual(rect.style.fill, bar.color);
        });

        test("sets vertical", function() {
            deepEqual(rect.style.vertical, true);
        });

        test("sets aboveAxis", function() {
            deepEqual(rect.style.aboveAxis, true);
        });

        test("sets overlay rotation for vertical bars", function() {
            deepEqual(rect.style.overlay.rotation, 0);
        });

        test("sets same overlay rotation for vertical bars below axis", function() {
            createBar({ aboveAxis: false });
            deepEqual(rect.style.overlay.rotation, 0);
        });

        test("does not set overlay options when no overlay is defined", function() {
            createBar({ overlay: null });
            ok(!rect.style.overlay);
        });

        test("sets default border color based on color", function() {
            createBar({ color: "#cf0" });
            equal(rect.style.stroke, "#a3cc00");
        });

        test("does not change border color if set", function() {
            createBar({ border: { color: "" } });
            equal(view.log.rect[0].style.stroke, "");
        });

        test("sets overlay rotation for horizontal bars", function() {
            createBar({ vertical: false });
            deepEqual(rect.style.overlay.rotation, 90);
        });

        test("sets same overlay rotation for horizontal bars below axis", function() {
            createBar({ vertical: false, aboveAxis: false });
            deepEqual(rect.style.overlay.rotation, 90);
        });

        test("sets stroke color", function() {
            createBar({ border: { color: "red", width: 1 } });
            deepEqual(rect.style.stroke, bar.options.border.color);
        });

        test("sets stroke width", function() {
            createBar({ border: { color: "red", width: 1 } });
            deepEqual(rect.style.strokeWidth, bar.options.border.width);
        });

        test("sets stroke dash type", function() {
            createBar({ border: { color: "red", width: 1, dashType: "dot" } });
            equal(rect.style.dashType, bar.options.border.dashType);
        });

        test("sets stroke opacity", function() {
            createBar({ border: { color: "red", width: 1, opacity: 0.5 } });
            equal(rect.style.strokeOpacity, bar.options.border.opacity);
        });

        test("sets fill opacity", function() {
            createBar({ opacity: 0.5 });
            deepEqual(rect.style.fillOpacity, bar.options.opacity);
        });

        test("sets stroke opacity", function() {
            createBar({ opacity: 0.5 });
            deepEqual(rect.style.strokeOpacity, bar.options.opacity);
        });

        test("is discoverable", function() {
            ok(bar.modelId);
        });

        test("sets id on rect", function() {
            ok(rect.style.id.length > 0);
        });

        test("highlightOverlay returns rect", function() {
            view = new ViewStub();

            bar.highlightOverlay(view);
            equal(view.log.rect.length, 1);
        });

        test("outline element has same model id", function() {
            view = new ViewStub();

            bar.highlightOverlay(view);
            equal(view.log.rect[0].style.data.modelId, bar.modelId);
        });

        test("label has same model id", function() {
            createBar({ labels: { visible: true } });
            equal(label.modelId, bar.modelId);
        });

        test("tooltipAnchor is top right corner / vertical / above axis",
        function() {
            createBar({ vertical: true, aboveAxis: true, isStacked: false });
            var anchor = bar.tooltipAnchor(10, 10);
            deepEqual([anchor.x, anchor.y], [bar.box.x2 + TOOLTIP_OFFSET, bar.box.y1])
        });

        test("tooltipAnchor is top right corner / vertical / above axis / stacked",
        function() {
            createBar({ vertical: true, aboveAxis: true, isStacked: true });
            var anchor = bar.tooltipAnchor(10, 10);
            deepEqual([anchor.x, anchor.y], [bar.box.x2 + TOOLTIP_OFFSET, bar.box.y1])
        });

        test("tooltipAnchor is bottom right corner / vertical / below axis",
        function() {
            createBar({ vertical: true, aboveAxis: false, isStacked: false });
            var anchor = bar.tooltipAnchor(10, 10);
            deepEqual([anchor.x, anchor.y], [bar.box.x2 + TOOLTIP_OFFSET, bar.box.y2 - 10])
        });

        test("tooltipAnchor is bottom right corner / vertical / below axis / stacked",
        function() {
            createBar({ vertical: true, aboveAxis: false, isStacked: true });
            var anchor = bar.tooltipAnchor(10, 10);
            deepEqual([anchor.x, anchor.y], [bar.box.x2 + TOOLTIP_OFFSET, bar.box.y2 - 10])
        });

        test("tooltipAnchor is top right corner / horizontal / above axis",
        function() {
            createBar({ vertical: false, aboveAxis: true, isStacked: false });
            var anchor = bar.tooltipAnchor(10, 10);
            deepEqual([anchor.x, anchor.y], [bar.box.x2 + TOOLTIP_OFFSET, bar.box.y1])
        });

        test("tooltipAnchor is above top right corner / horizontal / above axis / stacked",
        function() {
            createBar({ vertical: false, aboveAxis: true, isStacked: true });
            var anchor = bar.tooltipAnchor(10, 10);
            deepEqual([anchor.x, anchor.y], [bar.box.x2 - 10, bar.box.y1 - 10 - TOOLTIP_OFFSET])
        });

        test("tooltipAnchor is top left corner / horizontal / below axis",
        function() {
            createBar({ vertical: false, aboveAxis: false, isStacked: false });
            var anchor = bar.tooltipAnchor(10, 10);
            deepEqual([anchor.x, anchor.y], [bar.box.x1 - 10 - TOOLTIP_OFFSET, bar.box.y1])
        });

        test("tooltipAnchor is above top left corner / horizontal / below axis / stacked",
        function() {
            createBar({ vertical: false, aboveAxis: false, isStacked: true });
            var anchor = bar.tooltipAnchor(10, 10);
            deepEqual([anchor.x, anchor.y], [bar.box.x1, bar.box.y1 - 10 - TOOLTIP_OFFSET])
        });

        test("tooltipAnchor is limited to the clipbox / horizontal / above axis", function() {
            createBar({ vertical: false, aboveAxis: true }, Box2D(1,1, 40, 100));
            var anchor = bar.tooltipAnchor(10, 10);
            equal(anchor.x, 40 + TOOLTIP_OFFSET);
        });

        test("tooltipAnchor is limited to the clipbox / vertical / above axis", function() {
            createBar({ vertical: true, aboveAxis: true}, Box2D(1, 40, 100, 100));
            var anchor = bar.tooltipAnchor(10, 10);
            equal(anchor.y, 40);
        });

        test("tooltipAnchor is limited to the clipbox / horizontal / below axis", function() {
            createBar({ vertical: false, aboveAxis: false}, Box2D(40,1, 100, 100));
            var anchor = bar.tooltipAnchor(10, 10);
            equal(anchor.x, 30 - TOOLTIP_OFFSET);
        });

        test("tooltipAnchor is limited to the clipbox / vertical / below axis", function() {
            createBar({ vertical: true, aboveAxis: false}, Box2D(1, 1, 100, 40));
            var anchor = bar.tooltipAnchor(10, 10);
            equal(anchor.y, 30);
        });

        // ------------------------------------------------------------
        module("Bar / Labels / Template");

        function assertTemplate(template, value, format) {
            createBar({ labels: { visible: true, template: template, format: format } });
            equal(label.children[0].content, value);
        }

        test("renders template", function() {
            assertTemplate("${value}%", VALUE + "%");
        });

        test("renders template even when format is set", function() {
            assertTemplate("${value}%", VALUE + "%", "{0:C}");
        });

        test("template has category", function() {
            assertTemplate("${category}", CATEGORY);
        });

        test("template has percentage", function() {
            assertTemplate("${percentage}", "0.5");
        });

        test("template has dataItem", function() {
            assertTemplate("${dataItem.value}", VALUE);
        });

        test("template has series", function() {
            assertTemplate("${series.name}", SERIES_NAME);
        });

    })();

    (function() {
        var data = [{
                name: "Category A",
                text: "Alpha",
                value: 10,
                color: "red"
            },{
                name: "Category B",
                text: "Alpha",
                value: 10,
                color: null
            }],
            points,
            chart,
            label;

        function setupChart(options) {
            chart = createChart({
                dataSource: {
                    data: data
                },
                seriesDefaults: {
                    labels: {
                        visible: true,
                        template: "${dataItem.text}"
                    }
                },
                series: [{
                    name: "Value",
                    type: "bar",
                    field: "value",
                    colorField: "color"
                }],
                categoryAxis: {
                    field: "name"
                }
            });

            points = chart._plotArea.charts[0].points;
            label = points[0].children[0];
        }

        // ------------------------------------------------------------
        module("Bar Chart / Data Binding", {
            setup: function() {
                setupChart();
            },
            teardown: function() {
                destroyChart();
            }
        });

        test("point color bound to color field", function() {
            equal(points[0].color, "red");
        });

        test("point color not bound to null color field", function() {
            equal(points[1].color, "#ff6800");
        });

        test("dataItem sent to label template", function() {
            equal(label.children[0].content, "Alpha");
        });

    })();

    (function() {
        var chart,
            bar,
            barElement,
            plotArea;

        function createBarChart(options) {
            chart = createChart($.extend({
                series: [{
                    type: "bar",
                    data: [1]
                }],
                categoryAxis: {
                    categories: ["A"]
                }
            }, options));

            plotArea = chart._model.children[1];
            bar = plotArea.charts[0].points[0];
            barElement = $(getElement(bar.id));
        }

        function barClick(callback) {
            createBarChart({
                seriesClick: callback
            });

            clickChart(chart, barElement);
        }

        function barHover(callback) {
            createBarChart({
                seriesHover: callback
            });

            barElement.mouseover();
        }

        // ------------------------------------------------------------
        module("Bar Chart / Events / seriesClick", {
            teardown: function() {
                destroyChart();
            }
        });

        test("fires when clicking bars", function() {
            barClick(function() { ok(true); });
        });

        test("fires on subsequent click", 2, function() {
            barClick(function() { ok(true); });
            clickChart(chart, barElement);
        });

        test("fires when clicking bar labels", function() {
            createBarChart({
                seriesDefaults: {
                    bar: {
                        labels: {
                            visible: true
                        }
                    }
                },
                seriesClick: function() { ok(true); }
            });
            var label = plotArea.charts[0].points[0].children[0];

            clickChart(chart, getElement(label.id));
        });

        test("event arguments contain value", function() {
            barClick(function(e) { equal(e.value, 1); });
        });

        test("event arguments contain percentage", function() {
            createBarChart({
                seriesDefaults: {
                    type: "bar",
                    stack: { type: "100%" }
                },
                series: [{ data: [1] }, { data: [2] }],
                seriesClick: function(e) { equal(e.percentage, 1/3); }
            });
            clickChart(chart, barElement);
        });

        test("event arguments contain category", function() {
            barClick(function(e) { equal(e.category, "A"); });
        });

        test("event arguments contain series", function() {
            barClick(function(e) {
                deepEqual(e.series, chart.options.series[0]);
            });
        });

        test("event arguments contain jQuery element", function() {
            barClick(function(e) {
                equal(e.element[0], getElement(bar.id));
            });
        });

        // ------------------------------------------------------------
        module("Bar Chart / Events / seriesHover", {
            teardown: function() {
                destroyChart();
            }
        });

        test("fires when hovering bars", function() {
            barHover(function() { ok(true); });
        });

        test("fires on tap", 1, function() {
            createBarChart({
                seriesHover: function() {
                    ok(true);
                }
            });

            clickChart(chart, barElement);
        });

        test("does not fire on subsequent tap", function() {
            createBarChart({
                seriesHover: function() {
                    ok(true);
                }
            });

            clickChart(chart, barElement);
            clickChart(chart, barElement);
        });

        test("fires when hovering bar labels", function() {
            createBarChart({
                seriesDefaults: {
                    bar: {
                        labels: {
                            visible: true
                        }
                    }
                },
                seriesHover: function() { ok(true); }
            });
            var label = plotArea.charts[0].points[0].children[0];
            $(getElement(label.id)).mouseover();
        });

        test("event arguments contain value", function() {
            barHover(function(e) { equal(e.value, 1); });
        });

        test("event arguments contain percentage", function() {
            createBarChart({
                seriesDefaults: {
                    type: "bar",
                    stack: { type: "100%" }
                },
                series: [{ data: [1] }, { data: [2] }],
                seriesHover: function(e) { equal(e.percentage, 1/3); }
            });
            barElement.mouseover();
        });

        test("event arguments contain category", function() {
            barHover(function(e) { equal(e.category, "A"); });
        });

        test("event arguments contain series", function() {
            barHover(function(e) {
                deepEqual(e.series, chart.options.series[0]);
            });
        });

        test("event arguments contain jQuery element", function() {
            barHover(function(e) {
                equal(e.element[0], getElement(bar.id));
            });
        });
    })();

    (function() {
        var deepExtend = kendo.deepExtend;
        var box = new dataviz.Box2D(0, 0, 800, 600);
        var plotArea;
        var chart;

        function createChart(series, options) {
            plotArea = new dataviz.CategoricalPlotArea([]);
            chart = new dataviz.BarChart(plotArea, deepExtend({ series: series }, options));
        }

        // ------------------------------------------------------------
        module("Bar Chart  / Plot range / Positive values", {
            setup: function() {
                createChart([{ data: [1] }]);
            }
        });

        test("from axis to value", function() {
            deepEqual(chart.plotRange(chart.points[0]), [0, 1]);
        });

        // ------------------------------------------------------------
        module("Bar Chart  / Plot range / Negative values", {
            setup: function() {
                createChart([{ data: [-1] }]);
            }
        });

        test("from axis to value", function() {
            deepEqual(chart.plotRange(chart.points[0]), [0, -1]);
        });

        // ------------------------------------------------------------
        module("Bar Chart  / Plot range / Stack / Configuration");

        test("first series set to stack: true", function() {
            createChart([{ data: [1], stack: true }, { data: [2] }],
                         { isStacked: true });
            deepEqual(chart.plotRange(chart.points[1]), [1, 3]);
        });

        test("all series set to stack: true", function() {
            createChart([{ data: [1], stack: true }, { data: [2], stack: true }],
                         { isStacked: true });
            deepEqual(chart.plotRange(chart.points[1]), [1, 3]);
        });

        // ------------------------------------------------------------
        module("Bar Chart  / Plot range / Stack / Positive values", {
            setup: function() {
                createChart([{ data: [1] }, { data: [2] }],
                             { isStacked: true });
            }
        });

        test("from axis to value", function() {
            deepEqual(chart.plotRange(chart.points[0]), [0, 1]);
        });

        test("from prev point to value", function() {
            deepEqual(chart.plotRange(chart.points[1]), [1, 3]);
        });

        // ------------------------------------------------------------
        module("Bar Chart  / Plot range / Stack / Negative values", {
            setup: function() {
                createChart([{ data: [-1] }, { data: [-2] }],
                             { isStacked: true });
            }
        });

        test("from axis to value", function() {
            deepEqual(chart.plotRange(chart.points[0]), [0, -1]);
        });

        test("from prev point to value", function() {
            deepEqual(chart.plotRange(chart.points[1]), [-1, -3]);
        });

        // ------------------------------------------------------------
        module("Bar Chart  / Plot range / Stack / Mixed values", {
            setup: function() {
                createChart([{ data: [1] }, { data: [-1] }],
                             { isStacked: true });
            }
        });

        test("from axis to positive value", function() {
            deepEqual(chart.plotRange(chart.points[0]), [0, 1]);
        });

        test("from axis to negative value", function() {
            deepEqual(chart.plotRange(chart.points[1]), [0, -1]);
        });

        // ------------------------------------------------------------
        function assertMultipleStacksPositive() {
            test("first stack, from axis to value", function() {
                deepEqual(chart.plotRange(chart.points[0]), [0, 1]);
            });

            test("first stack, from prev point to value", function() {
                deepEqual(chart.plotRange(chart.points[1]), [1, 3]);
            });

            test("second stack, from axis to value", function() {
                deepEqual(chart.plotRange(chart.points[2]), [0, 3]);
            });

            test("second stack, from prev point to value", function() {
                deepEqual(chart.plotRange(chart.points[3]), [3, 7]);
            });
        }

        module("Bar Chart  / Plot range / Multiple Stacks / Positive values", {
            setup: function() {
                createChart([{ data: [1], stack: "a" }, { data: [2], stack: "a" },
                             { data: [3], stack: "b" }, { data: [4], stack: "b" }],
                             { isStacked: true });
            }
        });
        assertMultipleStacksPositive();

        module("Bar Chart  / Plot range / Multiple Stacks (group syntax) / Positive values", {
            setup: function() {
                createChart([{ data: [1], stack: { group: "a" } },
                             { data: [2], stack: { group: "a" } },
                             { data: [3], stack: { group: "b" } },
                             { data: [4], stack: { group: "b" } }],
                             { isStacked: true });
            }
        });
        assertMultipleStacksPositive();

        // ------------------------------------------------------------
        function assertMultipleStacksNegative() {
            test("first stack, from axis to value", function() {
                deepEqual(chart.plotRange(chart.points[0]), [0, -1]);
            });

            test("first stack, from prev point to value", function() {
                deepEqual(chart.plotRange(chart.points[1]), [-1, -3]);
            });

            test("second stack, from axis to value", function() {
                deepEqual(chart.plotRange(chart.points[2]), [0, -3]);
            });

            test("second stack, from prev point to value", function() {
                deepEqual(chart.plotRange(chart.points[3]), [-3, -7]);
            });
        }

        module("Bar Chart  / Plot range / Multiple Stacks / Negative values", {
            setup: function() {
                createChart([{ data: [-1], stack: "a" }, { data: [-2], stack: "a" },
                             { data: [-3], stack: "b" }, { data: [-4], stack: "b" }],
                             { isStacked: true });
            }
        });
        assertMultipleStacksNegative();

        module("Bar Chart  / Plot range / Multiple Stacks (group syntax) / Negative values", {
            setup: function() {
                createChart([{ data: [-1], stack: { group: "a" } },
                             { data: [-2], stack: { group: "a" } },
                             { data: [-3], stack: { group: "b" } },
                             { data: [-4], stack: { group: "b" } }],
                             { isStacked: true });
            }
        });
        assertMultipleStacksNegative();

        // ------------------------------------------------------------
        module("Bar Chart  / Plot range / Stack 100% / Positive values", {
            setup: function() {
                createChart([{ data: [1] }, { data: [3] }],
                             { isStacked: true, isStacked100: true });
            }
        });

        test("from axis to value", function() {
            deepEqual(chart.plotRange(chart.points[0]), [0, 0.25]);
        });

        test("from prev point to value", function() {
            deepEqual(chart.plotRange(chart.points[1]), [0.25, 1]);
        });

        // ------------------------------------------------------------
        module("Bar Chart  / Plot range / Stack 100% / Negative values", {
            setup: function() {
                createChart([{ data: [-1] }, { data: [-3] }],
                             { isStacked: true, isStacked100: true });
            }
        });

        test("from axis to value", function() {
            deepEqual(chart.plotRange(chart.points[0]), [0, -0.25]);
        });

        test("from prev point to value", function() {
            deepEqual(chart.plotRange(chart.points[1]), [-0.25, -1]);
        });

        // ------------------------------------------------------------
        module("Bar Chart  / Plot range / Stack 100% / Mixed values", {
            setup: function() {
                createChart([{ data: [1] }, { data: [-3] }],
                             { isStacked: true, isStacked100: true });
            }
        });

        test("from axis to value", function() {
            deepEqual(chart.plotRange(chart.points[0]), [0, 0.25]);
        });

        test("from prev point to value", function() {
            deepEqual(chart.plotRange(chart.points[1]), [0, -0.75]);
        });

        // ------------------------------------------------------------
        module("Bar Chart  / Plot range / Stack 100% / Missing values", {
            setup: function() {
                createChart([{ data: [undefined] }, { data: [1] }],
                             { isStacked: true, isStacked100: true });
            }
        });

        test("from prev point to value", function() {
            deepEqual(chart.plotRange(chart.points[1]), [0, 1]);
        });

        // ------------------------------------------------------------
        module("Bar Chart  / Plot range / Multiple 100% Stacks / Positive values", {
            setup: function() {
                createChart([
                    { data: [1], stack: { type: "100%", group: "a" } },
                    { data: [3], stack: { type: "100%", group: "a" } },
                    { data: [2], stack: { type: "100%", group: "b" } },
                    { data: [6], stack: { type: "100%", group: "b" } }],
                    { isStacked: true, isStacked100: true });
            }
        });

        test("first stack, from axis to value", function() {
            deepEqual(chart.plotRange(chart.points[0]), [0, 0.25]);
        });

        test("first stack, from prev point to value", function() {
            deepEqual(chart.plotRange(chart.points[1]), [0.25, 1]);
        });

        test("second stack, from axis to value", function() {
            deepEqual(chart.plotRange(chart.points[2]), [0, 0.25]);
        });

        test("second stack, from prev point to value", function() {
            deepEqual(chart.plotRange(chart.points[3]), [0.25, 1]);
        });

        // ------------------------------------------------------------
        module("Bar Chart  / Plot range / Multiple 100% Stacks / Negative values", {
            setup: function() {
                createChart([
                    { data: [-1], stack: { type: "100%", group: "a" } },
                    { data: [-3], stack: { type: "100%", group: "a" } },
                    { data: [-2], stack: { type: "100%", group: "b" } },
                    { data: [-6], stack: { type: "100%", group: "b" } }],
                    { isStacked: true, isStacked100: true });
            }
        });

        test("first stack, from axis to value", function() {
            deepEqual(chart.plotRange(chart.points[0]), [0, -0.25]);
        });

        test("first stack, from prev point to value", function() {
            deepEqual(chart.plotRange(chart.points[1]), [-0.25, -1]);
        });

        test("second stack, from axis to value", function() {
            deepEqual(chart.plotRange(chart.points[2]), [-0, -0.25]);
        });

        test("second stack, from prev point to value", function() {
            deepEqual(chart.plotRange(chart.points[3]), [-0.25, -1]);
        });
    })();
})();
