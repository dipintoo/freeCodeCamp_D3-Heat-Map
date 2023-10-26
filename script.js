const [CELL_W, CELL_H] = [5, 32];
const PADDING = { left: 80, top: 120, right: 24, bottom: 110, legend: 24 };
const BLYLWRD = d3.schemeRdYlBu[11].reverse();
const TITLE = { size: 36 };
const DESCRIPTION = { size: 20 };

(async () => {
  try {
    d3
      .json(
        "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json"
      )
      .then(({ baseTemperature, monthlyVariance }) => {
        const [GRAPH_W, GRAPH_H] = [
          PADDING.left +
          Math.ceil(monthlyVariance.length / 12) * CELL_W +
          PADDING.right,
          PADDING.top + CELL_H * 11.5 + PADDING.bottom
        ];

        const svg = d3
          .select("body")
          .append("svg")
          .attr("width", GRAPH_W)
          .attr("height", GRAPH_H);

        // Title
        svg
          .append("text")
          .style("text-anchor", "middle")
          .attr("x", GRAPH_W / 2)
          .attr("y", TITLE.size)
          .style("font-size", TITLE.size)
          .style("font-weight", "500")
          .attr("id", "title")
          .text("Monthly Global Land-Surface Temperature");

        // Description
        svg
          .append("text")
          .style("text-anchor", "middle")
          .style("fill", "gray")
          .attr("x", GRAPH_W / 2)
          .attr("y", TITLE.size + DESCRIPTION.size + 15)
          .style("font-size", DESCRIPTION.size)
          .style("font-weight", "300")
          .attr("id", "description")
          .text(
            `${d3
              .extent(monthlyVariance.map((a) => a.year))
              .join(" - ")}: base temperature ${baseTemperature} ℃`
          );

        // Year vs Month datas
        const [minYear, maxYear] = d3.extent(monthlyVariance.map((a) => a.year));

        const xScale = d3
          .scaleBand()
          .domain(d3.range(minYear, maxYear + 1))
          .range([PADDING.left, GRAPH_W - PADDING.right]);

        const yScale = d3
          .scaleBand()
          .domain(d3.range(12))
          .range([PADDING.top - CELL_H / 2, GRAPH_H - PADDING.bottom]);

        // Axes
        const xAxis = d3
          .axisBottom(xScale)
          .tickValues(xScale.domain().filter((a) => a % 10 === 0))
          .tickSize(10)
          .tickSizeOuter(0)
          .tickFormat((d) => "" + d);

        const yAxis = d3
          .axisLeft(yScale)
          .tickSize(10)
          .tickSizeOuter(0)
          .tickFormat((d) => d3.timeFormat("%B")(new Date(2000, d)));

        svg
          .append("g")
          .attr("transform", `translate(0, ${GRAPH_H - PADDING.bottom})`)
          .call(xAxis)
          .attr("id", "x-axis");

        svg
          .append("g")
          .attr("transform", `translate(${PADDING.left}, 0)`)
          .call(yAxis)
          .attr("id", "y-axis");

        const extent = d3.extent(monthlyVariance.map((a) => a.variance));
        const threshold =
          extent.reduce((a, b) => Math.abs(b) + a, 0) / BLYLWRD.length;

        // Legend
        const legendSVG = svg.append("g").attr("id", "legend");

        const legendScale = d3
          .scaleLinear()
          .domain(extent.map((a) => a + baseTemperature))
          .range([PADDING.left, PADDING.left + 12 * CELL_H]);

        const legendAxis = d3
          .axisBottom(legendScale)
          .tickValues(
            Array(BLYLWRD.length + 1)
              .fill()
              .map((_, i) => baseTemperature + extent[0] + i * threshold)
          )
          .tickSize(10)
          .tickSizeOuter(0)
          .tickFormat(d3.format(".1f"));

        legendSVG
          .append("g")
          .attr("transform", `translate(0, ${GRAPH_H - PADDING.legend})`)
          .call(legendAxis);

        legendSVG
          .selectAll("rect")
          .data(
            Array(BLYLWRD.length)
              .fill()
              .map((_, i) => baseTemperature + extent[0] + i * threshold)
          )
          .enter()
          .append("rect")
          .attr("class", "legend-cell")
          .attr(
            "width",
            legendScale(baseTemperature + extent[0] + threshold) - PADDING.left
          )
          .attr("height", CELL_H)
          .attr("x", (d, i) => legendScale(d))
          .attr("y", GRAPH_H - PADDING.legend - CELL_H)
          .attr("fill", (d, i) => BLYLWRD[i]);

        // Tooltip
        const tooltip = d3
          .select("body")
          .append("div")
          .attr("id", "tooltip")
          .style("position", "absolute")
          .style("opacity", 0);

        // Cells
        const map = svg.append("g").attr("id", "cell-container");

        map
          .selectAll("rect")
          .data(monthlyVariance)
          .enter()
          .append("rect")
          .attr("class", "cell")
          .attr("height", CELL_H)
          .attr("width", CELL_W)
          .attr("data-month", (d) => d.month - 1)
          .attr("data-year", (d) => d.year)
          .attr("data-temp", (d) => d.variance + baseTemperature)
          .attr("x", (d) => xScale(d.year))
          .attr("y", (d) => yScale(d.month - 1))
          .attr(
            "fill",
            (d) =>
              BLYLWRD[Math.floor((d.variance + Math.abs(extent[0])) / threshold)] ||
              BLYLWRD[10]
          )
          .on("mouseover", (e, d) => {
            const y = yScale(d.month - 1) - 85;
            tooltip
              .style("opacity", 0.8)
              .html(
                `${d.year} - ${d3.timeFormat("%B")(new Date(2000, d.month - 1))}<br>${(
                  d.variance + baseTemperature
                ).toFixed(2)} ℃<br>${d.variance.toFixed(2)} ℃`
              )
              .style("top", y + "px")
              .attr("data-year", d.year);

            const x =
              e.pageX +
              CELL_W / 2 -
              document.getElementById("tooltip").offsetWidth / 2;
            tooltip.style("left", x + "px");
          })
          .on("mouseout", () => {
            tooltip.html("").style("opacity", 0);
          });
      });
  } catch (error) {
    console.error("An error occurred:", error);
  }
})();