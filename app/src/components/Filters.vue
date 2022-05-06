<template>
  <v-row no-gutters justify="center">
    <v-col cols="4">
      <Dropdown
        :items="filters.nutritionFilters"
        label="Select Nutrition"
        state="nutrient"
        :default="current_state.nutrient"
        class="mr-6"
      />
    </v-col>
    <v-col cols="6">
      <Dropdown
        :items="filters.healthFilters"
        label="Select Condition"
        state="disease"
        :default="current_state.disease"
        class="mr-6"
      />
    </v-col>
  </v-row>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import Dropdown from "./Dropdown";

export default {
  name: "Filters",
  components: {
    Dropdown,
  },
  data: function () {
    return {
      selected_region: "",
      select: "",
      strokesCount: 0,
    };
  },
  computed: {
    ...mapState(["filters", "current_state", "color_code", "dataIsReady"]),
    ...mapGetters(["get_country_list", "get_region_list"]),
  },
};
</script>
