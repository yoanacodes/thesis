<style lang="sass">
#visualizations
  h2
    max-width: 1000px
    margin: 0 auto
    font:
      size: 30pt !important
      weight: 200 !important
    line-height: 1em
    span
      font-weight: 300 !important
  #tooltip
      position: absolute
      min-width: 150px
      min-height: 70px
      background-color: #222
      color: #fff
      padding: 10px
      display: none
      opacity: 0
</style>

<template>
  <v-row justify="center" v-if="dataIsReady" id="visualizations">
    <v-col cols="12" class="elevation-0">
      <Filters />
      <v-row class="text-center" no-gutters>
        <v-col cols="12">
          <h2 class="mb-2">
            Relationship between <span>{{ selectedNutritionLabel }}</span> and
            <span>{{ selectedDiseaseLabel }}</span>
          </h2>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="9">
          <Scatterplot />
        </v-col>
        <v-col cols="3">
          <SidePanel />
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script>
import { mapState } from "vuex";
import Scatterplot from "@/components/Scatterplot";
import Filters from "@/components/Filters";
import SidePanel from "@/components/SidePanel";

export default {
  name: "Visualizations",
  components: {
    Scatterplot,
    Filters,
    SidePanel,
  },
  data: () => ({
    progressBarValue: 0,
  }),
  computed: {
    ...mapState([
      "dataset",
      "dataIsReady",
      "selectedPlotPoint",
      "current_state",
    ]),
    selectedDiseaseLabel() {
      if (this.current_state.disease) {
        return this.current_state.disease.label;
      }
    },
    selectedNutritionLabel() {
      if (this.current_state.nutrient) {
        // make first character of the nutrition label string uppercase, all others lowercase
        let selectedNutritionLabel =
          this.current_state.nutrient.label.toLowerCase();
        return (
          selectedNutritionLabel.charAt(0).toUpperCase() +
          selectedNutritionLabel.slice(1)
        );
      }
    },
  },
};
</script>
