/*
Copyright The Kubernetes Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// Code generated by client-gen. DO NOT EDIT.

package fake

import (
	v1 "k8s.io/api/events/v1"
	eventsv1 "k8s.io/client-go/applyconfigurations/events/v1"
	gentype "k8s.io/client-go/gentype"
	typedeventsv1 "k8s.io/client-go/kubernetes/typed/events/v1"
)

// fakeEvents implements EventInterface
type fakeEvents struct {
	*gentype.FakeClientWithListAndApply[*v1.Event, *v1.EventList, *eventsv1.EventApplyConfiguration]
	Fake *FakeEventsV1
}

func newFakeEvents(fake *FakeEventsV1, namespace string) typedeventsv1.EventInterface {
	return &fakeEvents{
		gentype.NewFakeClientWithListAndApply[*v1.Event, *v1.EventList, *eventsv1.EventApplyConfiguration](
			fake.Fake,
			namespace,
			v1.SchemeGroupVersion.WithResource("events"),
			v1.SchemeGroupVersion.WithKind("Event"),
			func() *v1.Event { return &v1.Event{} },
			func() *v1.EventList { return &v1.EventList{} },
			func(dst, src *v1.EventList) { dst.ListMeta = src.ListMeta },
			func(list *v1.EventList) []*v1.Event { return gentype.ToPointerSlice(list.Items) },
			func(list *v1.EventList, items []*v1.Event) { list.Items = gentype.FromPointerSlice(items) },
		),
		fake,
	}
}
