<style lang="sass">
.axis
    path
        stroke: #888
    .tick
        line
            stroke: #888
        text
            fill: #888
            font-size: 8pt
text.label
    fill: #555
    font-size: 8pt

.regression
    stroke: #777
    stroke-width: 2px

#progressWrapper
    position: fixed
    top: 40%
    left: 42%
    z-index: 1000
    background-color: #fff
    max-width: 50px
    max-height: 50px
</style>

<template>
  <v-row class="text-right" no-gutters>
    <v-col cols="12">
      <div id="progressWrapper">
        <v-progress-circular
          v-if="current_state.data_load_progress != 100"
          indeterminate
          :size="80"
          :width="8"
          v-model="progressBarValue"
          :buffer-value="current_state.data_load_progress"
          color="#37474F"
        ></v-progress-circular>
      </div>

      <v-btn
        depressed
        x-small
        dark
        color="#333"
        style="position: relative; top: 25px"
        @click="resetZoom"
        >reset zoom</v-btn
      >
      <div
        :style="{ opacity: current_state.data_load_progress == 100 ? 1 : 0.3 }"
        id="scatterplot"
      ></div>
    </v-col>
  </v-row>
</template>

<script>
import * as d3 from "d3";
import { mapState, mapMutations, mapGetters } from "vuex";
import { regressionLinear } from "d3-regression";

export default {
  name: "Scatterplot",
  data: () => ({
    progressBarValue: 0,
    width: 800,
    height: 500,
    margin: { top: 40, right: 40, bottom: 60, left: 80 },
    svg: Object,
    selectedCountry: Object,
    style: {
      highlightPointColor: "#FF3D00",
      vizBackground: "#fff",
      circleRadius: 6,
      circleColors: {
        default: "#444",
        pushedBack: "#ddd",
        selectedCountryUnactiveRegion: "#555",
      },
      circleOpacity: {
        default: 0.7,
        pushedBack: 0.5,
        disappearing: 0,
        highlighted: 0.9,
        decreased: 0.2,
      },
      circleStroke: {
        color: "#9d9d9d",
        highlighted: "#222",
        width: 1,
        thick: 3,
      },
    },
  }),
  computed: {
    ...mapState([
      "dataset",
      "dataIsReady",
      "selectedPlotPoint",
      "current_state",
      "color_code",
    ]),
    ...mapGetters(["get_region_list"]),
    filteredDataset() {
      return this.dataset.filter((d) => {
        return this.current_state.selected_region.indexOf(d["region"]) >= 0;
      });
    },
    isReady() {
      return typeof this.dataset != "function" && this.dataset.length
        ? true
        : false;
    },
    svgHeight() {
      return this.height + this.margin.top + this.margin.bottom;
    },
    svgWidth() {
      return this.width + this.margin.left + this.margin.right;
    },
    xScale() {
      const xScale = d3
        .scaleLinear()
        .domain([0, d3.max(this.dataset.map((value) => value.nutrient))])
        .range([0, this.width])
        .nice();
      return xScale;
    },
    yScale() {
      const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(this.dataset.map((value) => value.disease))])
        .range([this.height, 0])
        .nice();
      return yScale;
    },
    populationRadiusScale() {
      return d3.scaleSqrt([0, 5e8], [0, this.width / 24]);
    },
    colorMap() {
      const colorMap = d3
        .scaleOrdinal()
        .domain(this.get_region_list)
        .range(this.color_code);
      return colorMap;
    },
    regression() {
      const regression = regressionLinear()
        .x((d) => d.nutrient)
        .y((d) => d.disease);

      const regressionLine = regression(this.dataset);
      return regression;
    },
    zoom() {
      const zoom = d3
        .zoom()
        .scaleExtent([1, 8])
        .translateExtent([
          [0, 0],
          [this.svgWidth, this.svgHeight],
        ])
        .on("zoom", this.zoomed);
      return zoom;
    },
    tooltip() {
      return d3.select("#tooltip");
    },
  },
  mounted() {
    if (this.isReady) this.render();
  },
  watch: {
    dataset: function () {
      if (!this.isReady) return;

      if (!d3.select("svg > g").empty()) {
        this.updateScatter();
      }

      if (this.current_state.regression_line) {
        this.addRegressionLine();
      } else {
        this.removeRegressionLine();
      }
    },
    "current_state.regression_line": function () {
      if (this.current_state.regression_line) {
        this.addRegressionLine();
      } else {
        this.removeRegressionLine();
      }
    },
    "current_state.size": function () {
      // console.log("changing size...");
      this.updateCircleSize();
    },
    "current_state.hovered_region": function () {
      // console.log("changing hovered...");
      this.updateCircleColorOnHover();
    },
    "current_state.selected_region": function () {
      this.manageCirclesStyles();
    },
    "current_state.country": function () {
      // console.log("country selected...");
      this.manageCirclesStyles();
    },
  },
  methods: {
    ...mapMutations(["updateSelectedPlotPoint"]),
    zoomed: function ({ transform }) {
      const zx = transform.rescaleX(this.xScale);
      const zy = transform.rescaleY(this.yScale);

      d3.select(".highlight-circle").style("display", "none");

      // calculate and draw voronoi after zoom
      d3.select(".voronoiWrapper")
        .selectAll("path")
        .attr("d", (d, i) => {
          return this.voronoi(zx, zy, i);
        })
        .on("mouseover", (event, d) => {
          this.highlightPoint(zx, zy, d, event);
          this.showTooltip(event, d);
        })
        .on("mouseleave", (event, d) => {
          this.hideTooltip();
          this.removeHighlightPoint(zx, zy, d);
        });

      d3.select("g.xAxis").call(d3.axisBottom(zx));

      d3.select("g.yAxis").call(d3.axisLeft(zy));

      d3.select("g.scatterCircles")
        .selectAll("circle")
        .attr("cx", (d) => zx(d.nutrient))
        .attr("cy", (d) => zy(d.disease));
    },
    // draw the SVG elenent and the clip path to which all other elements from the visualization relate
    drawSvg: function () {
      this.svg = d3
        .select("#scatterplot")
        .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${this.svgWidth} ${this.svgHeight}`)
        .classed("svg-content", true)
        .append("g")
        .attr(
          "transform",
          "translate(" + this.margin.left + "," + this.margin.top + ")"
        );

      // create clip path for the visualization
      this.svg
        .append("defs")
        .append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("id", "clip-rect")
        .attr("x", "0")
        .attr("y", "0")
        .attr("width", this.width)
        .attr("height", this.height);
    },
    // render the svg content - axes, datapoints
    render: function () {
      d3.select("#scatterplot svg").remove();

      this.drawSvg();

      this.svg.call(this.zoom).call(this.zoom.transform, d3.zoomIdentity);

      // create axes
      this.svg
        .append("g")
        .attr("class", "axis xAxis")
        .attr("transform", "translate(0," + this.height + ")")
        .call(d3.axisBottom(this.xScale));

      this.svg
        .append("g")
        .attr("class", "axis yAxis")
        .call(d3.axisLeft(this.yScale));

      // add x axis label
      this.svg
        .append("text")
        .attr("class", "label x-label")
        .attr("text-anchor", "end")
        .attr("x", this.width + 5)
        .attr("y", this.height + 35)
        .text(
          `${this.current_state.nutrient.label} - ${this.current_state.nutrient.food_group} (${this.current_state.nutrient.serving_size})`
        );

      // add y axis label
      this.svg
        .append("text")
        .attr("class", "label y-label")
        .attr("text-anchor", "end")
        .attr("y", -60)
        .attr("dx", "0.2em")
        .attr("transform", "rotate(-90)")
        .text(`${this.current_state.disease.label} - Prevalence per 100k`);

      // create the scatterplot points
      this.svg
        .append("g")
        .attr("class", "scatterCircles")
        .selectAll("circle")
        .data(this.dataset)
        .enter()
        .append("circle")
        .attr("id", (d) => `circle_${d["iso"]}`)
        .attr("cx", (d) => this.xScale(d.nutrient))
        .attr("cy", (d) => this.yScale(d.disease))
        .attr("r", (d) => this.style.circleRadius)
        .attr("stroke", (d) => {
          // if there is a selected country from the dropdown, and this is the country, use highlighted stroke, all other countries use default stroke color
          return this.current_state.country &&
            d.country === this.current_state.country
            ? this.style.circleStroke.highlighted
            : this.style.circleStroke.color;
        })
        .attr("stroke-width", (d) => {
          // assign thicker stroke on the selected country, all others use default
          return this.current_state.country &&
            d.country === this.current_state.country
            ? this.style.circleStroke.thick
            : this.style.circleStroke.width;
        })
        .attr("fill", (d) => {
          // if there is a selected country from the dropdown
          if (this.current_state.country) {
            // conditions for the country that has been selected:
            if (d.country === this.current_state.country) {
              // if the region the country is from is not selected in the checkboxes (the legend)
              if (
                this.current_state.selected_region.indexOf(d["region"]) ===
                  -1 ||
                this.current_state.hovered_region
              ) {
                return this.style.circleColors.selectedCountryUnactiveRegion;
              } else {
                // if the region of the selected country is selected from the checkboxes
                return this.colorMap(d["region"]);
              }
              // conditions for all other countries, that are not the selected country
            } else {
              return this.colorMap(d["region"]); //'#999'
            }
          } else {
            return this.colorMap(d["region"]);
          }
        })
        .style("opacity", (d) => {
          // if there is a selected country from the dropdown
          if (this.current_state.country) {
            // make the selected country with higher opacity
            if (d.country === this.current_state.country) {
              return this.style.circleOpacity.highlighted;
              // make all other countries with lower opacity
            } else {
              return this.style.circleOpacity.pushedBack;
            }
            // if there is no selected country from the dropdown, all country circles take the default opacity
          } else {
            return this.style.circleOpacity.default;
          }
        })
        .attr("clip-path", "url(#clip)");

      // attach the Voronoi
      this.svg
        .append("g")
        .attr("class", "voronoiWrapper")
        .selectAll("path")
        .data(this.dataset)
        .join("path")
        .attr("id", (d) => d["iso"])
        // .style("opacity", 0.5)
        // .attr("stroke", "#098")
        .attr("fill", "none")
        .style("pointer-events", "all")
        .attr("d", (d, i) => {
          return this.voronoi(this.xScale, this.yScale, i);
        })
        .on("mouseover", (event, d) => {
          this.highlightPoint(this.xScale, this.yScale, d, event);
          this.showTooltip(event, d);
        })
        .on("mouseleave", (event, d) => {
          this.hideTooltip();
          this.removeHighlightPoint(this.xScale, this.yScale, d);
        });

      // append regression line
      this.svg
        .append("line")
        .attr("class", "regression")
        .style("display", "none");

      this.updateCircleSize();
    },
    // function to update the circles of the scatterplot using the data from the new dataset. Executed when users make a change of
    // selected nutrition or selected condition from the dropdowns
    updateScatter: function () {
      // console.log("updating...", this.dataset);
      this.updateCircleSize();

      let dataset = this.dataset;

      // update x axis
      this.svg
        .select(".axis.xAxis")
        .transition()
        .duration(500)
        .call(d3.axisBottom(this.xScale));

      // update y axis
      this.svg
        .select(".axis.yAxis")
        .transition()
        .duration(500)
        .call(d3.axisLeft(this.yScale));

      // update x axis text
      this.svg
        .select(".label.x-label")
        .transition()
        .duration(500)
        .text(
          `${this.current_state.nutrient.label} - ${this.current_state.nutrient.food_group} (${this.current_state.nutrient.serving_size})`
        );

      // update y axis text
      this.svg
        .select(".label.y-label")
        .transition()
        .duration(500)
        .text(`${this.current_state.disease.label} - Prevalence per 100k`);

      // update circles
      let sizeValue = this.current_state.size.value;

      this.svg
        .select("g.scatterCircles")
        .selectAll("circle")
        .data(dataset)
        .transition()
        .duration(500)
        .attr("id", (d) => `circle_${d["iso"]}`)
        .attr("cx", (d) => {
          return this.xScale(d.nutrient);
        })
        .attr("cy", (d) => {
          return this.yScale(d.disease);
        })
        .attr("r", (d) => {
          // change the raius based on whether a sizing has been selected from the dropdown
          // if no sizing is selected, use default value
          if (sizeValue == null) {
            return this.style.circleRadius;
          }
          // if population is selected, scale using the populationRadiusScale()
          else if (sizeValue == "pop") {
            return d[sizeValue] != 999
              ? this.populationRadiusScale(d["pop"])
              : 0;
          }
          // calculate scale for obesity
          else if (sizeValue == "obesity") {
            return d[sizeValue] != 999 ? d[sizeValue] / 4 : 0;
          }
          // calculate scale for overweight
          else if (sizeValue == "overweight") {
            return d[sizeValue] != 999 ? d[sizeValue] / 10 : 0;
          }
          // calculate scale for underweight
          else if (sizeValue == "underweight") {
            return d[sizeValue] != 999 ? d[sizeValue] : 0;
          }
        })
        .attr("stroke", (d) => {
          // define the stroke color based on whether there is a selected country from the dropdown or not
          return this.current_state.country &&
            d.country === this.current_state.country
            ? this.style.circleStroke.highlighted
            : this.style.circleStroke.color;
        })
        .attr("stroke-width", (d) => {
          // define the stroke width based on whether there is a selected country from the dropdown or not
          return this.current_state.country &&
            d.country === this.current_state.country
            ? this.style.circleStroke.thick
            : this.style.circleStroke.width;
        })
        .attr("fill", (d) => {
          // if there is a selected country from the dropdown
          if (this.current_state.country) {
            // conditions only for the selected country
            if (d.country === this.current_state.country) {
              // if the country belongs to a region that is not active (selected in the checkboxes legend)
              if (
                this.current_state.selected_region.indexOf(d["region"]) ===
                  -1 ||
                this.current_state.hovered_region
              ) {
                return this.style.circleColors.selectedCountryUnactiveRegion;
              }
              // if the country belongs to a region that is active, use default color map
              else {
                return this.colorMap(d["region"]);
              }
            }
            // styles for all not selected countries (when there is a selected country)
            else {
              // if the country is not selected from the dropdown, and the region is disselected from the checkboxes legend
              if (
                this.current_state.selected_region.indexOf(d["region"]) ===
                  -1 ||
                this.current_state.hovered_region
              ) {
                return this.style.circleColors.pushedBack;
              }
              // if the region is selected from the checkboxes
              else {
                return this.colorMap(d["region"]);
              }
            }
          }
          // if there is no selected country from the dropdown
          else {
            // if the region is not selected form the checkboxes
            if (
              this.current_state.selected_region.indexOf(d["region"]) === -1 ||
              this.current_state.hovered_region
            ) {
              return this.style.circleColors.pushedBack;
            }
            // if the region is selected form the checkboxes
            else {
              return this.colorMap(d["region"]);
            }
          }
        })
        .style("opacity", (d) => {
          // if there is a selected country from the country dropdown
          if (this.current_state.country) {
            // styles for the selected country
            if (d.country === this.current_state.country) {
              return this.style.circleOpacity.highlighted;
            }
            // styles for all other countries
            else {
              return this.style.circleOpacity.pushedBack;
            }
          }
          // if there is no selected country, all points get default opacity
          else {
            return this.style.circleOpacity.default;
          }
        })
        .attr("clip-path", "url(#clip)");

      this.svg.selectAll(".voronoiWrapper").remove();

      this.svg
        .append("g")
        .attr("class", "voronoiWrapper")
        .selectAll("path")
        .data(dataset)
        .join("path")
        .attr("id", (d) => d["iso"])
        // .style("opacity", 0.5)
        // .attr("stroke", "#ff1493")
        .attr("fill", "none")
        .style("pointer-events", "all")
        .attr("d", (d, i) => {
          return this.voronoi(this.xScale, this.yScale, i);
        })
        .on("mouseover", (event, d) => {
          this.highlightPoint(this.xScale, this.yScale, d, event);
          this.showTooltip(event, d);
        })
        .on("mouseleave", (event, d) => {
          this.hideTooltip();
          this.removeHighlightPoint(this.xScale, this.yScale, d);
        });
    },
    addRegressionLine: function () {
      // draw regression line
      d3.select("line.regression")
        .style("display", "block")
        .datum(this.regression(this.dataset))
        .attr("x1", (d) => 0)
        .attr("x2", (d) => 0)
        .attr("y1", (d) => this.yScale(d[0][1]))
        .attr("y2", (d) => 0);

      d3.select("line.regression")
        .datum(this.regression(this.dataset))
        .transition()
        .duration(500)
        .attr("x1", (d) => this.xScale(d[0][0]))
        .attr("x2", (d) => this.xScale(d[1][0]))
        .attr("y1", (d) => this.yScale(d[0][1]))
        .attr("y2", (d) => this.yScale(d[1][1]))
        .style("display", "block")
        .attr("clip-path", "url(#clip)");
    },
    removeRegressionLine: function () {
      // remove regression line
      d3.select("line.regression").style("display", "none");
    },
    // reset zoom with button click
    resetZoom: function () {
      this.svg
        .transition()
        .duration(750)
        .call(this.zoom.transform, d3.zoomIdentity);
    },
    // function to update circle sizes when a selection of size scaling is made
    updateCircleSize: function () {
      // console.log('updateCircleSize')
      if (!this.current_state.size.hasOwnProperty("value")) return;

      // get value of the selected option from the size dropdown, cache to check which option is selected
      // and assign styles
      let sizeValue = this.current_state.size.value;

      d3.selectAll(".v-input").style("pointer-events", "none");

      d3.select("g.scatterCircles")
        .selectAll("circle")
        .transition()
        .duration(500)
        .attr("r", (d) => {
          // selected value is don't size - use default radius
          if (sizeValue == null) {
            return this.style.circleRadius;
          } else if (sizeValue == "pop") {
            return d[sizeValue] != 999
              ? this.populationRadiusScale(d["pop"])
              : 0;
          } else if (sizeValue == "obesity") {
            return d[sizeValue] != 999 ? d[sizeValue] / 4 : 0;
          } else if (sizeValue == "overweight") {
            return d[sizeValue] != 999 ? d[sizeValue] / 10 : 0;
          } else if (sizeValue == "underweight") {
            return d[sizeValue] != 999 ? d[sizeValue] : 0;
          }
        });

      // prevent hovering of the legend checkboxes to trigger and prevent the sizing event
      setTimeout((d) => {
        d3.selectAll(".v-input").style("pointer-events", "all");
      }, 510);
    },
    updateCircleColorOnHover: function () {
      // when a checkbox is hovered, push all circles not in this region to the back (lower opacity)
      let hovered_region = this.current_state.hovered_region;
      let selected_region = this.current_state.selected_region;
      let opacity = this.style.circleOpacity;
      let color = this.style.circleColors;
      let stroke = this.style.circleStroke;
      let selected_country = this.current_state.country;
      let vueThis = this;

      d3.select("g.scatterCircles")
        .selectAll("circle")
        .transition()
        .duration(700)
        .style("opacity", function (d) {
          // if there is no hovered region, all regions are default - reset default values
          if (hovered_region === false) {
            // styles for selected country from the dropdown
            if (selected_country && d.country === selected_country) {
              // this is the selected country
              // d3.select(this).raise();
              return opacity.highlighted;
            }
            // styles for all other countries which are not the selected one
            else {
              // if the region is active (selected in the checkboxes)
              if (selected_region.indexOf(d.region) >= 0) {
                return selected_country ? opacity.pushedBack : opacity.default;
              } else {
                // the region is not active (disselected in the checkboxes)
                return opacity.pushedBack;
              }
            }
          } else {
            // a region is hovered, and a country is selected
            // styles for the selected country
            if (selected_country && d.country === selected_country) {
              // if the region of the selected country is the one users hover over
              if (d.region === hovered_region) {
                d3.select(this).raise();
              }
              return opacity.highlighted;
            }
            //
            else {
              // styles for the hovered region
              if (d.region === hovered_region) {
                // the region is selected from the checkboxes
                if (selected_region.indexOf(d.region) >= 0) {
                  d3.select(this).raise();
                  // return opacity.default;
                  return opacity.default;
                }
                // the region is not selected in the checkboxes
                else {
                  return opacity.pushedBack;
                }
              }
              // styles for all other regions, that are not hovered over
              else {
                return opacity.pushedBack;
              }
            }
          }
        })
        .attr("fill", (d) => {
          // if a region is not hovered
          if (hovered_region === false) {
            // restore the color of the selected country
            if (selected_country && d.country === selected_country) {
              // if the region is not selected from the checkboxes
              if (selected_region.indexOf(d["region"]) === -1) {
                return color.selectedCountryUnactiveRegion;
              }
              // the region is selected from the checkboxes
              else {
                return vueThis.colorMap(d["region"]);
              }
            }
            // user hovers over a region
            else {
              // if the region's checkbox is on (selected)
              if (selected_region.indexOf(d.region) >= 0) {
                // restore the color coding
                return vueThis.colorMap(d["region"]);
              } else {
                // make the circles gray
                return color.pushedBack;
              }
            }
          } else {
            // a region is hovered and the current country matches a selected country from the dropdown
            if (selected_country && d.country === selected_country) {
              // this is the selected country
              // d3.select(this).raise();
              // the region is active in the checkboxes legend and is the one hovered over
              if (
                selected_region.indexOf(d.region) >= 0 &&
                d.region === hovered_region
              ) {
                return vueThis.colorMap(d["region"]);
              }
              // when the region is not active in the checkboxes
              else {
                return color.selectedCountryUnactiveRegion;
              }
            }
            // styles for the region that is hovered
            else {
              // this is the hovered region
              if (d.region === hovered_region) {
                // the region is active in the checkboxes legend
                if (selected_region.indexOf(d.region) >= 0) {
                  // return opacity.default;
                  return vueThis.colorMap(d["region"]);
                } else {
                  // the region is not active in the checkboxes legend
                  return color.pushedBack;
                }
              } else {
                // the region is not the hovered one
                return color.pushedBack;
              }
            }
          }
        })
        .attr("stroke-width", (d) => {
          // styles for the selected country (if there is a selected country)
          if (selected_country && d.country === selected_country) {
            return "3pt";
          }
          // default size for all other countries
          else {
            return this.style.circleStroke.width;
          }
        })
        .attr("stroke", (d) => {
          // assign stroke color on the selected country and all other countries
          return selected_country && d.country === selected_country
            ? stroke.highlighted
            : stroke.color;
        });
    },
    manageCirclesStyles: function () {
      // when a region checkbox is clicked, it changes the  colors of the circles accordingly
      let opacity = this.style.circleOpacity;
      let color = this.style.circleColors;
      let stroke = this.style.circleStroke;
      let selected_country = this.current_state.country;

      // filter out nulls (representing the not selected checkboxes)
      let selectedRegions = this.current_state.selected_region.filter(
        (region) => {
          // returns a list of only active regions in the checkbox legend
          return region !== null;
        }
      );

      d3.select("g.scatterCircles")
        .selectAll("circle")
        .transition()
        .duration(1000)
        .style("opacity", function (d) {
          // if this region's checkbox is deselected
          if (selectedRegions.indexOf(d.region) < 0) {
            // the selected country is in a deselected region
            if (selected_country && d.country === selected_country) {
              d3.select(this).raise();
              return opacity.highlighted;
            } else {
              // country not selected or not from this region
              return opacity.pushedBack;
            }
          }
          // if this region's checkbox is selected
          else {
            // add more opacity to selected country
            if (selected_country && d.country === selected_country) {
              d3.select(this).raise();
              return opacity.highlighted;
            } else {
              return opacity.default;
            }
          }
        })
        .attr("fill", (d) => {
          if (selectedRegions.length === 0) {
            // there are no selected regions
            return color.default;
          } else {
            // there are selected regions but this region is not selected
            if (selectedRegions.indexOf(d.region) < 0) {
              // and there is a highlighted country
              if (selected_country && d.country === selected_country) {
                // selected country from this region

                return color.selectedCountryUnactiveRegion;
              }
              // assign color to all other countries
              else {
                return color.pushedBack;
              }
            } else {
              // this region is selected in the checkboxes legend
              return this.colorMap(d["region"]);
            }
          }
        })
        .attr("stroke-width", (d) => {
          // assign thicker stroke to selected country
          if (selected_country && d.country === selected_country) {
            return "3pt";
          } else {
            return this.style.circleStroke.width;
          }
        })
        .attr("stroke", (d) => {
          // assign black stroke to the selected country
          return selected_country && d.country === selected_country
            ? stroke.highlighted
            : stroke.color;
        });
    },
    // create text for the tooltip and show it on hover
    showTooltip: function (event, d) {
      if (this.current_state.data_load_progress < 100) return;

      let format_people = d3.format(",.0f");
      let toopltipText = `<span id="ttpCountry">${d.country}</span>
                            <span class="population">${format_people(
                              d.pop
                            )} people</span>
                            <span class="caption font-weight-medium">${
                              this.current_state.nutrient.label
                            } consumption:</span>
                            <span class="caption text-uppercase mb-1"> ${format_people(
                              d.nutrient
                            )} ${
        this.current_state.nutrient.serving_size
      }</span>
                            <span class="caption font-weight-medium">${
                              this.current_state.disease.label
                            } prevalence:</span>
                            <span class="caption text-uppercase"> ${format_people(
                              d.disease
                            )} people per 100k
                            (~${format_people(
                              (d.disease / 100000) * d.pop
                            )} people)
                            </span>
                            `;

      this.tooltip
        .style("display", "block")
        .transition()
        .duration(500)
        .style("opacity", 1);

      let activeCircle = d3
        .select(`#circle_${event.srcElement.id}`)
        .node()
        .getBoundingClientRect();

      this.tooltip
        .style("left", activeCircle.x + activeCircle.width / 2 + 20 + "px")
        .style(
          "top",
          activeCircle.y -
            this.tooltip.node().getBoundingClientRect().height / 2 +
            "px"
        )
        .style("pointer-events", "none")
        .html(toopltipText);
    },
    // make tooltip invisible when mouse leaves the scatterplot
    hideTooltip: function () {
      this.tooltip
        .style("display", "none")
        // .transition()
        // .duration(500)
        .style("opacity", 0);
    },
    // calculate Voronoi
    voronoi(x, y, i) {
      return d3.Delaunay.from(
        this.dataset,
        (d) => x(d.nutrient),
        (d) => y(d.disease)
      )
        .voronoi([0, 0, this.width, this.height])
        .renderCell(i);
    },
    // create a highlighting point to show which exact country users hover over in the scatterplot
    highlightPoint(x, y, d, event) {
      if (this.current_state.data_load_progress < 100) return;

      let current_hovered_id = event.srcElement.id;

      d3.select("g.scatterCircles")
        .selectAll("circle")
        .style("opacity", (d) => {
          // assign opacity on the selected country (if any)
          return this.current_state.country &&
            d.country === this.current_state.country
            ? this.style.circleOpacity.highlighted
            : this.style.circleOpacity.pushedBack;
        });

      d3.select(`#circle_${current_hovered_id}`)
        .attr("stroke", this.style.highlightPointColor)
        .attr("stroke-width", "3pt")
        .style("opacity", (d) => {
          d3.select(this).raise();
          return this.style.circleOpacity.highlighted;
        });
    },
    // remove the highlighting circle once users no longer hover over the point
    removeHighlightPoint(x, y, d) {
      d3.select("g.scatterCircles")
        .selectAll("circle")
        .attr("stroke", (d) => {
          // assign stroke to selected country, if any
          return this.current_state.country &&
            d.country === this.current_state.country
            ? this.style.circleStroke.highlighted
            : this.style.circleStroke.color;
        })
        .attr("stroke-width", (d) => {
          return this.current_state.country &&
            d.country === this.current_state.country
            ? this.style.circleStroke.thick
            : this.style.circleStroke.width;
        })
        .style("opacity", (d) => {
          // assign opacity to selected country, if any
          if (
            this.current_state.country &&
            d.country === this.current_state.country
          ) {
            this.style.circleOpacity.highlighted;
          }
          // assign opacity to all other countries
          else {
            return this.current_state.country
              ? this.style.circleOpacity.pushedBack
              : this.style.circleOpacity.default;
          }
        });
    },
  },
};
</script>
