class IciclePlot {
    constructor(_config) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 1100,
            containerHeight: _config.containerHeight || 500,
            data: _config.data
        };
        this.config.margin = _config.margin || { top: 50, bottom: 50, right: 50, left: 50 }
        this.initVis();
    }

    initVis() {
        let vis = this;
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.width)
            .attr('height', vis.height);
        vis.data = vis.config.data;
    }

    update(year1, year2, country) {
        let vis = this;
        let data = vis.config.data;
        // Selected year range and specific country  
        data = data.filter(function (d) { return (d.iyear >= year1 && d.iyear <= year2) });
        // Select specific country
        data = data.filter(function (d) { return (d.country_txt === country.toString()) });
        if (data.length != 0) {
            $(".alert").hide();
            vis.render(data);
        } else {
            $(".alert").show();
            vis.svg.selectAll("g").remove();
        }
    }


    render(data) {
        let vis = this;
        //nested data
        var nestdata = d3.nest()
            .key(function (d) { return d.country_txt; })
            .key(function (d) { return d.provstate; })
            .key(function (d) { return d.city; })
            .rollup(function (v) { return v.length; })
            .entries(data);

        //transfer to hierarchy
        var root = d3.hierarchy(nestdata[0], function (d) { return d.values; })
        root.sum(d => d.value) //required
            .sort((a, b) => b.height - a.height || b.value - a.value);
        let focus = root;
        //add partition
        let height = 300; let width = 900;
        var partitionLayout = d3.partition().size([width, height]);
        partitionLayout(root);

        var color = d3.scaleOrdinal(d3.quantize(d3.interpolateRdBu, data.values.length + 40)); //interpolateBlues interpolateRdBu
        var total = nestdata[0].values;
        vis.svg.selectAll("g").remove();
        const cell = vis.svg
            .selectAll("g")
            .data(root.descendants())
            .join("g")
            .attr("transform", d => `translate(${d.x0 + 50},${d.y0 + 50})`);

        const rect = cell.append("rect")
            .attr('width', function (d) { return d.x1 - d.x0; })
            .attr('height', function (d) { return d.y1 - d.y0; })
            .attr("fill-opacity", 0.6)
            .attr("fill", d => {
                if (!d.depth) return "#dec7c7"; //#dec7c7
                while (d.depth > 1) d = d.parent;
                return color(d.data.key);
            })
            .on("click", clicked);

        const text = cell
            .append("text")
            .attr("x", 4)
            .attr("y", 13)
            .attr("fill-opacity", d => +labelVisible(d));

        const tspan = text.append("tspan")
            .text(d => {
                if (!d.depth) {
                    return `Total # of Attacks in ${d.data.key}: `;
                }
                return d.data.key;
            })
            .attr("font-size", 14)
            .attr("fill-opacity", d => +labelVisible(d) * 0.7);

        var formatp = d3.format(".2%");
        text.append("tspan")
            .text(d => {
                if (!d.depth) return d.value;
                else {
                    var num = d.value;
                    d = d.parent;
                    return ` ${formatp(num / d.value)}`;
                }
            })
            .attr("font-size", 12);

        function clicked(p) {
            if (p.depth >= 1) {
                focus = focus === p ? p = p.parent : p;
                root.each(
                    d => d.target = {
                        x0: (d.x0 - p.x0) / (p.x1 - p.x0) * width,
                        x1: (d.x1 - p.x0) / (p.x1 - p.x0) * width,
                        y0: d.y0 - p.y0,
                        y1: d.y1 - p.y0
                    });

                const t = cell.transition().duration(750)
                    .attr("transform", d => `translate(${d.target.x0 + 50},${d.target.y0 + 50})`);
                rect.transition(t).attr("width", d => rectWidth(d.target));
                text.transition(t).attr("fill-opacity", d => +labelVisible(d.target));
                tspan.transition(t).attr("fill-opacity", d => labelVisible(d.target) * 0.7);
            }
        }

        function rectWidth(d) {
            return d.x1 - d.x0 - Math.min(1, (d.x1 - d.x0) / 2);
        }

        function labelVisible(d) {
            return d.x1 - d.x0 > 70;
        }
    }
}

