<style lang="sass">
#processWrapper
  #projectTitle
    .about
      max-width: 700px
      text-align: center
      font:
        family: "Times New Roman", Times, serif
        size: 14pt

  .dataSources
    display: block
    text-align: center
    span
      font-size: 10pt

  a
    color: #666
    text-decoration: none

  a:link
    color: #666
    text-decoration: none
    transition: color .4s ease-out

  a:visited
      color: #666
      text-decoration: none

  a:hover
    color: #111 !important
    text-decoration: none

  a:active
    color: #111
    text-decoration: none

  .majorSection
    font:
      weight: 200
      size: 46pt

  h3
    font:
      size: 16pt
      weight: 600
    text-transform: uppercase
</style>

<template>
  <v-container class="mb-12" id="processWrapper">
    <v-row
          id="projectTitle"
          justify="center"
          align="center"
          class="mt-4"
        >
        <h2 class="text-overline font-weight-light">
          Is Food Making You Sick?
        </h2>
        <h3 class="h5 font-weight-thin ml-1 mt-2">
          Exploring the Relationship Between Nutrition and Health
        </h3>

        <div v-html="concatenateAboutString" class="mt-10 about"></div>

    </v-row>
        <v-row class="dataSources">
            <span>Data Sources: 
            <br><a href="https://www.globaldietarydatabase.org/" target="_blank">Global Dietary Database</a><br>
            <a href="https://www.healthdata.org/gbd/2019" target="_blank">Global Burden of Diseases</a>
          </span>
        </v-row>

    <v-row justify="center" class="mb-6">
      <v-col cols="12">
        <h2 class="majorSection mt-12">PROCESS</h2>
        <h3 class="mb-4">Infrastructure</h3>
        <ProcessSection :codeView="process.infrastructure" />
      </v-col>
    </v-row>

    <v-row justify="center" class="mt-12 mb-12">
      <v-col cols="12">
        <h3 class="mb-4">Data Analysis</h3>
        <ProcessSection :codeView="process.data_analysis" />
      </v-col>
    </v-row>

    <v-row justify="center" class="mt-12 mb-12">
      <v-col cols="12">
        <h3 class="mb-4">Backend</h3>
        <ProcessSection :codeView="process.backend" />
      </v-col>
    </v-row>

    <v-row justify="center" class="mt-12 mb-12">
      <v-col cols="12">
        <h3 class="mb-4">Frontend</h3>
        <ProcessSection :codeView="process.frontend" />
      </v-col>
    </v-row>

    <v-row justify="center" class="mt-12 mb-12">
      <v-col cols="12">
        <h3 class="mb-4">Design</h3>
        <ProcessSection :codeView="process.design" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapState } from "vuex";
import ImageAndDescription from "@/components/ImageAndDescription.vue";
import ProcessSection from "@/components/ProcessSection.vue";

export default {
  name: "ProcessDialog",

  components: {
    ImageAndDescription,
    ProcessSection,
  },
  computed: {
    ...mapState(["filters"]),
    healthFiltersLength() {
      if (typeof this.filters.healthFilters === 'function' || !this.filters.healthFilters.length) return '84';
      let filtered = this.filters.healthFilters.filter(f => !f.hasOwnProperty('header'));
      return filtered.length;
    },
    nutritionFiltersLength() {
      if (typeof this.filters.nutritionFilters === 'function' || !this.filters.nutritionFilters.length) return '42';
      let filtered = this.filters.nutritionFilters.filter(f => !f.hasOwnProperty('header'));

      return filtered.length;
    },
    concatenateAboutString() {
      let about = `<p><i>Is Food Making You Sick?</i> is exploring the relationship between diet and health in 184 countries through the analysis and visualization of extensive data on nutritional factors and diseases. The project aims to study and visualize these relationships by juxtaposing ` + this.nutritionFiltersLength + ` nutrients and ` + this.healthFiltersLength + ` health conditions, allowing users to explore and analyze them.</p><p><i>Is Food Making You Sick?</i> will answer questions such as do countries that have a high fat diet, also struggle with heart disease? Are countries in which people are consuming high amounts of sugar also overburdened with diabetes? and many others. By exploring the patterns between food consumption and health outcomes, users could better inform their dietary choices and be empowered by high quality, research data rather than speculative data that often float around the Internet. Exposing the data visually could also spark discussion amongst researchers about less researched correlations, setting the stage for testing hypotheses and performing additional studies.</p>`
      return about
    }
  },
  data: function () {
    return {
      process: {
        infrastructure: {
          application_setup: [
            {
              link: "images/schema.png",
              description: "<i>Is Food Making You Sick?</i> is built by analyzing and extracting the dataset powering it, from almost 6 Gigabytes of raw data from two extensive static sources - the <a href='https://www.globaldietarydatabase.org/' target='_blank'>Global Dietary Database</a> and the <a href='https://www.healthdata.org/gbd/2019' target='_blank'>Global Burden of Diseases</a>. <p>As there is no existing API with these datasets, I created my own, storing the data in a MySQL database. The API layer is implemented in Node.js and Express and is hosted on Heroku. The front-end itself is built in d3.js, Vue, Vuex, and Vuetify<p>",
              width: "960px",
              layout: "side",
            },
          ],
        },
        data_analysis: {
          data_sources: [
            {
              link: "images/raw_datasources.png",
              description:
                "The raw data from the Global Dietary Database and the Global Burden of Diseases contains approximately 6 Gigabytes of CSV files. They were cleaned, analyzed and curated, resulting in over 3 million rows of data.",
              width: "960px",
              layout: "side",
            },
          ],
          data_cleanup: [
            {
              link: "images/data_cleaning_nutrition.png",
              description:
                "The data was cleaned, and prepared for injestion to the MySQL database with Python, Pandas and Matplotlib, resulting in two master dataframes.",
              width: "960px",
              layout: "side",
            },
          ],
          data_analysis: [
            {
              link: "images/data_analysis_scatterplots.png",
              description:
                "After the two datasets were prepared, the data was analyzed with Python and Pandas. In order to explore the correlations better, a series of scatterplots with regression line were created with Matplotlib and explored.",
              width: "960px",
              layout: "side",
            },
          ],
        },
        backend: {
          database: [
            {
              link: "images/database.png",
              description: "After cleaning, formatting, and analyzing the nutrition and health data, the two master datasets were injested in two MySQL tables. Additional metadata for country population and obesity, overweight, underweight rates from the World Bank and WHO respectively was added to the database in a separate table.",
              width: "960px",
              layout: "side",
            },
          ],
          api: [
            {
              link: "images/api.png",
              description:
                "The Node.js/Express API performs a JOIN on the three tables when users change their search parameters, and serves the data to the front-end.",
              width: "960px",
              layout: "side",
            },
          ],
        },
        frontend: {
          visualization: [
            {
              link: "images/visualization.png",
              description: "<i>Is Food Making You Sick?</i> allows users to explore the relationship between the nutrient and health condition they choose in an interactive scatterplot. <p>The experience and analytical capabilities of the visualization are enhanced by adding the option to plot the regression line, as well as contextualize the datapoints geographically and with metadata such as population size, obesity, overweight, or underweight rates, used to size the countries.</p>",
              width: "960px",
              layout: "side",
            },
          ],
          storytelling: [
            {
              link: "images/storytelling.png",
              description: "An important part of the design process was creating the storytelling part of the application. The data, its representation and distribution are presented in two separate views, allowing users to understand better what are the building blocks of the main visualization.",
              width: "960px",
              layout: "side",
            },
          ],
          
        },
        design: {
          ux_ui: [
            {
              link: "images/visualization_filtered.png",
              description: "The main goal is to empower users to explore any patterns, trends, and relationships by juxtaposing data on nutrition consumption and health outcomes. <p>To achieve this, the user interface incorporates several selections, which gives users the power to compare and analyze the data in a way that serves them best.</p><p>A challenge in designing and coding the user interface and experience was managing all of the states each datapoint can have.</p>",
              width: "960px",
              layout: "side",
            },
          ],
          sketches: [
            {
              link: "images/sketch.png",
              description: "After several considerations, the UI was sketched before starting development, in order to map the functionalities to the development process and plan it better.",
              width: "960px",
              layout: "side",
            },
          ],
        },
      },
    };
  },
  mounted() {},
  watch: {},
  methods: {},
};
</script>
