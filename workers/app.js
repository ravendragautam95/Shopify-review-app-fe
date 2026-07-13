import { createRequestHandler } from "react-router";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  async fetch(request, env, ctx) {
    try {
      return await requestHandler(request, {
        cloudflare: {
          env,
          ctx,
        },
      });
    } catch (e) {
      console.error(e);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};
