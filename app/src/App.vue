<style lang="sass">
html
  overflow-x: auto !important

.v-window
  overflow: inherit !important
.v-toolbar

h1
  span#projectSubtitle
    display: block
    margin: -14px 0 0 0
    text-transform: capitalize
    font:
      weight: 300
    color: #222

.hide
  display: none !important
nav
  a
    color: #555
    margin: 0 0 0 10px
    text-decoration: none
    border-bottom: 2px solid  #fff
    font:
      size: 10pt
      weight: 400

  a:link
    color: #555
    text-decoration: none
    transition: color .4s ease-out

  a:visited
      color: #555
      text-decoration: none

  a:hover
    color: #333 !important
    text-decoration: none
    border-bottom: 2px solid  #222
    transition: color .4s ease-out, border-color .65s ease-out

  a:active
    color: #222
    text-decoration: none

#tooltip
  position: absolute
  min-width: 150px
  min-height: 70px
  max-width: 320px
  background-color: #fff
  color: #222
  padding: 10px
  display: block
  opacity: 0
  border-radius: 5px

  span
    display: block
    font:
      size: 12pt
      weight: 400
  span#ttpCountry
    font:
      size: 16pt
      weight: 600
  span.population
    margin: -5px 0 10px 0
  span.ttpCountry
    font:
      weight: 600
      size: 14pt
  span.ttpDescription
    display: block
    font:
      weight: 400
      size: 11pt

#app_container
  margin-top: 20px
  min-width: 1275px !important
  max-width: 1450px !important
  overflow-x: scoll
  width: 100%
  margin-bottom: 100px
</style>

<template>
  <v-app>
    <v-app-bar app color="#fff" dense flat class="elevation-1">
      <h1 class="text-button">
        Is Food Making You Sick?
        <!-- <span id="projectSubtitle" class="text-caption">
          Exploring the relationship between nutrition and health</span
        > -->
      </h1>

      <v-spacer></v-spacer>

      <nav>
        <a href="">Home</a>
        <v-dialog
          v-model="dialog"
          transition="dialog-top-transition"
          fullscreen
        >
          <template v-slot:activator="{ on, attrs }">
            <a href="#" v-bind="attrs" v-on="on">Process</a>
          </template>

          <v-card outlined>
            <v-toolbar color="#fff" class="elevation-0">
              <v-spacer></v-spacer>
              <v-btn large icon color="primary" @click.native="dialog = false">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-toolbar>
            <ProcessDialog />
          </v-card>
        </v-dialog>

        <a href="https://github.com/yoanacodes/thesis" target="_blank"
          >Source Code</a
        >
      </nav>
    </v-app-bar>

    <v-main>
      <StorySides />
    </v-main>
    <Footer />

    <div id="tooltip" class="elevation-7" />
  </v-app>
</template>

<script>
import { mapState } from "vuex";
import ProcessDialog from "@/components/ProcessDialog";
import StorySides from "@/components/StorySides";
import Footer from "./components/Footer.vue";
import * as _ from "../node_modules/underscore";

export default {
  name: "App",
  components: {
    ProcessDialog,
    StorySides,
    Footer,
  },
  data: () => ({
    dialog: false,
  }),
  computed: {
    ...mapState(["dataset", "dataIsReady"]),
  },
  mounted() {
    // get the filters and preselected data on load of the application
    this.$store.dispatch("getDataset");
    this.$store.dispatch("getHealthFilters");
    this.$store.dispatch("getNutritionFilters");
  },
  watch: {
    dialog: function () {
      if (this.dialog) {
        document.getElementById("dotNav").classList.add("hide");
      } else {
        document.getElementById("dotNav").classList.remove("hide");
      }
    },
  },
};
</script>
