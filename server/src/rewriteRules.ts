// Copyright 2019 Authors of Hubble
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import * as uuid from "uuid";

export function getNewRewriteRuleId(
  appId: string,
  appVersion: string,
  idGenerator?: () => string
): string {
  return `${appId}:${appVersion}:${idGenerator ? idGenerator() : uuid.v4()}`;
}

export function getHttpRules(
  appId: string,
  appVersion: string,
  idGenerator?: () => string
) {
  return [
    {
      uriRewriteRule: {
        regexp: String.raw`^/.*\\\\.(:?html|js|js\\\\.map|css\\\\.map|jpg|jpeg|gif|png|ico|css|woff)$`
      },
      methodRewriteRule: { regexp: String.raw`^(.*)$` }
    },
    {
      uriRewriteRule: {
        regexp: String.raw`^/.*\.(:?html|js|js\.map|css\.map|jpg|jpeg|gif|png|ico|css|woff)$`
      },
      methodRewriteRule: { regexp: String.raw`^GET$` }
    },
    {
      uriRewriteRule: {
        // Source: http://blog.dieweltistgarnichtso.net/constructing-a-regular-expression-that-matches-uris
        regexp: String.raw`^/([A-Za-z0-9_~:?#@&'*+,;=%\(\)\$\!\[\]\.\-]+)/[[:xdigit:]]{8}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{12}$`
      },
      methodRewriteRule: { regexp: String.raw`^(.*)$` }
    },
    {
      uriRewriteRule: {
        regexp: String.raw`^/([A-Za-z0-9_~:?#@&'*+,;=%\(\)\$\!\[\]\.\-]+)/[[:xdigit:]]{8}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{12}/([[:alpha:]]+)$`
      },
      methodRewriteRule: { regexp: String.raw`^(.*)$` }
    },
    {
      uriRewriteRule: {
        regexp: String.raw`^/([A-Za-z0-9_~:?#@&'*+,;=%\(\)\$\!\[\]\.\-]+)/[0-9]+$`
      },
      methodRewriteRule: { regexp: String.raw`^(.*)$` }
    },
    {
      uriRewriteRule: {
        regexp: String.raw`^/([A-Za-z0-9_~:?#@&'*+,;=%\(\)\$\!\[\]\.\-]+)/[0-9]+/([A-Za-z0-9_~:?#@&'*+,;=%\(\)\$\!\[\]\.\-]+)$`
      },
      methodRewriteRule: { regexp: String.raw`^(.*)$` }
    },
    {
      uriRewriteRule: {
        regexp: String.raw`^/([A-Za-z0-9_~:?#@&'*+,;=%\(\)\$\!\[\]\.\-]+)/([[:alpha:]]+)$`
      },
      methodRewriteRule: { regexp: String.raw`^(.*)$` }
    },
    {
      uriRewriteRule: {
        // aggregate /jobs/application?onsuccess=true?test=false
        // to /jobs/application?.*
        regexp: String.raw`^/(.*)\?.*$`
      },
      methodRewriteRule: { regexp: String.raw`^(.*)$` }
    },
    {
      uriRewriteRule: {
        // If we see two valid URI elements seperated by '/', do not aggregate them.
        // for example, we'd like to keep /v1/request-handle unchanged
        // after aggregation.
        regexp: String.raw`^/([A-Za-z0-9_~:?#@&'*+,;=%\(\)\$\!\[\]\.\-]+)/([A-Za-z0-9_~:?#@&'*+,;=%\(\)\$\!\[\]\.\-]+)$`
      },
      methodRewriteRule: { regexp: String.raw`^(.*)$` }
    },
    // added for customer to support /api/v1/something/something
    {
      uriRewriteRule: {
        regexp: String.raw`^/(api)/(v[0-9]+)/([A-Za-z\-\./]+)$`
      },
      methodRewriteRule: { regexp: String.raw`^(.*)$` }
    },
    // added as failsafe for above rule
    {
      uriRewriteRule: {
        regexp: String.raw`^/(api)/(v[0-9]+)/([A-Za-z\-\./]+)/.*$`
      },
      methodRewriteRule: { regexp: String.raw`^(.*)$` }
    },
    {
      uriRewriteRule: {
        regexp: String.raw`^/([A-Za-z0-9_~:?#@&'*+,;=%\(\)\$\!\[\]\.\-]+)/.*$`
      },
      methodRewriteRule: { regexp: String.raw`^(.*)$` }
    },
    {
      uriRewriteRule: { regexp: String.raw`^(.*)$` },
      methodRewriteRule: { regexp: String.raw`^(.*)$` }
    }
  ].map(rule => ({
    id: getNewRewriteRuleId(appId, appVersion, idGenerator),
    ...rule
  }));
}

export function getElasticSearchRules(
  appId: string,
  appVersion: string,
  idGenerator?: () => string
) {
  return [
    {
      // search on index using GET/POST(suggest)
      uriRewriteRule: { regexp: String.raw`^/([^/]+)/_search/??[^/]*$` },
      methodRewriteRule: { regexp: String.raw`^(GET|POST)$` }
    },
    {
      // search on type using GET/POST(suggest)
      // TODO: support search on multiple indexes/types
      uriRewriteRule: {
        regexp: String.raw`^/([^/]+)/([^/]+)/_search/??[^/]*$"`
      },
      methodRewriteRule: { regexp: String.raw`^(GET|POST)$` }
    },
    {
      // count on index using GET
      uriRewriteRule: { regexp: String.raw`^/([^/]+)/_count/??[^/]*$` },
      methodRewriteRule: { regexp: String.raw`^(GET)$` }
    },
    {
      // count on type using GET
      uriRewriteRule: { regexp: String.raw`^/([^/]+)/([^/]+)/_count/??[^/]*$` },
      methodRewriteRule: { regexp: String.raw`^(GET)$` }
    },
    {
      // validate on index using GET
      uriRewriteRule: { regexp: String.raw`^/([^/]+)/_validate/??[^/]*$` },
      methodRewriteRule: { regexp: String.raw`^(GET)$` }
    },
    {
      // validate on type using GET
      uriRewriteRule: {
        regexp: String.raw`^/([^/]+)/([^/]+)/_validate/??[^/]*$`
      },
      methodRewriteRule: { regexp: String.raw`^(GET)$` }
    },
    {
      // multi-search on index using GET
      uriRewriteRule: { regexp: String.raw`^/([^/]+)/_msearch/??[^/]*$` },
      methodRewriteRule: { regexp: String.raw`^(GET)$` }
    },
    {
      // Get source directly
      uriRewriteRule: { regexp: String.raw`^/([^/]+)/([^/]+)/[^/]+/_source$` },
      methodRewriteRule: { regexp: String.raw`^(GET|HEAD)$` }
    },
    {
      // create using PUT
      uriRewriteRule: { regexp: String.raw`^/([^/]+)/([^/]+)/[^/]+/_create$` },
      methodRewriteRule: { regexp: String.raw`^(PUT)$` }
    },
    {
      // update using POST
      uriRewriteRule: { regexp: String.raw`^/([^/]+)/([^/]+)/[^/]+/_update$` },
      methodRewriteRule: { regexp: String.raw`^(POST)$` }
    },
    {
      // multi-get on an index with 0 or 1 trailing '/'
      // followed by optional parameters.
      uriRewriteRule: { regexp: String.raw`^/([^/]+)/_mget/??[^/]*$` },
      methodRewriteRule: { regexp: String.raw`^(GET)$` }
    },
    {
      // multi-get on a type with 0 or 1 trailing '/'
      // followed by optional parameters.
      uriRewriteRule: { regexp: String.raw`^/([^/]+)/([^/]+)/_mget/??[^/]*$` },
      methodRewriteRule: { regexp: String.raw`^(GET)$` }
    },
    {
      // delete-by-query on index using POST
      uriRewriteRule: {
        regexp: String.raw`^/([^/]+)/_delete_by_query/??[^/]*$`
      },
      methodRewriteRule: { regexp: String.raw`^(POST)$` }
    },
    {
      // delete-by-query on type using POST
      // TODO: support delete-by-query on multiple indexes/types
      uriRewriteRule: {
        regexp: String.raw`^/([^/]+)/([^/]+)/_delete_by_query/??[^/]*$`
      },
      methodRewriteRule: { regexp: String.raw`^(POST)$` }
    },
    {
      // update-by-query on index using POST
      uriRewriteRule: {
        regexp: String.raw`^/([^/]+)/_update_by_query/??[^/]*$`
      },
      methodRewriteRule: { regexp: String.raw`^(POST)$` }
    },
    {
      // update-by-query on type using POST
      // TODO: support update-by-query on multiple indexes/types
      uriRewriteRule: {
        regexp: String.raw`^/([^/]+)/([^/]+)/_update_by_query/??[^/]*$`
      },
      methodRewriteRule: { regexp: String.raw`^(POST)$` }
    },
    {
      // cluster APIs
      uriRewriteRule: { regexp: String.raw`^/(_nodes|_cluster)/??.*$` },
      methodRewriteRule: { regexp: String.raw`^(GET)$` }
    },
    {
      // /<index>/<type>/<ID> (with 0 or 1 trailing '/', prefer 0)
      // followed by optional parameters.
      uriRewriteRule: { regexp: String.raw`^/([^/]+)/([^/]+)/[^/]+/??[^/]*$` },
      methodRewriteRule: { regexp: String.raw`^(GET|HEAD|DELETE|PUT)$` }
    },
    {
      // open/close index API using POST
      uriRewriteRule: { regexp: String.raw`^/([^/]+)/(_open|_close)/??$` },
      methodRewriteRule: { regexp: String.raw`^(POST)$` }
    },
    {
      // /<index> (with 0 or 1 trailing '/', prefer 0)
      // followed by optional parameters.
      uriRewriteRule: { regexp: String.raw`^/([^/]+)/??[^/]*$` },
      methodRewriteRule: { regexp: String.raw`^(GET|HEAD|DELETE|PUT)$` }
    },
    {
      uriRewriteRule: { regexp: String.raw`^(.*)$` },
      methodRewriteRule: { regexp: String.raw`^(.*)$` }
    }
  ].map(rule => ({
    id: getNewRewriteRuleId(appId, appVersion, idGenerator),
    ...rule
  }));
}

export function getGRPCRules(
  appId: string,
  appVersion: string,
  idGenerator?: () => string
) {
  return [
    {
      uriRewriteRule: { regexp: String.raw`^(.*)$` },
      methodRewriteRule: { regexp: String.raw`^(.*)$` }
    }
  ].map(rule => ({
    id: getNewRewriteRuleId(appId, appVersion, idGenerator),
    ...rule
  }));
}
