module github.com/cilium/hubble-ui/backend

go 1.16

require (
	cloud.google.com/go v0.97.0 // indirect
	github.com/cilium/cilium v1.10.4
	github.com/cilium/hubble v0.8.2
	github.com/go-logr/logr v1.1.0 // indirect
	github.com/golang/protobuf v1.5.2
	github.com/google/gofuzz v1.2.0 // indirect
	github.com/google/gops v0.3.20
	github.com/google/uuid v1.3.0 // indirect
	github.com/imdario/mergo v0.3.12 // indirect
	github.com/json-iterator/go v1.1.12 // indirect
	github.com/pkg/errors v0.9.1
	github.com/sasha-s/go-deadlock v0.3.1 // indirect
	github.com/sirupsen/logrus v1.8.1
	github.com/spf13/viper v1.9.0 // indirect
	golang.org/x/net v0.0.0-20210929193557-e81a3d93ecf6 // indirect
	golang.org/x/sys v0.0.0-20210927094055-39ccf1dd6fa6 // indirect
	golang.org/x/term v0.0.0-20210927222741-03fcf44c2211 // indirect
	golang.org/x/text v0.3.7 // indirect
	google.golang.org/genproto v0.0.0-20210929214142-896c89f843d2 // indirect
	google.golang.org/grpc v1.41.0
	google.golang.org/protobuf v1.27.1
	k8s.io/api v0.22.2
	k8s.io/apimachinery v0.22.2
	k8s.io/client-go v0.22.2
	k8s.io/klog/v2 v2.20.0 // indirect
	k8s.io/utils v0.0.0-20210820185131-d34e5cb4466e // indirect
	sigs.k8s.io/yaml v1.3.0 // indirect
)

replace github.com/optiopay/kafka => github.com/cilium/kafka v0.0.0-20180809090225-01ce283b732b
