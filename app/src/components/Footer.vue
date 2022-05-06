<style lang="sass">
#footer
  a
  color: #777 !important
  a:active
    color: #777 !important
  a:visited
    color: #777 !important
  a:link
    color: #777 !important
  a:hover
    color: #666 !important
    transition: 0.3s
</style>

<template>
  <v-footer id="footer" padless style="background: #fff">
    <v-col cols="6" class="text-left" style="font-size: 8pt; color: #333">
      MS Data Visualization Thesis, Parsons School of Design, NYC
    </v-col>

    <v-col cols="6" class="text-right" style="font-size: 9pt">
      <a href="https://yoanacodes.com" target="_blank">Portfolio</a>
      &nbsp;&nbsp;|&nbsp;&nbsp;
      <a href="mailto:yoana.kosturska@gmail.com">Contact: Yoana Kosturska</a>
      &nbsp;&nbsp;|&nbsp;&nbsp; &copy; 2022
    </v-col>
  </v-footer>
</template>

<script>
export default {
  name: "Footer",
};
</script>
