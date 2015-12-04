define(["jquery", "qlik"], function ($, qlik) {
    'use strict';
    var app = qlik.currApp(this);
    var currentSheet;
    var appLayout = {};

    function getSource(sourceType) {
        var deferred = $.Deferred();

        app.getAppObjectList(sourceType, function (list) {
            var objList = [];

            $.each(list.qAppObjectList.qItems, function (sk, sheet) {
                objList.push({label: sheet.qMeta.title, value: sheet.qInfo.qId});

                appLayout[sheet.qInfo.qId] = {label: sheet.qMeta.title, value: sheet.qInfo.qId, charts: []};

                $.each(sheet.qData.cells, function (key, chart) {
                    app.getObjectProperties(chart.name).then(function (model) {
                        appLayout[sheet.qInfo.qId].charts.push({label: model.properties.title, value: chart.name});
                    });
                });

            });
            deferred.resolve(objList);
        });

        return deferred;
    }

    function getCharts(SheetID) {
        var deferred = $.Deferred();
        var chartList = [];

        if (SheetID) {

            app.getObjectProperties(SheetID).then(function (model) {
                var queue = [];
                $.each(model.properties.cells, function (key, chart) {
                    var d = $.Deferred();
                    queue.push(d);

                    app.getObjectProperties(chart.name).then(function (model) {
                        chartList.push({label: model.properties.title, value: chart.name});
                        d.resolve();
                    });
                });

                $.when.apply($, queue).then(function () {
                    deferred.resolve(chartList);
                });

            });
        } else {
            deferred.resolve([]);
        }
        return deferred;
    }

    return {
        initialProperties: {
            version: 1.0,
            qHyperCubeDef: {
                qDimensions: [],
                qMeasures: [],
                qInitialDataFetch: [
                    {
                        qWidth: 2,
                        qHeight: 50
                    }
                ]
            }
        },
        //property panel

        definition: {
            type: "items",
            component: "accordion",
            items: {
                Data: {
                    label: "Data Source",
                    items: {
                        Sheets: {
                            type: "string",
                            component: "dropdown",
                            label: "Sheet",
                            ref: "qontainer.sheet",
                            options: function () {
                                return getSource('sheet').then(function (items) {
                                    return items.map(function (item) {
                                        return {
                                            value: item.value,
                                            label: item.label
                                        };
                                    });
                                });
                            }
                        },


                        Charts: {
                            type: "string",
                            component: "dropdown",
                            label: "Chart",
                            ref: "qontainer.chart",
                            options: function () {
                                return getCharts(currentSheet).then(function (items) {
                                    return items.map(function (item) {
                                        return {
                                            value: item.value,
                                            label: item.label
                                        };
                                    });
                                });
                            }
                        }
                    }
                }
            }
        },


        snapshot: {
            canTakeSnapshot: true
        },

        paint: function ($element, layout) {
            //console.log(layout.myproperties.datasource);
            currentSheet = layout.qontainer.sheet;
            //console.log( appLayout[currentSheet]);

            var objId = layout.qontainer.chart;
            if (objId) {
                app.getObject($element, objId);
            }

            //app.getObjectProperties(currentSheet).then(function(model){console.log(model)});


            //add your rendering code here
            /*
             var self = this, html = "<div>",
             dimensions = layout.qHyperCube.qDimensionInfo,
             matrix = layout.qHyperCube.qDataPages[0].qMatrix;
             if ( dimensions && dimensions.length > 0 ) {
             matrix.forEach(function ( row ) {
             html += "<div class='selectable' ' data-value='" + row[0].qElemNumber + "'>";
             html += row[0].qText + ": " + row[1].qText;
             html += "</div>";
             } );
             }
             html += "</div>";
             $element.html( html );
             if ( this.selectionsEnabled ) {
             $element.find( '.selectable' ).on( 'qv-activate', function () {
             if ( this.hasAttribute( "data-value" ) ) {
             var value = parseInt( this.getAttribute( "data-value" ), 10 ), dim = 0;
             self.selectValues( dim, [value], true );
             $( this ).toggleClass( "selected" );
             }
             } );
             }*/
        }
    };

});
