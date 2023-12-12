package service

import "github.com/cilium/hubble-ui/backend/proto/ui"

type Map map[string]*Service

func (m Map) Values() []*Service {
	arr := make([]*Service, 0, len(m))

	for _, v := range m {
		arr = append(arr, v)
	}

	return arr
}

func (m Map) ProtoValues() []*ui.Service {
	arr := make([]*ui.Service, 0, len(m))

	for _, v := range m {
		arr = append(arr, v.ToProto())
	}

	return arr
}

func (m Map) Has(key string) bool {
	_, exists := m[key]
	return exists
}

func (m Map) HasService(svc *Service) bool {
	return m.Has(svc.Id())
}

func (m Map) Insert(svc *Service) *Service {
	current := m[svc.Id()]
	m[svc.Id()] = svc

	return current
}

func (m Map) InsertMany(svcs ...*Service) {
	for _, svc := range svcs {
		m.Insert(svc)
	}
}
