<style lang="sass">
.ttpUSA
  position: absolute
  min-width: 150px
  min-height: 60px
  color: #111
  padding: 10px
  max-width: 260px
  border-radius: 5px
  text-align: left
  display: none
  opacity: 1
  border: 4px solid rgb(249, 65, 68) //#f94144 !important

.ttpDescription
  display: block
  font:
    weight: 400
    size: 11pt
.ttpCountry
  font:
    weight: 600
    size: 14pt

  span
    display: block
    font:
      weight: 500
</style>

<template>
  <div :id="variableToVisualize">
    <div id="introViz"></div>

    <div class="ttp ttpUSA elevation-1"></div>
  </div>
</template>

<script>
import * as d3 from "d3";
import * as _ from "underscore";
import { mapState } from "vuex";

export default {
  name: "introSlidesViz",
  props: {
    variableToVisualize: String,
  },
  data: () => ({
    // define styles
    defaultStrokeColor: "#ddd",
    defaultStrokeWidth: 1,
    colorUSA: "#f94144",
    highlightedStrokeColor: "#111",
    highlightedStrokeWidth: 3,
    hoveredCircleFill: "#fff",
    defaultCircleColor: "#444",
    defaultOpacity: 0.4,
    fullOpacity: 1,
    width: 150,
    height: 500,
    margin: { top: 30, right: 10, bottom: 10, left: 10 },
    svg: Object,
    radius: 7,
  }),
  computed: {
    ...mapState(["dataset", "dataIsReady"]),
    isReady() {
      return this.dataIsReady && this.dataset ? true : false;
    },
    svgHeight() {
      return this.height + this.margin.top + this.margin.bottom;
    },
    svgWidth() {
      return this.width + this.margin.left + this.margin.right;
    },
    xScale() {
      const xScale = d3.scaleLinear().domain([0, 1]).range([0, this.width]);
      return xScale;
    },
    yScale() {
      const yScale = d3
        .scaleLinear()
        .domain([
          0,
          d3.max(
            this.dataset.map((value) =>
              this.variableToVisualize === "nutrient"
                ? value.nutrient
                : value.disease
            )
          ),
        ])
        .range([this.height, 0])
        .nice();
      return yScale;
    },
    // compute Voronoi
    voronoi() {
      let dataForVoronoi = this.variableToVisualize;
      return d3.Delaunay.from(
        this.dataset,
        (d) => 0,
        (d) => this.yScale(d[dataForVoronoi])
      ).voronoi([75, 0, this.width, this.height]);
    },
  },
  mounted() {
    if (this.isReady) this.render();
  },
  watch: {
    dataIsReady: function () {
      if (this.isReady) this.render();
    },
  },
  methods: {
    // render the visualization
    // based on the prop variableToVisualize that is passed, it renders either nutrition data (Milk consumption) or health data (Rheumatoid Arthritis)
    render: function () {
      this.svg = d3
        .select(`#${this.variableToVisualize} > #introViz`)
        .append("svg")
        .attr("width", this.svgWidth)
        .attr("height", this.svgHeight)
        .append("g")
        .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

      // draw Y axis
      this.svg
        .append("g")
        .attr("class", "axis y-axis")
        .call(d3.axisLeft(this.yScale))
        .style("transform", `translateX(${this.width / 2}px`);

      // // draw circles
      let circles = this.svg
        .append("g")
        .attr("class", "circle")
        .selectAll("circle")
        .data(this.dataset)
        .enter()
        .append("circle")
        .attr("id", (d) => `intro_circle_${d.iso}`)
        .attr("cx", `${this.width / 2 + 30}px`)
        .attr("cy", (d) =>
          this.variableToVisualize === "nutrient"
            ? this.yScale(d.nutrient)
            : this.yScale(d.disease)
        )
        .attr("r", this.radius)
        .attr("fill", (d) => {
          return d.country === "United States"
            ? this.colorUSA
            : this.defaultCircleColor;
        })
        .attr("stroke", this.defaultStrokeColor)
        .attr("stroke-width", this.defaultStrokeWidth)
        .attr("opacity", (d) => {
          return d.country === "United States"
            ? this.fullOpacity
            : this.defaultOpacity;
        });

      this.svg
        .append("text")
        .attr("x", this.width / 2)
        .attr("y", 0 - this.margin.top / 2 - 30)
        .attr("class", "vizTitle")
        .attr("text-anchor", "middle")
        .text(
          this.variableToVisualize === "nutrient"
            ? `grams of Milk per day</p>.`
            : `Rheumatoid Arthritis prevalence per 100k.</p>`
        );

      this.addUsaDescription();

      // Voronoi
      let voronoi = this.svg
        .append("g")
        .attr("class", "y-voronoi")
        .selectAll("path")
        .data(this.dataset)
        .join("path")
        .attr("id", (d) => `intro_path_${d.iso}`)
        .attr("opacity", 0.5)
        // .attr("stroke", "pink")
        .attr("stroke", "none")
        .attr("fill", "none")
        .style("pointer-events", "all")
        .attr("d", (d, i) => {
          return this.voronoi.renderCell(i);
        })
        .on("mouseenter", (event, d) => {
          this.resetCircleStyle();
        })
        .on("mousemove", (event, d) => {
          this.onHover(event, d);
        })
        .on("mouseleave", (event, d) => {
          this.onMouseLeave();
        });
    },
    addUsaDescription: function () {
      // draw persistent tooltip for USA
      let USA = this.dataset.filter((d) => d.country === "United States")[0];
      let format_people = d3.format(",.0f");

      let ttpText =
        this.variableToVisualize === "nutrient"
          ? `<p><span class="ttpCountry">${USA.country}</span> <span class="ttpDescription">Milk consumption is ${USA.nutrient} grams of per day</span></p>`
          : `<p><span class="ttpCountry">${
              USA.country
            }</span><span class="ttpDescription"> Rheumatoid Arthritis prevalence is ${
              USA.disease
            } per 100k people</span></p>
          </span>
          <span  class="ttpDescription"> Approximately ${format_people(
            (USA.disease / 100000) * USA.pop
          )} people in the United States are living with Rheumatoid Arthritis
          </span>`;

      d3.select(`#${this.variableToVisualize}`)
        .select(".ttpUSA")
        .style("display", "block")
        .style("top", this.variableToVisualize === "nutrient" ? "57%" : "34%")
        .style("left", this.variableToVisualize === "nutrient" ? "55%" : "55%")
        .html(ttpText);
    },
    // creates text and makes visible tooltip for all countries
    // triggers on hover of a circle
    onHover: function (event, d) {
      let format_people = d3.format(",.0f");
      let ttpText =
        this.variableToVisualize === "nutrient"
          ? `<p><span class="ttpCountry">${d.country}</span> <span class="ttpDescription">Milk consumption is ${d.nutrient} grams of per day</span></p>`
          : `<p><span class="ttpCountry">${
              d.country
            }</span> <span class="ttpDescription">Rheumatoid Arthritis prevalence is ${
              d.disease
            } per 100k people</span></p><p> <span class="ttpDescription">  Approximately ${format_people(
              (d.disease / 100000) * d.pop
            )} people living with Rheumatoid Arthritis in ${d.country}
                            </span></p>`;

      d3.select("#tooltip")
        .style("left", event.pageX + 20 + "px")
        .style("top", event.pageY - 20 + "px")
        .html(ttpText)
        .style("display", "block")
        .transition()
        .duration(300)
        .style("opacity", 1);

      let currentVoronoiPathIso = event.srcElement.id.split("_")[2];

      d3.select(`#${this.variableToVisualize}`)
        .select(`#intro_circle_${currentVoronoiPathIso}`)
        // .transition()
        // .duration(500)
        .attr("fill", this.hoveredCircleFill)
        .attr("opacity", 1)
        .attr("stroke", this.highlightedStrokeColor)
        .attr("stroke-width", this.highlightedStrokeWidth)
        .raise();
    },
    // reset circle color and stroke styles once the country is no longer hovered
    resetCircleStyle: function () {
      d3.select(`#${this.variableToVisualize}`)
        .select("#introViz")
        .selectAll("circle")
        // .transition()
        // .duration(500)
        .attr("fill", (d) => {
          return d.country === "United States"
            ? this.colorUSA
            : this.defaultCircleColor;
        })
        .attr("stroke", this.defaultStrokeColor)
        .attr("stroke-width", this.defaultStrokeWidth)
        .attr("opacity", (d) => {
          return d.country === "United States"
            ? this.fullOpacity
            : this.defaultOpacity;
        });
    },
    // makes the tooltip invisible
    onMouseLeave: function () {
      d3.select("#tooltip")
        .transition()
        .duration(200)
        .style("opacity", 0)
        .style("display", "none");

      this.resetCircleStyle();
    },
  },
};
</script>
