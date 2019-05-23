import './style.css';
import * as d3 from "d3";

console.error('I get called from print.js!');

let tickDuration = 333;
let top_n = 12;
let width = 975;
let height = 600;

let halo = function(text, strokeWidth) {
    text.select(function() { return this.parentNode.insertBefore(this.cloneNode(true), this); })
        .style("fill", "#ffffff",)
        .style("stroke", "#ffffff",)
        .style("stroke-width", strokeWidth,)
        .style("stroke-linejoin", "round",)
        .style("opacity", 1);
};

// chart = {

const svg = d3.select('body')
    .append("svg")
    .attr("width", width)
    .attr("height", height);
    // const svg = d3.select(DOM.svg(width, height));

const margin = {
    top: 80,
    right: 0,
    bottom: 5,
    left: 0
};

let barPadding = (height-(margin.bottom+margin.top))/(top_n*5);

let title = svg.append('text')
    .attr(
        "class", 'title',
    )
    .attr(
        "y", 24
    )
    .html('18 years of Interbrand’s Top Global Brands');

let subTitle = svg.append('text')
    .attr(
        "class", 'subTitle',

    )
    .attr(
        "y", 55
    )
    .html('Brand value, $m');

let caption = svg.append('text')
    .attr(
        "class", 'caption',
    )
    .attr(
        "x", width,
    )
    .attr(
        "y", height-5
    )
    .style(
        'text-anchor', 'end'
    )
    .html('Source: Interbrand');

let year = 2000;

fetch('./data.csv')
    .then((res) => res.text())
    .then((res) => {
        const brandData = d3.csvParse(res);
        brandData.forEach(d => {
            d.value = +d.value,
                d.lastValue = +d.lastValue,
                d.value = isNaN(d.value) ? 0 : d.value,
                d.year = +d.year,
                d.colour = d3.hsl(Math.random()*360,0.75,0.75)
        });

        let yearSlice = brandData.filter(d => d.year == year && !isNaN(d.value))
            .sort((a,b) => b.value - a.value)
            .slice(0,top_n);

        yearSlice.forEach((d,i) => d.rank = i);

        let x = d3.scaleLinear()
            .domain([0, d3.max(yearSlice, d => d.value)])
            .range([margin.left, width-margin.right-65]);

        let y = d3.scaleLinear()
            .domain([top_n, 0])
            .range([height-margin.bottom, margin.top]);

        let xAxis = d3.axisTop()
            .scale(x)
            .ticks(width > 500 ? 5:2)
            .tickSize(-(height-margin.top-margin.bottom))
            .tickFormat(d => d3.format(',')(d));

        svg.append('g')
            .attr("class", "axis xAxis")
            .attr("transform", `translate(0, ${margin.top})`)
            .call(xAxis)
            .selectAll('.tick line')
            .classed('origin', d => d == 0);

        svg.selectAll('rect.bar')
            .data(yearSlice, d => d.name)
            .enter()
            .append('rect')
            .attr("class", 'bar')
            .attr("x", x(0)+1,)
            .attr("width", d => x(d.value)-x(0)-1,)
            .attr("y", d => y(d.rank)+5)
            .attr("height", y(1)-y(0)-barPadding)
            .style("fill", d => d.colour);

        svg.selectAll('text.label')
            .data(yearSlice, d => d.name)
            .enter()
            .append('text')
            .attr("class", 'label')
            .attr("x", d => x(d.value)-8)
            .attr("y", d => y(d.rank)+5+((y(1)-y(0))/2)+1)
            .attr("text-anchor", "end")
            .html(d => d.name);

        svg.selectAll('text.valueLabel')
            .data(yearSlice, d => d.name)
            .enter()
            .append('text')
            .attr(
                "class", 'valueLabel',
            )
            .attr(
                "x", d => x(d.value)+5,
            )
            .attr(
                "y", d => y(d.rank)+5+((y(1)-y(0))/2)+1,
            )
            .text(d => d3.format(',.0f')(d.lastValue));

        let yearText = svg.append('text')
            .attr(
                "class", 'yearText',
            ).attr(
                "x", width-margin.right,
            ).attr(
                "y", height-25
            )
            .style("text-anchor", "end")
            .html(~~year)
            .call(halo, 10);

        let ticker = d3.interval(e => {

            yearSlice = brandData.filter(d => d.year == year && !isNaN(d.value))
                .sort((a,b) => b.value - a.value)
                .slice(0,top_n);

            yearSlice.forEach((d,i) => d.rank = i);

            console.log(yearSlice[0]['name']);

            x.domain([0, d3.max(yearSlice, d => d.value)]);

            svg.select('.xAxis')
                .transition()
                .duration(tickDuration)
                .ease(d3.easeLinear)
                .call(xAxis);

            let bars = svg.selectAll('.bar').data(yearSlice, d => d.name);

            bars
                .enter()
                .append('rect')
                .attr(
                    "class", d => `bar ${d.name.replace(/\s/g,'_')}`,
                ).attr(
                    "x", x(0)+1,
                )
                .attr(
                    "width", d => x(d.value)-x(0)-1,
                )
                .attr(
                    "y", d => y(top_n+1)+5,
                )
                .attr(
                    "height", y(1)-y(0)-barPadding
                )
                .style("fill", d => d.colour)
                .transition()
                .duration(tickDuration)
                .ease(d3.easeLinear)
                .attr("y", d => y(d.rank)+5);

            bars
                .transition()
                .duration(tickDuration)
                .ease(d3.easeLinear)
                .attr("width", d => x(d.value)-x(0)-1,)
                .attr("y", d => y(d.rank)+5);
            bars
                .exit()
                .transition()
                .duration(tickDuration)
                .ease(d3.easeLinear)
                .attr("width", d => x(d.value)-x(0)-1)
                .attr("y", d => y(top_n+1)+5)
                .remove();

            let labels = svg.selectAll('.label').data(yearSlice, d => d.name);

            labels
                .enter()
                .append('text')
                .attr("class", 'label',)
                .attr("x", d => x(d.value)-8)
                .attr("y", d => y(top_n+1)+5+((y(1)-y(0))/2))
                .attr('text-anchor', 'end')
                .html(d => d.name)
                .transition()
                .duration(tickDuration)
                .ease(d3.easeLinear)
                .attr("y", d => y(d.rank)+5+((y(1)-y(0))/2)+1);

            labels
                .transition()
                .duration(tickDuration)
                .ease(d3.easeLinear)
                .attr(
                    "x", d => x(d.value)-8,
                ).attr(
                    "y", d => y(d.rank)+5+((y(1)-y(0))/2)+1
                );

            labels
                .exit()
                .transition()
                .duration(tickDuration)
                .ease(d3.easeLinear)
                .attr(
                    "x", d => x(d.value)-8,
                )
                .attr(
                    "y", d => y(top_n+1)+5
                )
                .remove();

            let valueLabels = svg.selectAll('.valueLabel').data(yearSlice, d => d.name);

            valueLabels
                .enter()
                .append('text')
                .attr("class", 'valueLabel')
                .attr("x", d => x(d.value)+5)
                .attr("y", d => y(top_n+1)+5)
                .text(d => d3.format(',.0f')(d.lastValue))
                .transition()
                .duration(tickDuration)
                .ease(d3.easeLinear)
                .attr(
                    "y", d => y(d.rank)+5+((y(1)-y(0))/2)+1
                );

            valueLabels
                .transition()
                .duration(tickDuration)
                .ease(d3.easeLinear)
                .attr("x", d => x(d.value)+5)
                .attr("y", d => y(d.rank)+5+((y(1)-y(0))/2)+1)
                .tween("text", function(d) {
                    let i = d3.interpolateRound(d.lastValue, d.value);
                    return function(t) {
                        this.textContent = d3.format(',')(i(t));
                    };
                });

            valueLabels
                .exit()
                .transition()
                .duration(tickDuration)
                .ease(d3.easeLinear)
                .attr("x", d => x(d.value)+5)
                .attr("y", d => y(top_n+1)+5)
                .remove();

            yearText.html(~~year);

            title.html(yearSlice[0]['name']);

            if(year == 2018) ticker.stop();
            year = d3.format('.1f')((+year) + 0.1);
        },tickDuration);
    });



// return svg.node();
// }

// 'use strict';
//
// const margin = {top: 20, right: 30, bottom: 40, left: 260};
// const width = 960 - margin.left - margin.right;
// const height = 400 - margin.top - margin.bottom;
// const percentFormat = d3.format('.0%');
// const leftPadding = 5;
//
// const delay = function(d, i) {
//     return i * 40;
// };
//
// function sortData(data) {
//     return data.sort((a, b) => b.value - a.value);
// }
//
// function removeGeoAreasWithNoData(data) {
//     return data.filter(d => d.value);
// }
//
// function prepareData(data) {
//     return data.reduce((accumulator, d) => {
//         Object.keys(d).forEach((k) => {
//             if (!Number.isInteger(+k)) { return; }
//             let value;
//             if (d[+k] === '..') {
//                 value = 0;
//             } else {
//                 value = +d[+k] / 100;
//             }
//             const newEntry = {
//                 value,
//                 geoCode: d.CountryCode,
//                 geoName: d.Country,
//             };
//             if (accumulator[+k]) {
//                 accumulator[+k].push(newEntry);
//             } else {
//                 accumulator[+k] = [newEntry];
//             }
//         });
//         return accumulator;
//     }, {});
// }
//
// function xAccessor(d) {
//     return d.value;
// }
//
// function yAccessor(d) {
//     return d.geoName;
// }
//
// const xScale = d3.scaleLinear()
//     .range([0, width])
//     .domain([0, 1]);
//
// const yScale = d3.scaleBand()
//     .rangeRound([0, height], 0.1)
//     .padding(0.1);
//
// function drawXAxis(el) {
//     el.append('g')
//         .attr('class', 'axis axis--x')
//         .attr('transform', `translate(${leftPadding},${height})`)
//         .call(d3.axisBottom(xScale).tickFormat(percentFormat).tickSize(-height));
// }
//
// function drawYAxis(el, data, t) {
//     let axis = el.select('.axis--y');
//     if (axis.empty()) {
//         axis = el.append('g')
//             .attr('class', 'axis axis--y');
//     }
//
//     axis.transition(t)
//         .call(d3.axisLeft(yScale))
//         .selectAll('g')
//         .delay(delay);
// }
//
// function drawBars(el, data, t) {
//     let barsG = el.select('.bars-g');
//     if (barsG.empty()) {
//         barsG = el.append('g')
//             .attr('class', 'bars-g');
//     }
//
//     const bars = barsG
//         .selectAll('.bar')
//         .data(data, yAccessor);
//     bars.exit()
//         .remove();
//     bars.enter()
//         .append('rect')
//         .attr('class', d => d.geoCode === 'WLD' ? 'bar wld' : 'bar')
//         .attr('x', leftPadding)
//         .merge(bars).transition(t)
//         .attr('y', d => yScale(yAccessor(d)))
//         .attr('width', d => xScale(xAccessor(d)))
//         .attr('height', yScale.bandwidth())
//         .delay(delay);
// }
//
// const svg = d3.select('.chart').append('svg')
//     .attr('width', width + margin.left + margin.right)
//     .attr('height', height + margin.top + margin.bottom)
//     .append('g')
//     .attr('transform', `translate(${margin.left},${margin.top})`);
//
// fetch('./data.csv')
//     .then((res) => res.text())
//     .then((res) => {
//         const data = prepareData(d3.csvParse(res));
//         const years = Object.keys(data).map(d => +d);
//         const lastYear = years[years.length - 1];
//         let startYear = years[0];
//         let selectedData = removeGeoAreasWithNoData(sortData(data[startYear]));
//         let geoAreas = selectedData.map(yAccessor);
//
//         d3.select('.year').text(startYear);
//
//         yScale.domain(geoAreas);
//         drawXAxis(svg, selectedData);
//         drawYAxis(svg, selectedData);
//         drawBars(svg, selectedData);
//
//         const interval = d3.interval(() => {
//             const t = d3.transition().duration(100);
//
//             startYear += 1;
//             selectedData = removeGeoAreasWithNoData(sortData(data[startYear]));
//
//             d3.select('.year').text(startYear);
//
//             yScale.domain(selectedData.map(yAccessor));
//             drawYAxis(svg, selectedData, t);
//             drawBars(svg, selectedData, t);
//
//             if (startYear === lastYear) {
//                 interval.stop();
//             }
//         }, 200);
//     });

// let data = [
//     {label:"Category 1", value:19},
//     {label:"Category 2", value:5},
//     {label:"Category 3", value:13},
//     {label:"Category 4", value:17},
//     {label:"Category 5", value:19},
//     {label:"Category 6", value:27}
// ];
//
//
// let div = d3.select("body").append("div").attr("class", "toolTip");
//
// let axisMargin = 20,
//     margin = 40,
//     valueMargin = 4,
//     width = parseInt(d3.select('body').style('width'), 10),
//     height = parseInt(d3.select('body').style('height'), 10),
//     barHeight = (height-axisMargin-margin*2)* 0.4/data.length,
//     barPadding = (height-axisMargin-margin*2)*0.6/data.length,
//     bar, svg, scale, xAxis, labelWidth = 0;
//
// let max = d3.max(data, function(d) { return d.value; });
//
// svg = d3.select('body')
//     .append("svg")
//     .attr("width", width)
//     .attr("height", height);
//
//
// bar = svg.selectAll("g")
//     .data(data)
//     .enter()
//     .append("g");
//
// bar.attr("class", "bar")
//     .attr("cx",0)
//     .attr("transform", function(d, i) {
//         return "translate(" + margin + "," + (i * (barHeight + barPadding) + barPadding) + ")";
//     });
//
// bar.append("text")
//     .attr("class", "label")
//     .attr("y", barHeight / 2)
//     .attr("dy", ".35em") //vertical align middle
//     .text(function(d){
//         return d.label;
//     }).each(function() {
//         labelWidth = Math.ceil(Math.max(labelWidth, this.getBBox().width));
//     });
//
// scale = d3.scaleLinear()
//     .domain([0, max])
//     .range([0, width - margin*2 - labelWidth]);
//
// xAxis = d3.axisBottom(scale)
//     .scale(scale)
//     .tickSize(-height + 2*margin + axisMargin);
//
// bar.append("rect")
//     .attr("transform", "translate("+labelWidth+", 0)")
//     .attr("height", barHeight)
//     .attr("width", 0)
//     .transition()
//     .duration(15000)
//     .attr("width", function(d){
//         return scale(d.value);
//     });
//
// let format = d3.format(",d");
//
// bar.append("text")
//     .attr("class", "value")
//     .attr("y", barHeight / 2)
//     .attr("dx", -valueMargin + labelWidth) //margin right
//     .attr("dy", ".35em") //vertical align middle
//     .attr("text-anchor", "end")
//     .text(function(d){
//         return (d.value);
//     })
//     .transition()
//     // .delay(500)
//     .duration(15000)
//     .attr("x", function(d){
//         let width = this.getBBox().width;
//         return Math.max(width + valueMargin, scale(d.value));
//     }).tween("text", function(d) {
//         let i = d3.interpolate(0, d.value);
//         return function(t) {
//             d3.select(this).text(format(i(t)));
//         };
//     });
//
// bar.append("text")
//     .attr("class", "value-2")
//     .attr("y", barHeight / 2)
//     .attr("dx", -valueMargin + labelWidth + 10) //margin right
//     .attr("dy", ".35em") //vertical align middle
//     .attr("text-anchor", "start")
//     .text(function(d){
//         return (d.value);
//     })
//     .transition()
//     .duration(15000)
//     .attr("x", function(d){
//         let width = this.getBBox().width;
//         return Math.max(width + valueMargin, scale(d.value));
//     }).tween("text", function(d) {
//     let i = d3.interpolate(0, d.value);
//     return function(t) {
//         d3.select(this).text(format(i(t)));
//     };
// });
//
// bar.on("mousemove", function(d){
//         div.style("left", d3.event.pageX+10+"px");
//         div.style("top", d3.event.pageY-25+"px");
//         div.style("display", "inline-block");
//         div.html((d.label)+"<br>"+(d.value)+"%");
//     });
// bar.on("mouseout", function(d){
//         console.log(d);
//         div.style("display", "none");
//     });
//
// svg.insert("g",":first-child")
//     .attr("class", "axisHorizontal")
//     .attr("transform", "translate(" + (margin + labelWidth) + ","+ (height - axisMargin - margin)+")")
//     .call(xAxis);
//
// d3.interval(update, 1000);
//
// function update(){
//     scale.domain([0, random(10, 10000)]);
//
//     svg.select(".axisHorizontal")
//         .transition()
//         .call(xAxis);
//
// }
//
// function random(min, max){
//     return Math.floor(Math.random() * (max - min + 1) + min);
// }