import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import { ServerRouter } from "react-router";
import { addDocumentResponseHeaders } from "./shopify.server";

export default async function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  reactRouterContext,
) {
  addDocumentResponseHeaders(request, responseHeaders);
  const userAgent = request.headers.get("user-agent");
  const isBot = isbot(userAgent || "");

  const stream = await renderToReadableStream(
    <ServerRouter context={reactRouterContext} url={request.url} />,
    {
      onError(error) {
        responseStatusCode = 500;
        console.error(error);
      },
    }
  );

  if (isBot) {
    await stream.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");

  return new Response(stream, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
