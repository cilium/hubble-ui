package factories

import (
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"

	"github.com/cilium/hubble-ui/backend/domain/events"
	ns_common "github.com/cilium/hubble-ui/backend/internal/ns_watcher/common"
)

func CreateNSEvent(kind events.EventKind, ns string) *ns_common.NSEvent {
	return &ns_common.NSEvent{
		Event:        kind,
		K8sNamespace: CreateNS(ns),
	}
}

func CreateNS(ns string) *v1.Namespace {
	uid := "<random unique id in time and space >< >"

	return &v1.Namespace{
		TypeMeta: metav1.TypeMeta{},
		ObjectMeta: metav1.ObjectMeta{
			UID:  types.UID(uid),
			Name: ns,
		},
		Spec:   v1.NamespaceSpec{},
		Status: v1.NamespaceStatus{},
	}
}
