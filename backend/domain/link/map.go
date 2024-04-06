package link

import "github.com/cilium/hubble-ui/backend/proto/ui"

type Map map[string]*Link

func (m Map) Values() []*Link {
	arr := make([]*Link, 0, len(m))

	for _, v := range m {
		arr = append(arr, v)
	}

	return arr
}

func (m Map) ProtoValues() []*ui.ServiceLink {
	arr := make([]*ui.ServiceLink, 0, len(m))

	for _, v := range m {
		arr = append(arr, v.ToProto())
	}

	return arr
}

func (m Map) Has(key string) bool {
	_, exists := m[key]
	return exists
}

func (m Map) HasLink(l *Link) bool {
	return m.Has(l.Id)
}

func (m Map) Insert(l *Link) *Link {
	current := m[l.Id]
	m[l.Id] = l

	return current
}

func (m Map) InsertMany(links ...*Link) {
	for _, l := range links {
		m.Insert(l)
	}
}
