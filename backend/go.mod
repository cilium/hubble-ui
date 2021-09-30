module github.com/cilium/hubble-ui/backend

go 1.16

require (
	github.com/cilium/cilium v1.10.0-rc0
	github.com/cilium/hubble v0.6.1
	github.com/golang/protobuf v1.5.2
	github.com/google/gops v0.3.17
	github.com/pkg/errors v0.9.1
	github.com/sirupsen/logrus v1.8.1
	google.golang.org/grpc v1.29.1
	google.golang.org/protobuf v1.26.0
	k8s.io/api v0.22.2
	k8s.io/apimachinery v0.22.2
	k8s.io/client-go v0.21.0
)

replace github.com/optiopay/kafka => github.com/cilium/kafka v0.0.0-20180809090225-01ce283b732b
