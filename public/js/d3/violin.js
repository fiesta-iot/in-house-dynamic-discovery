 var chart1;

 function ViolinPlot(input) {

     // Flush the chart every time the function is called
     // d3.select("svg").remove();
     $("#violin-chart").html("");

     chart1 = makeDistroChart({
         data: input.items,
         xName: 'qk',
         yName: 'value',
         axisLabels: {
             xAxis: null,
             yAxis: 'Values'
         },
         selector: "#violin-chart",
         chartSize: {
             height: 400,
             width: 1000
         },
         constrainExtremes: true
     });
     chart1.renderBoxPlot();
     chart1.renderDataPlots();
     chart1.renderNotchBoxes({
         showNotchBox: false
     });
     chart1.renderViolinPlot({
         showViolinPlot: false
     });     
 }