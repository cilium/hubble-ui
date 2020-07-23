module github.com/cilium/hubble-ui/backend

go 1.14

require (
	github.com/cilium/cilium v1.8.2
	github.com/fatih/color v1.7.0
	github.com/golang/protobuf v1.4.2
	github.com/kardianos/osext v0.0.0-20170510131534-ae77be60afb1 // indirect
	github.com/shirou/w32 v0.0.0-20160930032740-bb4de0191aa4 // indirect
	github.com/sirupsen/logrus v1.4.2
	google.golang.org/grpc v1.27.0
	google.golang.org/protobuf v1.25.0
	k8s.io/api v0.18.5
	k8s.io/apimachinery v0.18.5
	k8s.io/client-go v0.18.5
)

replace (
	github.com/optiopay/kafka => github.com/cilium/kafka v0.0.0-20180809090225-01ce283b732b
	k8s.io/client-go => github.com/cilium/client-go v0.0.0-20200417200322-b77c886899ef
)
