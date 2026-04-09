import { onRequestPost as __api_purge_cache_js_onRequestPost } from "/workspace/b1dad3c3-c299-4187-ad1c-71e6d77b433a/sessions/agent_c3fa13a0-139b-473d-8dc6-9bf6872a0d9c/functions/api/purge-cache.js"
import { onRequest as __api_purge_cache_js_onRequest } from "/workspace/b1dad3c3-c299-4187-ad1c-71e6d77b433a/sessions/agent_c3fa13a0-139b-473d-8dc6-9bf6872a0d9c/functions/api/purge-cache.js"
import { onRequest as __plans__slug__js_onRequest } from "/workspace/b1dad3c3-c299-4187-ad1c-71e6d77b433a/sessions/agent_c3fa13a0-139b-473d-8dc6-9bf6872a0d9c/functions/plans/[slug].js"
import { onRequest as __plans_index_js_onRequest } from "/workspace/b1dad3c3-c299-4187-ad1c-71e6d77b433a/sessions/agent_c3fa13a0-139b-473d-8dc6-9bf6872a0d9c/functions/plans/index.js"

export const routes = [
    {
      routePath: "/api/purge-cache",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_purge_cache_js_onRequestPost],
    },
  {
      routePath: "/api/purge-cache",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_purge_cache_js_onRequest],
    },
  {
      routePath: "/plans/:slug",
      mountPath: "/plans",
      method: "",
      middlewares: [],
      modules: [__plans__slug__js_onRequest],
    },
  {
      routePath: "/plans",
      mountPath: "/plans",
      method: "",
      middlewares: [],
      modules: [__plans_index_js_onRequest],
    },
  ]