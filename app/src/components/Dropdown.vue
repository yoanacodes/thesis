<style lang="sass">
.v-subheader
    font:
        weight: 800 !important
    color: #222 !important
    background: #eee
</style>

<template>
  <v-autocomplete
    v-if="isReady"
    v-model="selected"
    :items="items"
    item-text="label"
    item-value="value"
    :label="label"
    return-object
    color="blue-grey darken-3"
    :id="state"
    ref="myDropdown"
  >
  </v-autocomplete>
</template>

<script>
import { mapMutations } from "vuex";

export default {
  name: "Dropdown",
  props: {
    items: [Function, Array],
    label: String,
    state: String,
    default: [Object, String],
  },
  data: function () {
    return {
      selected: this.default,
    };
  },
  computed: {
    isReady() {
      return typeof this.items != "function";
    },
  },
  watch: {
    // when a value is selected, it updates the state in the store
    selected: function (selected) {
      this.saveSelectedState({ stateToSave: this.state, selected: selected });
      if (this.state === "nutrient" || this.state === "disease") {
        if (this.selected != null) {
          this.$store.dispatch("getDataset");
        }
      }
    },
  },
  methods: {
    ...mapMutations(["saveSelectedState"]),
  },
};
</script>
