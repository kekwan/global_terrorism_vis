class YearChart {

    constructor(_config) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 1100,
            containerHeight: _config.containerHeight || 700,
        }
        this.config.margin = _config.margin || { top: 50, bottom: 50, right: 50, left: 100 }
        this.data = _config.data;
        this.yearEnum = YearEnum.FIRST;
        this.keys = ["assaultAtks", "bombingAtks", "otherAtks"];
        this.initVis();
        this.updateGeneralView();
    }

    initVis() {
        let vis = this;

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        // set x scale
        vis.xScale = d3.scaleBand()
            .range([0, vis.width])
            .paddingInner(0.05)
            .align(0.1);

        // set y scale
        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

        // set the colors
        vis.colorScale = d3.scaleOrdinal()
            .domain(vis.keys)
            .range(d3.schemeCategory10);


        // Define and draw axes
        vis.xAxis = d3.axisBottom()
            .scale(vis.xScale)
            .tickSize(0)
            .tickPadding(6)
            .ticks(5);

        vis.yAxis = d3.axisLeft()
            .scale(vis.yScale)
            .tickSize(5)
            .tickPadding(6);

        vis.chart.append("g")
            .attr("class", "x axis")
            .attr("id", "xAxis")
            .attr("transform", "translate(0," + vis.height + ")");

        vis.chart.append("g")
            .attr("class", "y axis");

        vis.chart.append('text')
            .attr('class', 'axis-label')
            .attr('y', -60)
            .attr('x', -vis.height / 2)
            .attr('transform', `rotate(-90)`)
            .attr('text-anchor', 'middle')
            .text("Terrorist Attacks");

        vis.tooltip = d3.tip()
            .attr('class', 'tooltip');

        vis.chart.call(vis.tooltip);
    }

    updateDetailedView(isNext, isCheckBox) {
        let vis = this;

        if (!isCheckBox) {
            switch (vis.yearEnum) {
                case YearEnum.FIRST:
                    vis.yearEnum = isNext ? YearEnum.SECOND : YearEnum.FOURTH;
                    break;
                case YearEnum.SECOND:
                    vis.yearEnum = isNext ? YearEnum.THIRD : YearEnum.FIRST;
                    break;
                case YearEnum.THIRD:
                    vis.yearEnum = isNext ? YearEnum.FOURTH : YearEnum.SECOND;
                    break;
                case YearEnum.FOURTH:
                    vis.yearEnum = isNext ? YearEnum.FIRST : YearEnum.THIRD;
                    break;
                case YearEnum.ALL:
                    vis.yearEnum = YearEnum.FIRST;
                    break;
            }
            switch (vis.yearEnum) {
                case YearEnum.FIRST:
                    $("#yeartext").text("1970 - 1978");
                    break;
                case YearEnum.SECOND:
                    $("#yeartext").text("1979 - 1992");
                    break;
                case YearEnum.THIRD:
                    $("#yeartext").text("1993 - 2007");
                    break;
                case YearEnum.FOURTH:
                    $("#yeartext").text("2008 - 2018");
                    break;
            }
        }

        vis.updateChart();
        $("#xAxis .domain").remove();

        vis.yearG = vis.layers
            .selectAll("rect")
            .data(function (d) {
                return d;
            }).join("g")
            .on('mouseover', (d) => { vis.onHover(d) })
            .on('mouseout', vis.tooltip.hide);

        vis.yearG
            .append("rect")
            .transition()
            .duration(500)
            .attr("fill", function (d) { return "#364354"; })
            .attr("x", function (d) {
                return vis.xScale(d.data.iyear) + (vis.xScale.bandwidth() / 2) - (5 / 2);
            })
            .attr("y", function (d) {
                let yValue = d[1] - d[0];
                if (yValue == d.data.assaultAtks || yValue == d.data.otherAtks) {
                    return vis.yScale(d[1]);
                } else {
                    return vis.yScale(d[1]);
                }
            })
            .attr("height", function (d) {
                let yValue = d[1] - d[0];
                if (yValue == d.data.bombingAtks || yValue == d.data.otherAtks) {
                    return vis.yScale(d[0]) - vis.yScale(d[1]) - 14.4;
                } else {
                    return vis.yScale(d[0]) - vis.yScale(d[1]);
                }

            })
            .attr("width", 4);

        vis.yearG
            .append("use")
            .attr("xlink:href", (d) => {
                let yValue = d[1] - d[0];
                if (yValue == d.data.assaultAtks) {
                    return "#assault";
                } else if (yValue == d.data.bombingAtks) {
                    return "#bomb";
                } else {
                    return "#other";
                }
            })
            .attr("y", function (d) {
                return vis.yScale(d[1]) - 15;
            })
            .attr("x", function (d) {
                let yValue = d[1] - d[0];
                if (yValue == d.data.bombingAtks) {
                    return vis.xScale(d.data.iyear) + (vis.xScale.bandwidth() / 2) - (24 / 2);
                } else {
                    return vis.xScale(d.data.iyear) + (vis.xScale.bandwidth() / 2) - (28 / 2);
                }
            });
    }

    updateGeneralView() {
        let vis = this;
        vis.yearEnum = YearEnum.ALL;
        vis.updateChart();

        vis.layers
            .selectAll("rect")
            .data(function (d) {
                return d;
            })
            .join("rect")
            .on('mouseover', (d) => { vis.onHover(d) })
            .on('mouseout', vis.tooltip.hide)
            .transition()
            .duration(500)
            .attr("x", function (d) {
                return vis.xScale(d.data.iyear) + (vis.xScale.bandwidth() / 2) - (5 / 2);
            })
            .attr("y", function (d) {
                return vis.yScale(d[1]);
            })
            .attr("height", function (d) {
                return vis.yScale(d[0]) - vis.yScale(d[1]);
            })
            .attr("width", 10)
            .attr("fill", "#043575");
    }

    updateChart() {
        let vis = this;

        vis.transformData();
        vis.xScale.domain(vis.currentYears);
        vis.yScale.domain([0, vis.yearMaxYValue]);

        if (vis.yearEnum == YearEnum.ALL) {
            vis.xAxis.tickValues(vis.xScale.domain().filter((d) => {
                return d % 5 == 0;
            }));
            vis.xScale.range([0, vis.width]);
        } else {
            vis.xAxis.tickValues(vis.xScale.domain());
            vis.xScale.range([0, 700])
        }

        vis.chart.selectAll(".x.axis").transition()
            .delay(500)
            .duration(500)
            .call(vis.xAxis);

        vis.chart.selectAll(".y.axis").transition()
            .delay(500)
            .duration(500)
            .call(vis.yAxis);

        vis.chart.selectAll(".layer").remove();

        vis.layers = vis.chart.append("g")
            .attr("class", "layer")
            .selectAll("g")
            .data(vis.attackLayers)
            .join("g");
    }

    transformData() {
        let vis = this;
        let result = [];
        switch (vis.yearEnum) {
            case YearEnum.FIRST:
                vis.currentYears = d3.range(1970, 1979, 1); // 1970 - 1978
                break;
            case YearEnum.SECOND:
                vis.currentYears = d3.range(1979, 1993, 1); // 1979 - 1992
                break;
            case YearEnum.THIRD:
                vis.currentYears = d3.range(1993, 2008, 1); // 1993 - 2007
                break;
            case YearEnum.FOURTH:
                vis.currentYears = d3.range(2008, 2019, 1); // 2008 - 2018
                break;
            case YearEnum.ALL:
                vis.currentYears = d3.range(1970, 2019, 1); // 1970 - 2018 All Years
                break;
        }

        vis.currentYears.forEach(element => {
            result.push({ iyear: element });
        })

        let otherCheck = $("#otherCheck").is(":checked");
        let bombCheck = $("#bombCheck").is(":checked");
        let assaultCheck = $("#assaultCheck").is(":checked");

        // 1 Object per year with the # of attacks for each type
        result.forEach((element) => {
            let attacksInYear = vis.data.filter((e) => e.iyear == element.iyear);
            element.totalAtks = attacksInYear.length;
            if (assaultCheck) {
                element.assaultAtks = attacksInYear.filter((e) => e.attacktype1 == 2 || e.attacktype1 == 8).length;
            }
            if (bombCheck) {
                element.bombingAtks = attacksInYear.filter((e) => e.attacktype1 == 3).length;
            }
            if (otherCheck) {
                element.otherAtks = attacksInYear.filter((e) =>
                    e.attacktype1 == 4 || e.attacktype1 == 5 || e.attacktype1 == 6
                    || e.attacktype1 == 7 || e.attacktype1 == 9 || e.attacktype1 == 1).length;
            }

        });
        vis.yearMaxYValue = d3.max(result, d => d.totalAtks);
        vis.keys = Object.keys(result[0]).slice(2);
        vis.attackLayers = d3.stack().keys(vis.keys)(result);
    }

    onHover(d) {
        let vis = this;
        if (vis.yearEnum == YearEnum.ALL) {
            vis.tooltip.html(d => {
                return `<div> 
                    Year: ${d.data.iyear}<br />
                    Total Attacks: ${d.data.totalAtks}
                </div>`
            })
        } else {
            vis.tooltip.html(d =>
                `<div> 
                    Total Attacks: ${d.data.totalAtks}<br />
                    Attacks by Assault: ${d.data.assaultAtks}<br />
                    Attacks by Bombing: ${d.data.bombingAtks}<br />
                    Other Attacks: ${d.data.otherAtks}
                </div>`)

        }
        vis.tooltip.show(d);
    }
}

const YearEnum = Object.freeze({
    FIRST: 1,
    SECOND: 2,
    THIRD: 3,
    FOURTH: 4,
    ALL: 5
});