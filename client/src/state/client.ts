import { createFetch } from '~/utils/fetch';

export const fetch = createFetch(window.fetch, {
  baseUrl: '/api',
});

// export const gqlQuery = <R, V extends { [key: string]: any }>({
//   query,
//   variables
// }: {
//   query: any; // TODO: implement
//   variables?: V;
// }) => {
//   return gqlFetch.request<R>("/", {
//     method: "post",
//     mode: "same-origin",
//     credentials: "same-origin",
//     cache: "no-cache",
//     headers: { "content-type": "application/json" }
//     // TODO: implement body
//   });
// };
