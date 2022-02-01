export enum Method {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  HEAD = 'head',
  DELETE = 'delete',
  OPTIONS = 'options',
  TRACE = 'trace',
  CONNECT = 'connect',
  PATCH = 'patch',
}

const getRe = /^get$/i;
const postRe = /^post$/i;
const putRe = /^put$/i;
const headRe = /^head$/i;
const deleteRe = /^delete$/i;
const optionsRe = /^options$/i;
const traceRe = /^trace$/i;
const connectRe = /^connect$/i;
const patchRe = /^patch$/i;

export const sortMethods = (set: Set<string>): Set<Method> => {
  const methods: Set<Method> = new Set();

  let hasGet = false,
    hasPost = false,
    hasDelete = false,
    hasPatch = false,
    hasPut = false,
    hasOptions = false,
    hasTrace = false,
    hasHead = false,
    hasConnect = false;

  set.forEach(method => {
    hasGet = getRe.test(method);
    hasPost = postRe.test(method);
    hasPut = putRe.test(method);
    hasHead = headRe.test(method);
    hasDelete = deleteRe.test(method);
    hasOptions = optionsRe.test(method);
    hasTrace = traceRe.test(method);
    hasConnect = connectRe.test(method);
    hasPatch = patchRe.test(method);
  });

  hasGet && methods.add(Method.GET);
  hasPost && methods.add(Method.POST);
  hasPut && methods.add(Method.PUT);
  hasPatch && methods.add(Method.PATCH);
  hasDelete && methods.add(Method.DELETE);
  hasHead && methods.add(Method.HEAD);
  hasOptions && methods.add(Method.OPTIONS);
  hasTrace && methods.add(Method.TRACE);
  hasConnect && methods.add(Method.CONNECT);

  return methods;
};

export const parseMethod = (method: string): Method | null => {
  if (getRe.test(method)) return Method.GET;
  if (postRe.test(method)) return Method.POST;
  if (putRe.test(method)) return Method.PUT;
  if (headRe.test(method)) return Method.HEAD;
  if (deleteRe.test(method)) return Method.DELETE;
  if (optionsRe.test(method)) return Method.OPTIONS;
  if (traceRe.test(method)) return Method.TRACE;
  if (connectRe.test(method)) return Method.CONNECT;
  if (patchRe.test(method)) return Method.PATCH;

  return null;
};
