// <define:__ROUTES__>
var define_ROUTES_default = {
  version: 1,
  include: ["/plans/*"],
  exclude: []
};

// ../../../../home/agent_c3fa13a0-139b-473d-8dc6-9bf6872a0d9c/.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/pages-dev-pipeline.ts
import worker from "/workspace/b1dad3c3-c299-4187-ad1c-71e6d77b433a/sessions/agent_c3fa13a0-139b-473d-8dc6-9bf6872a0d9c/.wrangler/tmp/pages-vxULby/functionsWorker-0.20531340113044894.mjs";
import { isRoutingRuleMatch } from "/home/agent_c3fa13a0-139b-473d-8dc6-9bf6872a0d9c/.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/pages-dev-util.ts";
export * from "/workspace/b1dad3c3-c299-4187-ad1c-71e6d77b433a/sessions/agent_c3fa13a0-139b-473d-8dc6-9bf6872a0d9c/.wrangler/tmp/pages-vxULby/functionsWorker-0.20531340113044894.mjs";
var routes = define_ROUTES_default;
var pages_dev_pipeline_default = {
  fetch(request, env, context) {
    const { pathname } = new URL(request.url);
    for (const exclude of routes.exclude) {
      if (isRoutingRuleMatch(pathname, exclude)) {
        return env.ASSETS.fetch(request);
      }
    }
    for (const include of routes.include) {
      if (isRoutingRuleMatch(pathname, include)) {
        const workerAsHandler = worker;
        if (workerAsHandler.fetch === void 0) {
          throw new TypeError("Entry point missing `fetch` handler");
        }
        return workerAsHandler.fetch(request, env, context);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  pages_dev_pipeline_default as default
};
//# sourceMappingURL=6flkp8bhj3k.js.map
