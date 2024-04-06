package sources

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/cilium/hubble-ui/backend/domain/events"
	"github.com/cilium/hubble-ui/backend/internal/mock/factories"
	"github.com/cilium/hubble-ui/backend/internal/ns_watcher/common"
)

type CollectedData struct {
	nsEvents []*common.NSEvent
}

func runSource(_t *testing.T, src MockedSource) CollectedData {
	nsEvents := []*common.NSEvent{}

	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()
	go src.Run(ctx)

F:
	for {
		select {
		case evt := <-src.Namespaces():
			nsEvents = append(nsEvents, evt)
		case <-ctx.Done():
			break F
		}
	}

	return CollectedData{
		nsEvents: nsEvents,
	}
}

func testNsName(i int) string {
	return fmt.Sprintf("ns-%d", i)
}

// NOTE: _num is used to shut golangci-lint saying it has only one value for num
func prepareNSEvents(start, _num int) []*common.NSEvent {
	evts := []*common.NSEvent{}

	for i := 0; i < _num; i += 1 {
		evts = append(
			evts,
			factories.CreateNSEvent(events.Added, testNsName(start+i)),
		)
	}

	return evts
}

func TestNamespaces(t *testing.T) {
	t.Parallel()

	nsSrc := Namespaces(prepareNSEvents(0, 1))
	collected := runSource(t, nsSrc).nsEvents

	if len(collected) == 0 || collected[0].GetNamespaceStr() != testNsName(0) {
		t.Fatal("wrong event")
	}
}

func TestDuplicatedNamespaces(t *testing.T) {
	t.Parallel()

	nsSrc := Namespaces(prepareNSEvents(0, 1)).Duplicate()
	collected := runSource(t, nsSrc).nsEvents

	if len(collected) == 0 || collected[0].GetNamespaceStr() != testNsName(0) {
		t.Fatal("wrong event")
	}
}

func TestCombinedNamespaces(t *testing.T) {
	t.Parallel()

	src1 := Namespaces(prepareNSEvents(0, 1))
	src2 := Namespaces(prepareNSEvents(1, 1))
	src := Combine(src1, src2)

	collected := runSource(t, src).nsEvents

	if len(collected) != 2 {
		t.Fatalf("wrong number of ns events: %d\n", len(collected))
	}

	m := make(map[string]struct{})
	m[collected[0].GetNamespaceStr()] = struct{}{}
	m[collected[1].GetNamespaceStr()] = struct{}{}

	_, ok1 := m[testNsName(0)]
	_, ok2 := m[testNsName(1)]

	if !ok1 || !ok2 {
		t.Fatalf("wrong events: %v\n", m)
	}
}
