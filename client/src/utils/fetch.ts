import deepmerge from 'deepmerge';
import isPlainObject from 'is-plain-object';

export function createFetch(envFetch: FetchApi, defaults: Defaults = {}) {
  const interceptors: Interceptor[] = [];

  function intercept<T>(
    url: string,
    config?: RequestInit,
  ): Promise<TypedResponse<T>> {
    const reversedInterceptors = interceptors.reverse();

    let requestpromise = Promise.resolve<Args>({ url, config });
    reversedInterceptors.forEach(({ request, requestError }) => {
      requestpromise = requestpromise
        .then(args => {
          if (request) {
            return request(args.url, args.config);
          }
          return Promise.resolve(args);
        })
        .catch(error => {
          if (requestError) {
            return requestError(error);
          }
          return Promise.reject(error);
        });
    });

    let responsepromise = requestpromise.then(args => {
      return envFetch(args.url, args.config);
    });

    reversedInterceptors.forEach(({ response, responseError }) => {
      responsepromise = responsepromise
        .then(resp => {
          if (response) {
            return response(resp);
          }
          return resp;
        })
        .catch(error => {
          if (responseError) {
            return responseError(error);
          }
          return Promise.reject(error);
        });
    });

    return responsepromise;
  }

  return {
    request: <T>(url: string, config: RequestInit = {}) => {
      const { baseUrl, config: defaultConfig = {} } = defaults;
      const mergedUrl = baseUrl
        ? `${cleanUrl(baseUrl, 'suffix')}/${cleanUrl(url, 'prefix')}`
        : url;
      const mergedConfig = deepmerge.all([defaultConfig, config], {
        isMergeableObject: isPlainObject,
        arrayMerge: (destinationArray, sourceArray) => sourceArray,
      });
      return intercept<T>(mergedUrl, mergedConfig);
    },
    addInterceptor: (interceptor: Interceptor) => {
      interceptors.push(interceptor);
      return () => {
        const index = interceptors.indexOf(interceptor);
        if (index >= 0) {
          interceptors.splice(index, 1);
        }
      };
    },
    clearInterceptors: () => {
      interceptors.splice(0, interceptors.length);
    },
  };
}

export interface Interceptor {
  readonly request?: (
    url: string,
    config?: RequestInit,
  ) => Promise<Args> | Args;
  readonly requestError?: (error: any) => Promise<any>;
  readonly response?: (response: TypedResponse<any>) => TypedResponse<any>;
  readonly responseError?: (error: any) => Promise<any>;
}

export interface TypedBody<T> extends Body {
  json(): Promise<T>;
}

export interface TypedResponse<T> extends TypedBody<T> {
  readonly headers: Headers;
  readonly ok: boolean;
  readonly redirected: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly trailer: Promise<Headers>;
  readonly type: ResponseType;
  readonly url: string;
  clone(): TypedResponse<T>;
}

interface Args {
  readonly url: string;
  readonly config?: RequestInit;
}
type FetchApi = typeof fetch;

interface Defaults {
  readonly baseUrl?: string;
  readonly config?: Partial<RequestInit>;
}

const cleanUrl = (
  url: string | undefined,
  prefixsuffix: 'prefix' | 'suffix',
) => {
  if (!url) {
    return url;
  }
  if (prefixsuffix === 'prefix') {
    if (url[0] === '/') {
      return url.substr(1);
    }
  } else {
    if (url[url.length - 1] === '/') {
      return url.substring(0, url.length - 1);
    }
  }
  return url;
};
