module github.com/cilium/hubble-ui/backend

go 1.16

require (
	github.com/cilium/cilium v1.10.0-rc0
	github.com/cilium/hubble v0.6.1
	github.com/golang/protobuf v1.4.3
	github.com/google/gops v0.3.17
	github.com/sirupsen/logrus v1.7.0
	google.golang.org/grpc v1.29.1
	google.golang.org/protobuf v1.25.0
	k8s.io/api v0.21.0
	k8s.io/apimachinery v0.21.0
	k8s.io/client-go v0.21.0
)

replace github.com/optiopay/kafka => github.com/cilium/kafka v0.0.0-20180809090225-01ce283b732b
