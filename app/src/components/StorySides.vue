<style lang="sass">
#dotNav
  background: #fff
  color: #222
  border-radius: 5px
  padding: 10px
  z-index: 1000
  position: fixed
  left: 47%
  top: 2px

#projectTitle
  h2
    width: 100%
    text-align: center
    font:
      size: 36pt !important
  h3
    width: 100%
    text-align: center
    font:
      size: 16pt

.shortIntro
  max-width: 450px
  margin: 0 auto
  font:
    size: 11pt
    weight: 300
    margin-bottom: 20px
  line-height: 1.2em

  a
    color: #222
    text-decoration: underline

  a:link
    color: #222
    text-decoration: underline
    transition: color .4s ease-out

  a:visited
      color: #222
      text-decoration: underline

  a:hover
    color: #111 !important
    text-decoration: none

  a:active
    color: #111
    text-decoration: none
</style>

<template>
  <div>
    <v-item-group
      id="dotNav"
      v-model="currentSlide"
      class="shrink mr-6 elevation-0"
      mandatory
    >
      <v-item
        v-for="n in length"
        :key="n"
        v-slot="{ active, toggle }"
        style="float: left"
      >
        <div>
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                :input-value="active"
                icon
                x-small
                color="#888"
                @click="toggle"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon x-small>mdi-record</v-icon>
              </v-btn>
            </template>
            <span>{{ sideNavTooltip(n) }}</span>
          </v-tooltip>
        </div>
      </v-item>
    </v-item-group>

    <!-- create windows for the three views, navigated by the dot navigation -->
    <v-window v-model="currentSlide" class="elevation-0" vertical>
      <v-container id="app_container">
        <v-row
          id="projectTitle"
          justify="center"
          align="center"
          class="mt-4 ml-4"
        >
          <h2 class="text-overline font-weight-light">
            Is Food Making You Sick?
          </h2>
          <hr />
          <h3 class="h5 font-weight-thin ml-1 mt-2">
            Exploring the Relationship Between Nutrition and Health
          </h3>
        </v-row>

        <v-window-item :key="0">
          <v-card flat>
            <!-- <v-row class="text-center mb-12 mt-10"> -->
            <v-row class="text-center mt-10">
              <v-col cols="12">
                <h2 class="text-h5 font-weight-light mb-6">
                  <strong>Milk Consumption</strong> (gramps per day) per Country
                </h2>
                <p class="shortIntro">
                  <strong>Milk</strong> and milk products are oftentimes
                  promoted as very important for one's health, however, the
                  <a
                    href="https://www.researchgate.net/publication/281140866_Dairy_Products_and_Inflammation_A_Review_of_the_Clinical_Evidence"
                    target="_blank"
                    >research</a
                  >
                  on the topic is still contradictory. Some of the research
                  links dairy to increase in inflamation, which could have
                  negative impact on overall health.
                </p>
                <introSlidesViz variableToVisualize="nutrient" />
                <v-btn
                  class="ma-2 mt-12"
                  outlined
                  color="blue-grey darken-2"
                  x-large
                  @click="changeWindow($event, 1)"
                >
                  Next
                  <v-icon class="ml-1"
                    >mdi-arrow-down-drop-circle-outline</v-icon
                  >
                </v-btn>
              </v-col>
            </v-row>
          </v-card>
        </v-window-item>
        <v-window-item :key="1">
          <v-card flat>
            <v-row class="text-center mt-10">
              <v-col cols="12">
                <h2 class="text-h5 font-weight-light mb-6">
                  <strong>Rheumatoid Arthritis Prevalance</strong> per 100k per
                  Country
                </h2>
                <p class="shortIntro">
                  <strong>Rheumatoid arthritis</strong> is an autoimmune
                  disorder in which the body is attacking its own cells and
                  systems, primairly the joints.
                </p>
                <!-- <p class="shortIntro">
                  Researchers are not in agreement about the effects of diet on
                  patients living with the condition.
                  <a
                    href="https://www.frontiersin.org/articles/10.3389/fnut.2019.00141/full"
                    target="_blank"
                    >Some</a
                  >
                  studies find a link between milk consumption and rheumatoid
                  arthritis, while
                  <a
                    href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6893662/"
                    target="_blank"
                    >others</a
                  >
                  refute such relationship exists.
                </p> -->
                <introSlidesViz variableToVisualize="disease" />
                <p style="width: 310px; margin: 0 auto" class="mt-10">
                  Now let's see if there is any relationship between milk
                  consumption and rheumatoid arthritis
                </p>
                <v-btn
                  class="ma-2 mt-4"
                  outlined
                  color="blue-grey darken-2"
                  x-large
                  @click="changeWindow($event, 2)"
                >
                  Explore the data
                  <v-icon class="ml-1"
                    >mdi-arrow-down-drop-circle-outline</v-icon
                  >
                </v-btn>
              </v-col>
            </v-row>
          </v-card>
        </v-window-item>

        <v-window-item :key="2">
          <v-card flat>
            <Visualizations />
          </v-card>
        </v-window-item>
      </v-container>
    </v-window>
  </div>
</template>

<script>
import Visualizations from "@/components/Visualizations.vue";
import introSlidesViz from "@/components/introSlidesViz.vue";

export default {
  name: "StorySlides",
  components: {
    Visualizations,
    introSlidesViz,
  },
  data: () => ({
    length: 3,
    currentSlide: 0,
  }),
  computed: {},
  mounted() {
    if (this.currentSlide == 2) {
      document.getElementById("projectTitle").classList.add("hide");
    }
  },
  watch: {
    currentSlide: function () {
      document.getElementById("projectTitle").classList.remove("hide");

      if (this.currentSlide == 2) {
        document.getElementById("projectTitle").classList.add("hide");
      }
    },
  },
  methods: {
    // functionality to switch slides with the dot nav
    changeWindow: function (e, switchToNextWindow) {
      // console.log("this window:", this.currentSlide, switchToNextWindow);
      this.currentSlide = switchToNextWindow;
    },
    // tooltips of the different windows/views in the dot nav
    sideNavTooltip(n) {
      if (n === 1) {
        return "(Total) milk consumption";
      } else if (n === 2) {
        return "Rheumatoid arthritis prevalence";
      } else {
        return "Explore the data";
      }
    },
  },
};
</script>
