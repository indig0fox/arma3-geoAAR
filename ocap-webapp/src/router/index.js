import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/:catchAll(.*)",
      // route to worlds
      redirect: "/worlds",
    },
    {
      path: "/worlds",
      name: "worlds",
      component: () => import("../views/WorldsList.vue"),
    },
    {
      // path: "/world/:worldname",
      path: "/world/:worldname",
      name: "worldViewer",
      component: () => import("../views/WorldViewer.vue"),
      props: true,
    },
    {
      path: "/recordings",
      name: "recordings",
      component: () => import("../views/RecordingsList.vue"),
    },
    {
      path: "/ocap",
      name: "ocap",
      component: () => import("../views/OCAPView.vue"),
    },
    {
      path: "/recording/:recordingid",
      name: "recordingViewer",
      component: () => import("../views/OCAPView.vue"),
      props: true,
    },
    {
      path: "/about",
      name: "about",
      component: () => import("../views/AboutPage.vue"),
    },
  ],
});

export default router;
