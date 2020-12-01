/**
 * @fileoverview gRPC-Web generated client stub for observer
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!


/* eslint-disable */
// @ts-nocheck



const grpc = {};
grpc.web = require('grpc-web');


var google_protobuf_wrappers_pb = require('google-protobuf/google/protobuf/wrappers_pb.js')

var google_protobuf_timestamp_pb = require('google-protobuf/google/protobuf/timestamp_pb.js')

var flow_flow_pb = require('../flow/flow_pb.js')

var relay_relay_pb = require('../relay/relay_pb.js')
const proto = {};
proto.observer = require('./observer_pb.js');

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.observer.ObserverClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options['format'] = 'text';

  /**
   * @private @const {!grpc.web.GrpcWebClientBase} The client
   */
  this.client_ = new grpc.web.GrpcWebClientBase(options);

  /**
   * @private @const {string} The hostname
   */
  this.hostname_ = hostname;

};


/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.observer.ObserverPromiseClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options['format'] = 'text';

  /**
   * @private @const {!grpc.web.GrpcWebClientBase} The client
   */
  this.client_ = new grpc.web.GrpcWebClientBase(options);

  /**
   * @private @const {string} The hostname
   */
  this.hostname_ = hostname;

};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.observer.GetFlowsRequest,
 *   !proto.observer.GetFlowsResponse>}
 */
const methodDescriptor_Observer_GetFlows = new grpc.web.MethodDescriptor(
  '/observer.Observer/GetFlows',
  grpc.web.MethodType.SERVER_STREAMING,
  proto.observer.GetFlowsRequest,
  proto.observer.GetFlowsResponse,
  /**
   * @param {!proto.observer.GetFlowsRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.observer.GetFlowsResponse.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.observer.GetFlowsRequest,
 *   !proto.observer.GetFlowsResponse>}
 */
const methodInfo_Observer_GetFlows = new grpc.web.AbstractClientBase.MethodInfo(
  proto.observer.GetFlowsResponse,
  /**
   * @param {!proto.observer.GetFlowsRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.observer.GetFlowsResponse.deserializeBinary
);


/**
 * @param {!proto.observer.GetFlowsRequest} request The request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.observer.GetFlowsResponse>}
 *     The XHR Node Readable Stream
 */
proto.observer.ObserverClient.prototype.getFlows =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/observer.Observer/GetFlows',
      request,
      metadata || {},
      methodDescriptor_Observer_GetFlows);
};


/**
 * @param {!proto.observer.GetFlowsRequest} request The request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.observer.GetFlowsResponse>}
 *     The XHR Node Readable Stream
 */
proto.observer.ObserverPromiseClient.prototype.getFlows =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/observer.Observer/GetFlows',
      request,
      metadata || {},
      methodDescriptor_Observer_GetFlows);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.observer.ServerStatusRequest,
 *   !proto.observer.ServerStatusResponse>}
 */
const methodDescriptor_Observer_ServerStatus = new grpc.web.MethodDescriptor(
  '/observer.Observer/ServerStatus',
  grpc.web.MethodType.UNARY,
  proto.observer.ServerStatusRequest,
  proto.observer.ServerStatusResponse,
  /**
   * @param {!proto.observer.ServerStatusRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.observer.ServerStatusResponse.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.observer.ServerStatusRequest,
 *   !proto.observer.ServerStatusResponse>}
 */
const methodInfo_Observer_ServerStatus = new grpc.web.AbstractClientBase.MethodInfo(
  proto.observer.ServerStatusResponse,
  /**
   * @param {!proto.observer.ServerStatusRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.observer.ServerStatusResponse.deserializeBinary
);


/**
 * @param {!proto.observer.ServerStatusRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.observer.ServerStatusResponse)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.observer.ServerStatusResponse>|undefined}
 *     The XHR Node Readable Stream
 */
proto.observer.ObserverClient.prototype.serverStatus =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/observer.Observer/ServerStatus',
      request,
      metadata || {},
      methodDescriptor_Observer_ServerStatus,
      callback);
};


/**
 * @param {!proto.observer.ServerStatusRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.observer.ServerStatusResponse>}
 *     A native promise that resolves to the response
 */
proto.observer.ObserverPromiseClient.prototype.serverStatus =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/observer.Observer/ServerStatus',
      request,
      metadata || {},
      methodDescriptor_Observer_ServerStatus);
};


module.exports = proto.observer;

