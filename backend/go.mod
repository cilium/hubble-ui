module github.com/cilium/hubble-ui/backend

go 1.14

require (
	github.com/cenkalti/backoff/v4 v4.1.0
	github.com/cilium/cilium v1.8.3
	github.com/cilium/hubble v0.6.1
	github.com/golang/protobuf v1.4.2
	github.com/sirupsen/logrus v1.4.2
	google.golang.org/grpc v1.27.0
	google.golang.org/protobuf v1.25.0
	k8s.io/api v0.19.2
	k8s.io/apimachinery v0.19.2
	k8s.io/client-go v0.18.9
)

replace (
	github.com/optiopay/kafka => github.com/cilium/kafka v0.0.0-20180809090225-01ce283b732b
	k8s.io/client-go => github.com/cilium/client-go v0.0.0-20200917084247-85ed8d558b9c
)
