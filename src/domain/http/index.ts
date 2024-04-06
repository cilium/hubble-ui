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

export enum HTTPStatus {
  OK = 200,
  Created = 201,
  Accepted = 202,
  NonAuthoritativeInformation = 203,
  NoContent = 204,
  ResetContent = 205,
  PartialContent = 206,
  MultipleChoices = 300,
  MovedPermanently = 301,
  Found = 302,
  SeeOther = 303,
  NotModified = 304,
  UseProxy = 305,
  Unused = 306,
  TemporaryRedirect = 307,
  BadRequest = 400,
  Unauthorized = 401,
  PaymentRequired = 402,
  Forbidden = 403,
  NotFound = 404,
  MethodNowAllowed = 405,
  NotAcceptable = 406,
  ProxyAuthenticationRequired = 407,
  RequestTimeout = 408,
  Conflict = 409,
  Gone = 410,
  LengthRequired = 411,
  PreconditionRequired = 412,
  RequestEntryTooLarge = 413,
  RequestURITooLong = 414,
  UnsupportedMediaType = 415,
  RequestedRangeNotSatisfiable = 416,
  ExpectationFailed = 417,
  ImTeapot = 418,
  TooManyRequests = 429,
  InternalServerError = 500,
  NotImplemented = 501,
  BadGateway = 502,
  ServiceUnavailable = 503,
  GatewayTimeout = 504,
  HTTPVersionNotSupported = 505,
}

export const httpStatus = new Map([
  [HTTPStatus.OK, 'OK'],
  [HTTPStatus.Created, 'Created'],
  [HTTPStatus.Accepted, 'Accepted'],
  [HTTPStatus.NonAuthoritativeInformation, 'Non-Authoritative Information'],
  [HTTPStatus.NoContent, 'No Content'],
  [HTTPStatus.ResetContent, 'Reset Content'],
  [HTTPStatus.PartialContent, 'Partial Content'],
  [HTTPStatus.MultipleChoices, 'Multiple Choices'],
  [HTTPStatus.MovedPermanently, 'Moved Permanently'],
  [HTTPStatus.Found, 'Found'],
  [HTTPStatus.SeeOther, 'See Other'],
  [HTTPStatus.NotModified, 'Not Modified'],
  [HTTPStatus.UseProxy, 'Use Proxy'],
  [HTTPStatus.Unused, 'Unused'],
  [HTTPStatus.TemporaryRedirect, 'Temporary Redirect'],
  [HTTPStatus.BadRequest, 'Bad Request'],
  [HTTPStatus.Unauthorized, 'Unauthorized'],
  [HTTPStatus.PaymentRequired, 'Payment Required'],
  [HTTPStatus.Forbidden, 'Forbidden'],
  [HTTPStatus.NotFound, 'Not Found'],
  [HTTPStatus.MethodNowAllowed, 'Method Not Allowed'],
  [HTTPStatus.NotAcceptable, 'Not Acceptable'],
  [HTTPStatus.ProxyAuthenticationRequired, 'Proxy Authentication Required'],
  [HTTPStatus.RequestTimeout, 'Request Timeout'],
  [HTTPStatus.Conflict, 'Conflict'],
  [HTTPStatus.Gone, 'Gone'],
  [HTTPStatus.LengthRequired, 'Length Required'],
  [HTTPStatus.PreconditionRequired, 'Precondition Required'],
  [HTTPStatus.RequestEntryTooLarge, 'Request Entry Too Large'],
  [HTTPStatus.RequestURITooLong, 'Request-URI Too Long'],
  [HTTPStatus.UnsupportedMediaType, 'Unsupported Media Type'],
  [HTTPStatus.RequestedRangeNotSatisfiable, 'Requested Range Not Satisfiable'],
  [HTTPStatus.ExpectationFailed, 'Expectation Failed'],
  [HTTPStatus.ImTeapot, "I'm a teapot"],
  [HTTPStatus.TooManyRequests, 'Too Many Requests'],
  [HTTPStatus.InternalServerError, 'Internal Server Error'],
  [HTTPStatus.NotImplemented, 'Not Implemented'],
  [HTTPStatus.BadGateway, 'Bad Gateway'],
  [HTTPStatus.ServiceUnavailable, 'Service Unavailable'],
  [HTTPStatus.GatewayTimeout, 'Gateway Timeout'],
  [HTTPStatus.HTTPVersionNotSupported, 'HTTP Version Not Supported'],
]);
