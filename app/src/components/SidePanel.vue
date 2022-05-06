<style lang="sass">
#sidePanel
  margin-top: 30px
  .v-input--checkbox
      .v-label
          left: -5px !important

  .v-tooltip__content.menuable__content__active
      opacity: 1!important
  .v-icon.notranslate.v-icon--dense.mdi.mdi-checkbox-marked.theme--light
      opacity: 0.7 !important
</style>

<template>
  <v-card class="pl-3" id="sidePanel">
    <v-row no-gutters>
      <v-col cols="10" class="mt-2">
        <Dropdown
          :items="get_country_list"
          label="Highlight Country"
          state="country"
          :default="current_state.country"
          class="ml-2"
        />
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col cols="10">
        <Dropdown
          :items="sizeBy"
          label="Size Circles By"
          state="size"
          :default="current_state.size"
          class="ml-2"
        />
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col cols="12" class="mt-6">
        <!-- draw the legend checkboxes -->
        <span class="ml-2 mr-2 text-button">Highlight Region</span>
        <template v-for="(region, index) in get_region_list">
          <v-checkbox
            v-model="selected_region[index]"
            :color="color_code[index]"
            :value="region"
            hide-details
            :dense="true"
            :key="index"
            class="ml-2 mr-2"
          >
            <template v-slot:label>
              <span class="text-sm-body-2">{{ region }}</span>
            </template>
          </v-checkbox>
        </template>
      </v-col>
    </v-row>

    <!-- add/remove regression line switch and tooltip -->
    <v-row>
      <v-col cols="10">
        <v-card class="ma-0 pa-0" elevation="0">
          <v-card-actions class="ma-0 pa-0">
            <v-switch
              v-model="regressionLine"
              inset
              dense
              class="ml-4"
              color="blue-grey darken-3"
            >
              <template v-slot:label>
                <span style="margin: -1px 0 0 -7px" class="caption">{{
                  regressionLine == true
                    ? `Remove Regression Line`
                    : `Add Regression Line`
                }}</span>
              </template>
            </v-switch>

            <v-tooltip top nudge-left="35" color="#fff" max-width="400">
              <template v-slot:activator="{ on, attrs }">
                <v-icon
                  style="margin-top: -12px"
                  class="ml-1"
                  small
                  dark
                  color="grey"
                  v-bind="attrs"
                  v-on="on"
                >
                  mdi-comment-question-outline
                </v-icon>
              </template>
              <div
                class="elevation-3 pa-5"
                style="color: #111 !important; opacity: 1"
              >
                The regression line gives a visual presentation of the
                relationship between two variables. The steepness of the angle
                of the regression line (slope) is the amount of change in "Y"
                that we can expect for any unit change in "X".
                <v-img src="images/regression_line.png" />
              </div>
            </v-tooltip>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-card>
</template>

<script>
import { mapState, mapGetters, mapMutations } from "vuex";
import Dropdown from "./Dropdown";
import * as d3 from "d3";

export default {
  name: "SidePanel",
  components: {
    Dropdown,
  },

  data: function () {
    return {
      hoveredRegion: false,
      selected_region: [
        "Africa",
        "Asia",
        "Europe",
        "Latin America and the Caribbean",
        "Northern America",
        "Oceania",
      ],
      sizeBy: [
        { value: null, label: "Don't Size" },
        { value: "pop", label: "Population" },
        { value: "obesity", label: "Obesity Rate" },
        { value: "overweight", label: "Overweight Rate" },
        { value: "underweight", label: "Underweight Rate" },
      ],
      regressionLine: false,
    };
  },
  computed: {
    ...mapState(["current_state", "color_code", "dataIsReady"]),
    ...mapGetters(["get_country_list", "get_region_list"]),
  },
  watch: {
    get_region_list: function () {
      this.regionHover();
    },
    // save the selected regions from the checkboxes to store on change
    selected_region: function (selected_region) {
      this.saveSelectedState({
        stateToSave: "selected_region",
        selected: selected_region,
      });
    },
    // save the state of the regression line - on or off - to store
    regressionLine: function (regressionLine) {
      this.saveSelectedState({
        stateToSave: "regression_line",
        selected: regressionLine,
      });
    },
  },
  mounted() {
    this.regionHover();
  },
  methods: {
    ...mapMutations(["saveSelectedState"]),
    // create the hovering interaction - on hover of a checkbox in the legend, save the value in store
    // if the region checkbox is disselected, the hover does not trigger store update
    regionHover: function () {
      let vueThis = this;
      d3.selectAll(".v-input")
        .on("mouseenter", function (event, d) {
          let currentLabel = d3.select(this).select("label").text();
          if (vueThis.selected_region.indexOf(currentLabel) >= 0) {
            vueThis.hoveredRegion = currentLabel;
            d3.select(this).style("background", "#eee");
            vueThis.saveSelectedState({
              stateToSave: "hovered_region",
              selected: currentLabel,
            });
          }
        })
        .on("mouseleave", function () {
          vueThis.hoveredRegion = false;
          d3.select(this).style("background", "#fff");
          vueThis.saveSelectedState({
            stateToSave: "hovered_region",
            selected: false,
          });
        });
    },
  },
};
</script>
