import Vue from "vue";
import Vuex from "vuex";
import axios from "axios";
import * as _ from "underscore";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    dataset: Object,
    dataIsReady: false,
    selectedPlotPoint: Object,
    filters: {
      healthFilters: Object,
      nutritionFilters: Object,
    },
    current_state: {
      data_load_progress: 0,
      nutrient: {
        value: 57,
        label: "Total Milk",
        serving_size: "grams per day",
        food_group: "Beverages",
      },
      disease: {
        value: 627,
        label: "Rheumatoid arthritis",
        parent_id: 626,
        parent_name: "Musculoskeletal disorders",
        level: 3,
      },
      country: "United States",
      size: { value: null, label: "Don't Size" },
      selected_region: [
        "Africa",
        "Asia",
        "Europe",
        "Latin America and the Caribbean",
        "Northern America",
        "Oceania",
      ],
      regression_line: false,
      hovered_region: false,
    },
    color_code: [
      "#93C5F1",
      "#f9c74f",
      "#43aa8b",
      "#B79AD1",
      "#f94144",
      "#dfa3a3",
    ],
  },
  getters: {
    get_country_list(state) {
      if (!state.dataIsReady) return;
      return _.pluck(state.dataset, "country");
    },
    get_region_list(state) {
      if (!state.dataIsReady) return;
      return _.sortBy(_.unique(_.pluck(state.dataset, "region")));
    },
  },
  mutations: {
    saveDataLoadProgress(state, payload) {
      state.current_state.data_load_progress = payload.data_load_progress;
    },
    saveData(state, payload) {
      state.dataset = payload.dataset.data;
      state.dataIsReady = payload.dataIsReady;
      // console.log(state.dataset);
    },
    saveHealthFilters(state, payload) {
      state.filters.healthFilters = payload.healthFilters;
      // console.log('saveHealthFilters: ', payload.healthFilters[1]);
    },
    saveNutritionFilters(state, payload) {
      state.filters.nutritionFilters = payload.nutritionFilters;
      // console.log('saveNutritionFilters: ', payload.nutritionFilters[1]);
    },
    updateSelectedPlotPoint(state, payload) {
      state.selectedPlotPoint = payload.selectedPlotPoint;
      // console.log("received: ", payload.selectedPlotPoint);
    },
    saveSelectedState(state, payload) {
      state.current_state[payload.stateToSave] = payload.selected;
      // console.log(state.current_state[payload.stateToSave], payload)
    },
  },
  actions: {
    // make an API call when data is changed and on load of the application (with preset values)
    getDataset({ commit, state }, payload) {
      const test_data = "data/data_cached.json";
      const api = "https://dvthesis.herokuapp.com/relationships?"; // "http://localhost:5000/relationships?";

      // // cached data for one relationship
      // return axios
      //   .get(test_data)
      //   .then(response => {
      //     // console.log(response.data)
      //     commit('saveData', {dataset: response.data, dataIsReady: true});
      //   });

      // commit to store the progress of the API call - used to display progress circle while scatterplot is loading
      commit("saveDataLoadProgress", { data_load_progress: 0 });
      return axios
        .get(api, {
          params: {
            nutrient_id: state.current_state.nutrient.value,
            disease_id: state.current_state.disease.value,
          },
          onDownloadProgress: (progressEvent) => {
            const progress = parseInt(
              Math.round((progressEvent.loaded * 100) / progressEvent.total)
            );
            commit("saveDataLoadProgress", { data_load_progress: progress });
          },
        })
        .then((response) => {
          commit("saveData", { dataset: response.data, dataIsReady: true });
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    // get static JSON with filters for health data - label, value, parent
    // initiates on load of the application
    // nests the data for display purposes
    getHealthFilters({ commit, dispatch }, payload) {
      return axios
        .get("data/health_filters_curated.json")
        .then((response) => {
          return dispatch("addMenuHeaders", {
            data: response.data,
            groupKey: "parent_name",
          });
        })
        .then((response) => {
          commit("saveHealthFilters", {
            healthFilters: response,
            dataIsReady: true,
          });
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    // get static JSON with filters for nutrition data - label, value, food gorup
    // initiates on load of the application
    // nests the data so each nutrient has their foog group as parent for display purposes
    getNutritionFilters({ commit, dispatch }, payload) {
      return axios
        .get("data/nutrition_filters.json")
        .then((response) => {
          return dispatch("addMenuHeaders", {
            data: response.data,
            groupKey: "food_group",
          });
        })
        .then((response) => {
          commit("saveNutritionFilters", {
            nutritionFilters: response,
            dataIsReady: true,
          });
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    // function to nest the data - health and nutrition filters data - to have a header (parent) label - used in dropdowns to structure the data visually and enhance UX/UI
    addMenuHeaders({ commit, state }, payload) {
      let data = payload.data,
        groupByKey = payload.groupKey;

      let group_menu = [];

      _.chain(data)
        .groupBy(groupByKey)
        .mapObject((values, groupName) => {
          group_menu.push({ header: groupName });
          values = _.sortBy(values, "label");
          _.each(values, (v) => {
            group_menu.push(v);
          });
        })
        .value();
      return group_menu;
    },
  },
});
