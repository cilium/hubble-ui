module github.com/cilium/hubble-ui/events-server

go 1.14

require (
	github.com/Azure/go-autorest/autorest v0.9.6 // indirect
	github.com/cilium/cilium v1.7.0-rc2.0.20200521202032-324d212a2321
	github.com/fatih/color v1.9.0
	github.com/golang/protobuf v1.4.2
	github.com/gophercloud/gophercloud v0.1.0 // indirect
	github.com/imdario/mergo v0.3.9 // indirect
	golang.org/x/time v0.0.0-20200416051211-89c76fbcd5d1 // indirect
	google.golang.org/grpc v1.29.1
	google.golang.org/protobuf v1.23.0
	k8s.io/api v0.18.2
	k8s.io/apimachinery v0.18.2
	k8s.io/client-go v0.18.2
	k8s.io/utils v0.0.0-20200414100711-2df71ebbae66 // indirect
	sigs.k8s.io/structured-merge-diff v0.0.0-20190525122527-15d366b2352e // indirect
)

replace (
	github.com/optiopay/kafka => github.com/cilium/kafka v0.0.0-20180809090225-01ce283b732b
	k8s.io/client-go => github.com/cilium/client-go v0.0.0-20200417200322-b77c886899ef
)
