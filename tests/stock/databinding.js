(function() {
    var dataviz = kendo.dataviz,
        deepExtend = kendo.deepExtend,
        Navigator = dataviz.Navigator,
        Chart = dataviz.ui.Chart,
        StockChart = dataviz.ui.StockChart;

    (function() {
        var chart,
            plotArea,
            defaultOptions = {
                dataSource: {
                    data: [{
                            date: new Date("2012/09/01"),
                            sales: 100
                        }, {
                            date: new Date("2012/09/02"),
                            sales: 110
                        }, {
                            date: new Date("2012/09/03"),
                            sales: 105
                        }, {
                            date: new Date("2012/09/04"),
                            sales: 100
                        }, {
                            date: new Date("2012/09/05"),
                            sales: 110
                        }, {
                            date: new Date("2012/09/06"),
                            sales: 105
                        }],
                        serverFiltering: true
                },
                dateField: "date",
                navigator: {
                    dataSource: {
                        data: [{
                            date: new Date("2012/09/01"),
                            volume: 100
                        }, {
                            date: new Date("2012/10/01"),
                            volume: 150
                        }, {
                            date: new Date("2012/11/01"),
                            volume: 200
                        }]
                    }
                }
            };

        function createStockChart(options) {
            var div = $("<div id='container' />").appendTo(QUnit.fixture);
            chart = div.kendoStockChart(deepExtend({
                series: [{
                    field: "sales"
                }],
                navigator: {
                    series: [{
                        field: "volume"
                    }]
                }
            }, defaultOptions, options)).data("kendoStockChart");
        }

        function destroyChart() {
            var element = $("#container");
            kendo.destroy(element);
            element.unbind().empty();
        }

        // ------------------------------------------------------------
        module("Data Binding", {
            setup: function() {
                createStockChart({
                    navigator: {
                        dataSource: null
                    }
                });
            },
            teardown: destroyChart
        });

        test("navigator series are bound to the chart data source", function() {
            equal(chart.options.series[1].data.length, 6);
        });

        test("navigator axis is bound to the chart data source", function() {
            equal(chart.options.categoryAxis[1].categories.length, 6);
            equal(chart.options.categoryAxis[2].categories.length, 6);
            equal(chart.options.categoryAxis[3].categories.length, 6);
        });

        test("slave axis min is set to selected range start", function() {
            createStockChart({
                navigator: {
                    dataSource: null,
                    select: {
                        from: new Date("2012/09/04")
                    }
                }
            });

            deepEqual(chart.options.categoryAxis[0].min, new Date("2012/09/04"));
        });

        test("slave axis max is set to selected range end", function() {
            createStockChart({
                navigator: {
                    dataSource: null,
                    select: {
                        to: new Date("2012/09/04")
                    }
                }
            });

            deepEqual(chart.options.categoryAxis[0].max, new Date("2012/09/04"));
        });

        test("navigator redrawn on main DS change", 2, function() {
            stubMethod(Navigator.fn, "_redrawSelf", function() {
                ok(true);
            }, function() {
                createStockChart({
                    autoBind: false,
                    navigator: {
                        dataSource: null
                    }
                });
                chart.dataSource.fetch();
            });
        });

        test("slaves redrawn fully on main DS change", 2, function() {
            stubMethod(Chart.fn, "_redraw", function() {
                ok(true);
                Chart.fn._stubbed._redraw.call(this);
            }, function() {
                createStockChart({
                    autoBind: false,
                    navigator: {
                        dataSource: null
                    }
                });
                chart.dataSource.fetch();
            });
        });

        // ------------------------------------------------------------
        module("Data Binding / With Navigator Data Source", {
            setup: function() {
                createStockChart();
            },
            teardown: destroyChart
        });

        test("data source is created", function() {
            ok(chart._navigator.dataSource);
        });

        test("regular series are bound from the chart data source", function() {
            equal(chart.options.series[0].data.length, 6);
        });

        test("navigator series are excluded from main data binding", function() {
            equal(chart.options.series[1].autoBind, false);
        });

        test("navigator series are bound from its data source", function() {
            equal(chart.options.series[1].data.length, 3);
        });

        test("regular axes are bound from the chart data source", function() {
            equal(chart.options.categoryAxis[0].categories.length, 6);
        });

        test("navigator axes are excluded from main data binding", function() {
            equal(chart.options.categoryAxis[1].autoBind, false);
            equal(chart.options.categoryAxis[2].autoBind, false);
            equal(chart.options.categoryAxis[3].autoBind, false);
        });

        test("navigator axes are bound to the chart data source", function() {
            equal(chart.options.categoryAxis[1].categories.length, 3);
            equal(chart.options.categoryAxis[2].categories.length, 3);
            equal(chart.options.categoryAxis[3].categories.length, 3);
        });

        asyncTest("data binding is not performed when autoBind is false", function() {
            createStockChart({
                navigator: {
                    autoBind: false
                }
            });

            setTimeout(function() {
                equal(chart.options.series[1].data.length, 0);
                start();
            }, 50);
        });

        test("navigator filters main data source (from - 1BU)", function() {
            createStockChart({
                navigator: {
                    select: {
                        from: "2012/01/02",
                        to: "2012/03/01"
                    }
                }
            });

            deepEqual(chart.dataSource._filter.filters[0].value, new Date("2012/01/01"));
        });

        test("navigator filters main data source (to)", function() {
            createStockChart({
                navigator: {
                    select: {
                        from: "2012/01/02",
                        to: "2012/01/02"
                    }
                }
            });

            deepEqual(chart.dataSource._filter.filters[0].value, new Date("2012/01/02"));
        });

        test("navigator does not filter main data source when from is missing", function() {
            createStockChart({
                navigator: {
                    select: {
                        from: null,
                        to: "2012/01/02"
                    }
                }
            });

            ok(!chart.dataSource._filter);
        });

        test("navigator does not filter main data source when to is missing", function() {
            createStockChart({
                navigator: {
                    select: {
                        from: "2012/01/02",
                        to: null
                    }
                }
            });

            ok(!chart.dataSource._filter);
        });

        test("navigator does not filter main data source w/o server filtering", function() {
            createStockChart({
                dataSource: {
                    serverFiltering: false
                },
                navigator: {
                    select: {
                        from: "2012/01/02",
                        to: "2012/02/02"
                    }
                }
            });

            ok(!chart.dataSource._filter);
        });

        test("navigator preserves existing filters", function() {
            createStockChart({
                dataSource: {
                    filter: {
                        field: "Sales", operator: "gt", value: 100
                    }
                },
                navigator: {
                    select: {
                        from: "2012/01/01",
                        to: "2012/01/02"
                    }
                }
            });

            deepEqual(chart.dataSource._filter.filters[0].value, new Date("2012/01/01"));
            deepEqual(chart.dataSource._filter.filters[1].value, new Date("2012/01/02"));
            deepEqual(chart.dataSource._filter.filters[2].value, 100);
        });

        test("slave panes are redrawn on main DS change", 1, function() {
            stubMethod(Navigator.fn, "redrawSlaves", function() {
                ok(true);
            }, function() {
                createStockChart({
                    autoBind: false
                });
                chart.dataSource.fetch();
            });
        });

        test("navigator is redrawn partially during navigator DS change", 2, function() {
            stubMethod(Navigator.fn, "_redrawSelf", function() {
                ok(true);
            }, function() {
                createStockChart();
                chart._navigator.dataSource.fetch();
            });
        });

        test("navigator is redrawn during navigator DS change (unbound chart)", 3, function() {
            var partialRedrawCalls = 0,
                redrawCalls = 0;

            stubMethod(Navigator.fn, "_redrawSelf", function() {
                ok(++partialRedrawCalls <= 2, "Expected two navigator redraws");
            }, function() {
                stubMethod(Chart.fn, "_redraw", function() {
                    ok(++redrawCalls === 1, "Too many redraws");
                    Chart.fn._stubbed._redraw.call(this);
                }, function() {
                    createStockChart({
                        dataSource: null
                    });
                    chart._navigator.dataSource.fetch();
                });
            });
        });

        test("slave panes are not redrawn during early navigator DS change", 0, function() {
            stubMethod(Navigator.fn, "_redrawSlaves", function(silent) {
                ok(false);
            }, function() {
                createStockChart({
                    autoBind: false,
                    navigator: {
                        autoBind: false
                    }
                });
                chart._navigator.dataSource.fetch();
            });
        });

        // ------------------------------------------------------------
        module("Data Binding / With Navigator Data Source / Zoom", {
            setup: function() {
                createStockChart({
                    dataSource: {
                        transport: {
                            read: {
                                url: ""
                            }
                        }
                    }
                });
            },
            teardown: destroyChart
        });

        test("main DS is filtered during zoomEnd", function() {
            chart.trigger("zoom", {
                originalEvent: {
                    preventDefault: function() {}
                },
                delta: -1
            });

            chart.trigger("zoomEnd");
            deepEqual(chart.dataSource._filter.filters[0].value, new Date("2012/08/30"));
            deepEqual(chart.dataSource._filter.filters[1].value, new Date("2012/11/05"));
        });

        test("main DS is not filtered during zoom", function() {
            chart.trigger("zoom", {
                originalEvent: {
                    preventDefault: function() {}
                },
                delta: -1
            });

            deepEqual(chart.dataSource._filter, undefined);
        });
    })();
})();
