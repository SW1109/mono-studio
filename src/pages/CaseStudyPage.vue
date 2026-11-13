<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { findCaseStudy } from "../content/caseStudies.js";
import CaseStudyArticle from "../components/site/CaseStudyArticle.vue";
import NotFoundPage from "./NotFoundPage.vue";

const route = useRoute();
const study = computed(() => findCaseStudy(route.params.slug));
</script>

<template>
  <CaseStudyArticle v-if="study" :study="study" />
  <NotFoundPage v-else />
</template>
