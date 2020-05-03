
class SymbolMap {
    constructor(_config) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 1100,
            containerHeight: _config.containerHeight || 600,
            data: _config.data
        };
        this.config.margin = _config.margin || { top: 50, bottom: 50, right: 50, left: 50 }
        this.initVis();
    }

    initVis() {
        // code is inspired by https://vizhub.com/siddhero97/db67b6864619456291b4b158b6b4b6a9
        let vis = this;

        // A local svg element is selected based on the configurations specified in the constructor
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.width)
            .attr('height', vis.height);

        // A chart element is created by adding a Group element to the local svg element
        vis.chart = vis.svg.append('g');

        //The localMinYear and the localMaxYear is both set to the global minimum year and the the global max year respectively
        vis.localMinYear = 1970;
        vis.localMaxYear = 2018;
        vis.hasBeenClicked = false;
        vis.projection = d3.geoNaturalEarth1();
        vis.pathGenerator = d3.geoPath().projection(vis.projection);
        vis.initalized = false;
        vis.tooltip = d3.tip()
            .attr('class', 'tooltip')
            .html(d => `<div> ${d.properties.name} : ${d.properties.frequency}</div>`);

        vis.svg.call(vis.tooltip);
        //RadiusValue is equal to the frequency attached to the properties element of each country.
        vis.radiusValue = d => d.properties.frequency;

        //create icicle plot
        vis.icicleplot = new IciclePlot({ parentElement: "#iciclePlot", data: vis.config.data });
        vis.country = "United States";
        vis.makeMap();
        vis.mappedNames = new Set();
        vis.loadAndInit();
    }

    makeMap() {
        let vis = this;
        let map = new Map();
        map.set("United States", "United States of America");
        map.set("Vatican", "Micronesia");
        map.set("Democratic Republic of the Congo", "Dem. Rep. Congo");
        map.set("Central African Republic", "Central African Rep.");
        map.set("Republic of the Congo", "Congo");
        map.set("Western Sahara", "W. Sahara");
        map.set("West Germany (FRG)", "Germany");
        map.set("East Germany (GDR)", "Germany");
        map.set("Vatican City", "Vatican");
        map.set("Antigua and Barbuda", "Antigua and Barb.");
        map.set("Macau", "China");
        map.set("French Guiana", "France");
        map.set("Dominican Republic", "Dominican Rep.");
        map.set("Serbia-Montenegro", "Serbia");
        map.set("Czechoslovakia", "Czechia");
        map.set("Solomon Islands", "Solomon Is.");
        map.set("People's Republic of the Congo", "Congo");
        map.set("Swaziland", "eSwatini");
        map.set("Ivory Coast", "Côte d'Ivoire");
        map.set("Slovak Republic", "Slovakia");
        map.set("Yugoslavia", "Croatia");
        map.set("West Bank and Gaza Strip", "Palestine");
        map.set("Bosnia-Herzegovina", "Bosnia and Herz.");
        map.set("South Yemen", "Yemen");
        map.set("Martinique", "France");
        map.set("Soviet Union", "Russia");
        map.set("Guadeloupe", "France");
        map.set("Czech Republic", "Czechia");
        map.set("South Sudan", "S. Sudan");
        map.set("French Polynesia", "France");
        map.set("South Vietnam", "Vietnam");
        map.set("St. Lucia", "Saint Lucia");
        map.set("North Yemen", "Yemen");
        map.set("New Hebrides", "Vanuatu");
        map.set("Zaire", "Dem. Rep. Congo");
        map.set("East Timor", "Timor-Leste");
        map.set("Rhodesia", "Zimbabwe");
        map.set("Equatorial Guinea", "Eq. Guinea");
        map.set("Falkland Islands", "Falkland Is.");
        vis.alternativeNames = map;
    }

    loadAndInit() {
        let vis = this;
        Promise.all([
            d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json')
        ]).then(([topoJson]) => {
            //The global variable countries is set to all of the countries of the world.
            vis.countries = topojson.feature(topoJson, topoJson.objects.countries);
            vis.processData();
            vis.radiusScale = d3.scaleSqrt()
                .domain([0, d3.max(vis.featuresWithPopulation, vis.radiusValue)])
                .range([0, 35]);

            let geoPath = vis.chart.selectAll('path')
                .data(vis.featuresWithPopulation);

            let geoPathEnter = geoPath
                .enter().append('path')
                .attr('class', 'country')
                .attr('d', vis.pathGenerator)
                .on("click", function (d) {
                    vis.onClick(d);
                    if (!vis.hasBeenClicked) {
                        vis.activeCountry = d3.select(this);
                    } else {
                        vis.activeCountry
                            .style("fill", "#d0d7d9");
                        vis.activeCountry = d3.select(this);
                    }
                    vis.activeCountry
                        .style("fill", "#dbcd2e");
                    vis.hasBeenClicked = true;
                })
                .on("mouseover", function (d) {
                    vis.onHover(d);
                })
                .on('mouseout', function (d) {
                    vis.tooltip.hide();
                });

            //The chart is initially updated
            vis.update();

            // The slider updates the data
            vis.getDataFromSlider();
            vis.createLegend();
        });
    }

    getDataFromSlider() {
        let vis = this;
        $(function () {
            $("#slider-range").slider({
                range: true,
                min: 1970, // the global minimum is 1970
                max: 2018, // the global maximum is 2018
                values: [1970, 2018], // the initial values the slider are the global minimum and  the global maximum
                slide: function (event, ui) {
                    vis.localMinYear = ui.values[0];
                    vis.localMaxYear = ui.values[1];
                    $("#amount").val(vis.localMinYear + " - " + vis.localMaxYear); // the value of amount is updated whenever the slider is moved
                    vis.update(); // the chart is updated everytime the slider is moved
                }
            });
            $("#amount").val(vis.localMinYear + " - " + vis.localMaxYear); // the default value of amount is equal to
        });
    }

    update() {
        let vis = this;
        vis.processData();
        vis.icicleplot.update(vis.localMinYear, vis.localMaxYear, vis.country);
        vis.render();
    }

    processData() {
        let vis = this;
        // Only the values of the data when the year is in the range of localMinYear and localMaxYear
        let year;
        vis.filteredData = vis.config.data.filter((value, index, array) => {
            year = value["iyear"];
            return (year >= vis.localMinYear) && (year <= vis.localMaxYear);
        });
        // The filteredData is grouped according to the country
        vis.filteredData = d3.nest()
            .key(function (d) { return d["country_txt"]; })
            .rollup(function (v) { return v.length; })
            .entries(vis.filteredData);
        // The frequency of all the countries is updated according to the data provided
        vis.countries.features.map(((country, index, array) => {
            country.properties.frequency = 0;
        }));

        vis.featuresWithPopulation = vis.countries.features.map(((country, index, array) => {
            vis.filteredData.forEach((dataElement) => {
                vis.mappedNames.add(dataElement["key"]);
                if ((dataElement["key"] === country.properties.name) || vis.isAlternativeName(country.properties.name, dataElement["key"])) {
                    if (country.properties.frequency) {
                        country.properties.frequency = dataElement["value"] + country.properties.frequency;
                    } else {
                        country.properties.frequency = dataElement["value"];
                    }
                }
            });
            country.properties.projected = vis.projection(d3.geoCentroid(country));
            return country;
        }));

    }

    isAlternativeName(name1, name2) {
        let vis = this;
        return vis.alternativeNames.get(name2) === name1;
    }

    groupBy(list, variable) {
        const map = new Map();
        let count = 0;
        let data;
        list.forEach((item) => {

            const key = item[variable];
            data = map.get(key);
            count = isNaN(data) ? 0 : data;
            count++;
            map.set(key, count);
        });
        let element;
        let result = [];
        map.forEach(((value, key) => {
            element = {};
            element.country = key;
            element.frequency = value;
            result.push(element);

        }));
        return result;
    }

    render() {
        let vis = this;

        let circles = vis.chart.selectAll('circle')
            .data(vis.featuresWithPopulation);

        circles.join('circle')
            .attr('class', 'country-circle')
            .attr('cx', d => d.properties.projected[0])
            .attr('cy', d => d.properties.projected[1])
            .attr('r', d => {
                return vis.radiusScale(vis.radiusValue(d))
            });
    }

    onHover(d) {
        let vis = this;
        vis.tooltip.show(d);
    }

    onClick(d) {
        let vis = this;
        let hasAlternativeName = false;
        if (!vis.mappedNames.has(d.properties.name)) {
            for (let entry of vis.alternativeNames.entries()) {
                if (entry[1] === d.properties.name) {
                    vis.country = entry[0];
                    hasAlternativeName = true;
                }
            }
        } 
        if (!hasAlternativeName) {
            vis.country = d.properties.name;
        }
        vis.icicleplot.update(vis.localMinYear, vis.localMaxYear, vis.country);
    }

    createLegend() {
        let vis = this;
        // Add legend: circles
        var valuesToShow = [1000, 10000, 30000]
        var xCircle = 80
        var xLabel = 140
        var yCircle = 450
        let legendGroup = vis.svg.append("g")
            .attr("class", "legend");

        legendGroup
            .selectAll("legend")
            .data(valuesToShow)
            .enter()
            .append("circle")
            .attr("cx", xCircle)
            .attr("cy", function (d) { return yCircle - vis.radiusScale(d) })
            .attr("r", function (d) { return vis.radiusScale(d) })
            .style("fill", "none")
            .attr("stroke", "black");

        // Add legend: segments
        legendGroup
            .selectAll("legend")
            .data(valuesToShow)
            .enter()
            .append("line")
            .attr('x1', function (d) { return xCircle + vis.radiusScale(d) })
            .attr('x2', xLabel)
            .attr('y1', function (d) { return yCircle - vis.radiusScale(d) })
            .attr('y2', function (d) { return yCircle - vis.radiusScale(d) })
            .attr('stroke', 'black')
            .style('stroke-dasharray', ('2,2'));

        // Add legend: labels
        legendGroup
            .selectAll("legend")
            .data(valuesToShow)
            .enter()
            .append("text")
            .attr('x', xLabel)
            .attr('y', function (d) { return yCircle - vis.radiusScale(d) })
            .text(function (d) { return d })
            .style("font-size", 10)
            .attr('alignment-baseline', 'middle');
    }
}