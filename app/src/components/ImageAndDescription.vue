<style lang="sass">
.imageWithDescription
	image-rendering: -webkit-optimize-contrast
</style>

<template>
  <div class="imageWithDescription">
    <v-row justify="center" class="mb-12">
      <v-col cols="12">
        <v-card color="transparent" class="elevation-3">
          <v-row class="ma-1">
            <v-col
              :cols="layout == 'side' ? 8 : 12"
              class="pl-6 pt-8 pb-8"
              style="background: #fdfdfd"
            >
              <v-img
                :src="image.link"
                :width="image.width"
                style="margin: 0 auto"
              >
                <template v-slot:placeholder>
                  <v-row
                    class="fill-height ma-0"
                    align="center"
                    justify="center"
                  >
                    <v-progress-circular
                      indeterminate
                      color="grey"
                    ></v-progress-circular>
                  </v-row>
                </template>
              </v-img>
            </v-col>
            <v-col
              :cols="calculateColumns"
              :class="layout == 'side' ? 'pl-5' : 'pl-12'"
            >
              <p
                class="pr-4 pl-6 pt-4 text-sm-body-2"
                style="color: #333"
                v-html="image.description"
              ></p>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
export default {
  name: "ImageAndDescription",
  props: {
    // takes the image object with link, description, and size, as well as layout - if there is text on the side of the image or at the bottom
    image: Object,
    layout: String,
  },
  computed: {
    calculateColumns: function () {
      if (this.layout === "side") {
        if (this.$vuetify.breakpoint.xs || this.$vuetify.breakpoint.sm) {
          return 10;
        } else {
          return 3;
        }
      } else {
        return 10;
      }
    },
  },
};
</script>
