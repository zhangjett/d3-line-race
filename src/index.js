import './style.css';
import * as d3 from "d3";

let margin = {top: 90, right: 120, bottom: 30, left: 50},
    width = 1200 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

let speed = 2000;

let data;

let chart = function () {
    let x = d3.scaleLinear()
        .range([0, width]);

    let y = d3.scaleLinear()
        .range([height, 0]);

    let xAxis = d3.axisTop()
        .scale(x)
        .tickSize(0)
        .ticks(25);

    let xtickLabels = ["Dec 28, 2014","Jan 4, 2015","Jan 11, 2015","Jan 18, 2015","Jan 25, 2015","Feb 1,2015","Feb 8, 2015","Feb 15, 2015","Feb 22, 2015","Mar 1, 2015","Mar 8, 2015","Mar 15, 2015","Mar 22, 2015","Mar 29, 2015","Apr 5, 2015","Apr 12, 2015","Apr 19, 2015","Apr 26, 2015","May 3, 2015","May 10, 2015","May 17, 2015","May 24, 2015","May 31, 2015","Jun 7, 2015","Jun 14, 2015"];

    xAxis.tickFormat(function(d,i){
        return xtickLabels[i]
    });

    let yAxis = d3.axisLeft()
        .scale(y)
        .tickFormat(function(d) { return d;})
        .ticks(16)
        .tickSizeInner(- width)
        .tickPadding(10)
        .tickSizeOuter(0);

    let line = d3.line()
        .x(function(d) { return x(d.week); })
        .y(function(d) { return y(d.rank); })
        .curve(d3.curveBasis);

    let svg = d3.select("#graphic").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .call(responsiveFy)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    let clip = svg.append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("x","-5")
        .attr("y","-20")
        .attr("width", 0)
        .attr("height", height*1.2);

    // var color = d3.scale.category20();
    let color = d3.scaleOrdinal(d3.schemeCategory10);

    color.domain(d3.keys(data[0]).filter(function(key) { return key !== "week"; }));

    data.forEach(function(d) {
        d.week = +[d.week];
    });

    let candidates = color.domain().map(function(name) {
        return {
            name: name,
            values: data.map(function(d) {
                return {name:name, week: d.week, rank: +d[name]};
            })
        };
    });

    x.domain(d3.extent(data, function(d) { return d.week; }));

    y.domain([
        d3.min(candidates, function(c) { return d3.min(c.values, function(v) { return v.rank ; }); }),
        d3.max(candidates, function(c) { return d3.max(c.values, function(v) { return v.rank ; }); })
    ].reverse());

    console.log([
        d3.min(candidates, function(c) { return d3.min(c.values, function(v) { return v.rank ; }); }),
        d3.max(candidates, function(c) { return d3.max(c.values, function(v) { return v.rank ; }); })
    ].reverse());

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform","translate(0,0)")
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor","start")
        .attr("dx", "2.3em")
        .attr("dy", "-0.9em")
        .attr("transform",function(d){
            return "rotate(-60)"});

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    //timeline
    svg.append("line")
        .attr(
            {
                "class":"horizontalGrid",
                "x1" : -2,
                "x2" : width,
                "y1" : y(1) - 13,
                "y2" : y(1) - 13,
                "fill" : "none",
                "shape-rendering" : "crispEdges",
                "stroke" : "#e0e1e1",
                "stroke-width" : "1px",
                "stroke-dasharray": ("3, 3"),
                "id": "dotted",
                "clip-path": function(d) { return "url(#clip)"; }
            });
    //end of timeline
    candidates = svg.selectAll(".candidate")
        .data(candidates)
        .enter().append("g")
        .attr("class", "candidate");

    let path = svg.selectAll(".candidate").append("path")
        .attr("class", "line")
        .attr("d", function(d) {
            return line(d.values);
        })
        .attr("clip-path", function(d) { return "url(#clip)"; })
        .style("stroke", colorFilter);

    let circleStart = candidates.append("circle")
        .attr("cx", "0")
        .attr("cy", function(d) { return y(d.values[0].rank); })
        .style("fill", colorFilter)
        .attr("r", 2);

    let circleEnd = candidates.append("circle")
        .attr("cx", function(d) { return x(d.values[0].week); })
        .attr("cy", function(d) { return y(d.values[0].rank);} )
        .style("fill", colorFilter)
        .attr("r", 2);


    let timeMark = candidates.append("path")
        .attr("d", d3.symbol().type(d3.symbolTriangle))
        .style("fill", "grey")
        .attr("transform",function(d) {
            return "translate(" + (x(d.values[0].week) ) + "," + (y(1)-15) + ") rotate(-30)"; });


    let round = candidates.append("circle")
        .attr("transform", function(d) { return "translate(" + (x(d.values[0].week) + 15) + "," + (y(d.values[0].rank)) + ")"; })
        .attr("x", 0)
        .attr("y",0)
        .attr("r", 10)
        .style("fill", colorFilter);


    let ranking = candidates.append("text")
        .attr("transform", function(d) { return "translate(" + (x(d.values[0].week) + 15 ) + "," + (y(d.values[0].rank) ) + ")"; })
        .attr("x", 0)
        .attr("dy", ".31em")
        .attr("text-anchor","middle")
        .style("cursor","pointer")
        .style("fill", "#ffffff")
        .style("font-weight", "bold")
        .text(function(d) { return d.values[0].rank; });

    let label = candidates.append("text")
        .attr("transform", function(d) { return "translate(" + (x(d.values[0].week) + 20) + "," + (y(d.values[0].rank) ) + ")"; })
        .attr("x", 8)
        .attr("dy", ".31em")
        .attr("id","label")
        .style("cursor","pointer")
        .style("stroke", colorFilter)
        .text(function(d) { return d.name; });

    let week = 1;

    let transition = d3.transition()
        .delay(500)
        .duration(speed)
        .on("start", function start() {
            label.transition()
                .duration(speed)
                .ease(d3.easeLinear)
                .attr("transform", function(d) { return "translate(" + (x(d.values[week].week) + 20) + "," + (y(d.values[week].rank)) + ")"; })
                .text(function(d) { return  d.name; });

            ranking.transition()
                .duration(speed)
                .ease(d3.easeLinear)
                .attr("transform", function(d) { return "translate(" + (x(d.values[week].week) + 15) + "," + (y(d.values[week].rank) ) + ")"; })
                .text(function(d,i) { return  d.values[week].rank; });

            round.transition()
                .duration(speed)
                .ease(d3.easeLinear)
                .attr("transform", function(d) { return "translate(" + (x(d.values[week].week) + 15) + "," + (y(d.values[week].rank)) + ")"; });

            circleEnd.transition()
                .duration(speed)
                .ease(d3.easeLinear)
                .attr("cx", function(d) { return x(d.values[week].week); })
                .attr("cy", function(d) { return y(d.values[week].rank); });

            clip.transition()
                .duration(speed)
                .ease(d3.easeLinear)
                .attr("width", x(week+1)+5)
                .attr("height", height*1.2);

            timeMark.transition()
                .duration(speed)
                .ease(d3.easeLinear)
                .attr("transform",function(d) { return "translate(" + (x(d.values[week].week) ) + "," + (y(1)-15) + ") rotate(-30)"; });
            // y.domain([100, 2]);
            // svg.select('.y.axis')
            //     .transition()
            //     .duration(speed)
            //     .ease(d3.easeLinear)
            //     .call(yAxis);
            console.log(week);

            week+=1;

            if (week !== data[0].length){
                console.log(transition);
                transition = transition.transition().on("start", start);
            }

        });
};

let responsiveFy = function (svg) {

    let container = d3.select(svg.node().parentNode),
        width = parseInt(svg.style("width")),
        height = parseInt(svg.style("height")),
        aspect = width / height;

    let resize = function () {
        let targetWidth = parseInt(container.style("width"));
        svg.attr("width", targetWidth * 0.8);
        svg.attr("height", Math.round(targetWidth /aspect * 0.8));
    };

    svg.attr("viewBox", "0 0 " + width + " " + height)
        .attr("perserveAspectRatio", "xMinYMid")
        .call(resize);

    d3.select(window).on("resize." + container.attr("#graphic"), resize);

};

let colorFilter = function (d){
    if (d.name === "Hillary Clinton") {
        return "#7183d3";
    } else if (d.name === "Bernie Sanders") {
        return "#7183d3";
    } else if (d.name === "Martin O'Malley"){
        return "#7183d3";
    } else if (d.name === "Lincoln Chafee"){
        return "#7183d3";
    } else if (d.name === "Jim Webb"){
        return "#7183d3";
    }else {
        return "#ce3b69";}
};

fetch('./rankdata.csv')
    .then((res) => res.text())
    .then((res) => {
        data = d3.csvParse(res);
        console.log(res);
        chart();

        // $(".candidatename").on("click",function(){
        //     var nameOfCandidate = $(this).text();
        //     candidates.style("opacity",0.1);
        //     candidates.filter(function(path) {
        //         return path.name === nameOfCandidate;
        //     }).style("opacity",1);
        // });

    });






// let margin = {top: 20, right: 50, bottom: 30, left: 50},
//     width = 630 - margin.left - margin.right,
//     height = 400 - margin.top - margin.bottom;
//
// let parseDate = d3.timeParse("%Y-%m-%d");
//
// let x = d3.scaleTime()
//     .range([0, width]);
//
// let y = d3.scaleLinear()
//     .range([height, 0]);
//
// let color = d3.scaleOrdinal(d3.schemeCategory10);
//
// let xAxis = d3.axisBottom()
//     .scale(x)
//     .ticks(5)
//     .tickSizeInner(15)
//     .tickSizeOuter(0);
//
// let yAxis = d3.axisLeft()
//     .scale(y)
//     .tickFormat(function(d) { return d + "%";})
//     .ticks(5)
//     .tickSizeInner(15)
//     .tickSizeOuter(0);
//
// let line = d3.line()
//     .curve(d3.curveBasis)
//     .x(function(d) { return x(d.date); })
//     .y(function(d) { return y(d.price); });
//
//
// let svg = d3.select("body").append("svg")
//     .attr("width", width + margin.left + margin.right)
//     .attr("height", height + margin.top + margin.bottom)
//     .append("g")
//     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
//
// fetch('./airbus_data.tsv')
//     .then((res) => res.text())
//     .then((res) => {
//         let data = d3.tsvParse(res);
//         color.domain(d3.keys(data[0]).filter(function(key) { return key !== "date"; }));
//
//
//         data.forEach(function(d) {
//             d.date = parseDate(d.date);
//         });
//
//         let companies = color.domain().map(function(name) {
//         return {
//             name: name,
//             values: data.map(function(d) {
//                 return {date: d.date, price: +d[name]};
//             })
//         };
//     });
//         console.log(companies);
//     x.domain(d3.extent(data, function(d) { return d.date; }));
//
//     y.domain([
//         d3.min(companies, function(c) { return d3.min(c.values, function(v) { return v.price; }); }),
//         d3.max(companies, function(c) { return d3.max(c.values, function(v) { return v.price; }); })
//     ]);
//
//     svg.append("g")
//         .attr("class", "x axis")
//         .attr("transform", "translate(0," + height + ")")
//         .call(xAxis);
//
//     svg.append("g")
//         .attr("class", "y axis")
//         .call(yAxis);
//
//
//     svg.append("line")
//         .attr(
//             {
//                 "class":"horizontalGrid",
//                 "x1" : 0,
//                 "x2" : width,
//                 "y1" : y(0),
//                 "y2" : y(0),
//                 "fill" : "none",
//                 "shape-rendering" : "crispEdges",
//                 "stroke" : "black",
//                 "stroke-width" : "1px",
//                 "stroke-dasharray": ("3, 3")
//             });
//
//
//     let company = svg.selectAll(".company")
//         .data(companies)
//         .enter().append("g")
//         .attr("class", "company");
//
//
//
//         let path = svg.selectAll(".company").append("path")
//         .attr("class", "line")
//         .attr("d", function(d) { return line(d.values); })
//         .style("stroke", function(d) { if (d.name == "Airbus")
//         {return "rgb(000,255,000)"}
//         else {return "#000";}
//         });
//
//
//     // var totalLength = path.node().getTotalLength();
//
//     /*
//     console.log(path);
//     console.log(path.node());
//     console.log(path[0][0]);
//     console.log(path[0][1]);
//     */
//     // var totalLength = [path[0][0].getTotalLength(), path[0][1].getTotalLength()];
//         let totalLength = [path._groups[0][0].getTotalLength(), path._groups[0][1].getTotalLength()];
//
//     // console.log(totalLength);
//
//     // console.log(path['_groups'][0][0].getTotalLength());
//
//     d3.select(path._groups[0][0])
//         .attr("stroke-dasharray", totalLength[0] + " " + totalLength[0] )
//         .attr("stroke-dashoffset", totalLength[0])
//         .transition()
//         .duration(10000)
//         .ease(d3.easeLinear)
//         .attr("stroke-dashoffset", 0);
//
//     d3.select(path._groups[0][1])
//         .attr("stroke-dasharray", totalLength[1] + " " + totalLength[1] )
//         .attr("stroke-dashoffset", totalLength[1])
//         .transition()
//         .duration(10000)
//         .ease(d3.easeLinear)
//         .attr("stroke-dashoffset", 0);
//
// });