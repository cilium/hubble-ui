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
import * as React from "react";
import { Emoji } from "emoji-mart";
import { ReactComponent } from "../../state";
import { AppEndpoint } from "../../graphqlTypes";
import { extractEndpointLogoInfo } from "../App/utils";
import {
  ProtocolImageAbstract,
  ProtocolImageProps
} from "./ProtocolImageAbstract";
import * as logos from "./logosmap";
import { AppEndpointIconType } from "../App/state/types";

export const EndpointLogo = ({
  endpoint,
  ...props
}: ProtocolImageProps & { endpoint: AppEndpoint }) => {
  const { id, type } = extractEndpointLogoInfo(endpoint);
  if (type === AppEndpointIconType.EMOJI) {
    let size = 16;
    if (
      typeof props.maxWidth === "number" &&
      typeof props.maxHeight === "number"
    ) {
      size = Math.min(props.maxWidth, props.maxHeight);
    } else if (typeof props.maxWidth === "number") {
      size = props.maxWidth;
    } else if (typeof props.maxHeight === "number") {
      size = props.maxHeight;
    }
    if (typeof props.width === "number" && typeof props.height === "number") {
      size = Math.min(size, props.width);
      size = Math.min(size, props.height);
    } else if (typeof props.width === "number") {
      size = Math.min(size, props.width);
    } else if (typeof props.height === "number") {
      size = Math.min(size, props.height);
    }
    size -= 2;
    return (
      <span className="emoji-mart-emoji-wrapper">
        <Emoji
          emoji={id}
          set="apple"
          size={size}
          backgroundImageFn={() => `/emojis.png`}
        />
      </span>
    );
  } else {
    const Logo = getEndpointLogoComponentById(id);
    return <Logo {...props} />;
  }
};

export const getEndpointLogoComponentById = (logoName: string) => {
  let component = protocols[logoName];
  if (!component) {
    component = protocols["kubernetes"];
  }
  return component as ReactComponent<ProtocolImageProps>;
};

export const protocols = {
  http: ({ width, height, ...props }: ProtocolImageProps) => (
    <ProtocolImageAbstract
      {...props}
      src={logos.http}
      alt="HTTP"
      defaultWidth={24.62}
      defaultHeight={8}
      desiredWidth={width}
      desiredHeight={height}
    />
  ),
  aws: ({ width, height, ...props }: ProtocolImageProps) => (
    <ProtocolImageAbstract
      {...props}
      src={logos.aws}
      alt="AWS"
      defaultWidth={33.51}
      defaultHeight={30}
      desiredWidth={width}
      desiredHeight={height}
    />
  ),
  kubernetes: ({ width, height, ...props }: ProtocolImageProps) => (
    <ProtocolImageAbstract
      {...props}
      src={logos.kubernetes}
      alt="Kubernetes"
      defaultWidth={21}
      defaultHeight={21}
      desiredWidth={width}
      desiredHeight={height}
    />
  ),
  world: ({ width, height, ...props }: ProtocolImageProps) => (
    <ProtocolImageAbstract
      {...props}
      src={logos.world}
      alt="World"
      defaultWidth={24}
      defaultHeight={23}
      desiredWidth={width}
      desiredHeight={height}
    />
  ),
  mongodb: ({ width, height, ...props }: ProtocolImageProps) => (
    <ProtocolImageAbstract
      {...props}
      src={logos.mongodb}
      alt="Mongo DB"
      defaultWidth={9}
      defaultHeight={19}
      desiredWidth={width}
      desiredHeight={height}
    />
  ),
  redis: ({ width, height, ...props }: ProtocolImageProps) => (
    <ProtocolImageAbstract
      {...props}
      src={logos.redis}
      alt="Redis"
      defaultWidth={19}
      defaultHeight={17}
      desiredWidth={width}
      desiredHeight={height}
    />
  ),
  rabbitmq: ({ width, height, ...props }: ProtocolImageProps) => (
    <ProtocolImageAbstract
      {...props}
      src={logos.rabbitmq}
      alt="RabbitMQ"
      defaultWidth={19}
      defaultHeight={21}
      desiredWidth={width}
      desiredHeight={height}
    />
  ),
  elasticsearch: ({ width, height, ...props }: ProtocolImageProps) => (
    <ProtocolImageAbstract
      {...props}
      src={logos.elasticsearch}
      alt="Elasticsearch"
      defaultWidth={19}
      defaultHeight={19}
      desiredWidth={width}
      desiredHeight={height}
    />
  ),
  mysql: ({ width, height, ...props }: ProtocolImageProps) => (
    <ProtocolImageAbstract
      {...props}
      src={logos.mysql}
      alt="MySQL"
      defaultWidth={14}
      defaultHeight={10}
      desiredWidth={width}
      desiredHeight={height}
    />
  ),
  postgresql: ({ width, height, ...props }: ProtocolImageProps) => (
    <ProtocolImageAbstract
      {...props}
      src={logos.postgresql}
      alt="PostgreSQL"
      defaultWidth={18} // 576.095
      defaultHeight={18.554564785} // 593.844
      desiredWidth={width}
      desiredHeight={height}
    />
  ),
  zookeeper: ({ width, height, ...props }: ProtocolImageProps) => (
    <ProtocolImageAbstract
      {...props}
      src={logos.zookeeper}
      alt="World"
      defaultWidth={48}
      defaultHeight={48}
      desiredWidth={width}
      desiredHeight={height}
    />
  ),
  grpc: ({ width, height, ...props }: ProtocolImageProps) => (
    <ProtocolImageAbstract
      {...props}
      src={logos.grpc}
      alt="GRPC"
      defaultWidth={20} // 200
      defaultHeight={7.1} // 71
      desiredWidth={width}
      desiredHeight={height}
    />
  ),
  cassandra: ({ width, height, ...props }: ProtocolImageProps) => (
    <ProtocolImageAbstract
      {...props}
      src={logos.cassandra}
      alt="Cassandra"
      defaultWidth={19}
      defaultHeight={10}
      desiredWidth={width}
      desiredHeight={height}
    />
  ),
  kafka: ({ width, height, ...props }: ProtocolImageProps) => (
    <ProtocolImageAbstract
      {...props}
      src={logos.kafka}
      alt="Kafka"
      defaultWidth={15}
      defaultHeight={24}
      desiredWidth={width}
      desiredHeight={height}
    />
  ),
  influxdb: ({ width, height, ...props }: ProtocolImageProps) => (
    <ProtocolImageAbstract
      {...props}
      src={logos.influxdb}
      alt="InfluxDB"
      defaultWidth={20} // 672
      defaultHeight={7.44047619} // 250
      desiredWidth={width}
      desiredHeight={height}
    />
  ),
  covalent: ({ width, height, ...props }: ProtocolImageProps) => (
    <ProtocolImageAbstract
      {...props}
      src={logos.covalent}
      alt="Isovalent"
      defaultWidth={26}
      defaultHeight={22}
      desiredWidth={width}
      desiredHeight={height}
    />
  ),
  graphql: ({ width, height, ...props }: ProtocolImageProps) => (
    <ProtocolImageAbstract
      {...props}
      src={logos.grpahql}
      alt="GraphQL"
      defaultWidth={17.857142857} // 350
      defaultHeight={20} // 392
      desiredWidth={width}
      desiredHeight={height}
    />
  ),
  etcd: ({ width, height, ...props }: ProtocolImageProps) => (
    <ProtocolImageAbstract
      {...props}
      src={logos.etcd}
      alt="ETCD"
      defaultWidth={20} // 235
      defaultHeight={19.14893617} // 225
      desiredWidth={width}
      desiredHeight={height}
    />
  ),
  memcached: ({ width, height, ...props }: ProtocolImageProps) => (
    <ProtocolImageAbstract
      {...props}
      src={logos.memcached}
      alt="Memcached"
      defaultWidth={20} // 254
      defaultHeight={20} // 254
      desiredWidth={width}
      desiredHeight={height}
    />
  ),
  couchdb: ({ width, height, ...props }: ProtocolImageProps) => (
    <ProtocolImageAbstract
      {...props}
      src={logos.couchdb}
      alt="CouchDB"
      defaultWidth={20} // 500
      defaultHeight={20} // 500
      desiredWidth={width}
      desiredHeight={height}
    />
  )
};
