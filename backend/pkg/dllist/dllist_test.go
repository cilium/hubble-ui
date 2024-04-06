package dllist

import (
	"fmt"
	"strings"
	"testing"
)

type testProps struct {
	numElements   int
	expectedChain string
}

func TestInit(t *testing.T) {
	ec := NewDLList[int]()

	if ec.root != ec.root.next || ec.root.prev != ec.root {
		t.Fatal("bad event channels initialization")
	}
}

func TestIdxChain(t *testing.T) {
	testSet := []testProps{
		{
			numElements:   0,
			expectedChain: "[]",
		},
		{
			numElements:   1,
			expectedChain: "[0]",
		},
		{
			numElements:   2,
			expectedChain: "[0, 1]",
		},
		{
			numElements:   3,
			expectedChain: "[0, 1, 2]",
		},
		{
			numElements:   4,
			expectedChain: "[0, 1, 2, 3]",
		},
	}

	for _, testDatum := range testSet {
		testDatum.runTest(t)
	}
}

func TestAddMany(t *testing.T) {
	ec := NewDLList[int]()

	first := ec.Add(1)
	second := ec.Add(2)
	third := ec.Add(3)
	fourth := ec.Add(4)

	isOk := ec.root.next == first && ec.root.prev == fourth
	isOk = isOk && first.prev == ec.root && first.next == second
	isOk = isOk && second.prev == first && second.next == third
	isOk = isOk && third.prev == second && third.next == fourth
	isOk = isOk && fourth.prev == third && fourth.next == ec.root

	if !isOk {
		t.Fatalf("AddMany failed: %s", ec.String())
	}
}

func TestDrop(t *testing.T) {
	ec := NewDLList[int]()

	first := ec.Add(1)
	second := ec.Add(2)
	third := ec.Add(3)

	if ec.n != 3 {
		t.Fatalf(
			"drop test: invalid number of init elements: %d (expected %d)",
			ec.n,
			3,
		)
	}

	t.Logf("drop test: before dropping first: %s", ec.String())
	first.Drop()
	t.Logf("drop test: after dropping first: %s", ec.String())
	if ec.n != 2 {
		t.Fatalf(
			"drop test: invalid number of init elements: %d (expected %d)",
			ec.n,
			2,
		)
	}

	if ec.root.next != second || second.prev != ec.root || ec.root.prev != third {
		t.Fatalf("drop test: root element has wrong links: %s", ec.String())
	}

	t.Logf("drop test: before dropping third: %s", ec.String())
	third.Drop()
	if ec.n != 1 {
		t.Fatalf(
			"drop test: invalid number of init elements: %d (expected %d)",
			ec.n,
			1,
		)
	}

	if ec.root.next != second || second.prev != ec.root || second.next != ec.root {
		t.Fatalf("drop test: root element has wrong links: %s", ec.String())
	}

	second.Drop()
	if ec.n != 0 {
		t.Fatalf(
			"drop test: invalid number of init elements: %d (expected %d)",
			ec.n,
			0,
		)
	}

	if ec.root.next != ec.root || ec.root.prev != ec.root {
		t.Fatalf("drop test: root element has wrong links: %s", ec.String())
	}
}

func (tp testProps) runTest(t *testing.T) {
	list := NewDLList[int]()

	for i := 0; i < tp.numElements; i += 1 {
		list.Add(i)
		t.Logf("Added %d elem: %s", i, list.String())
	}

	chainStr := dataStr(list.String())
	if chainStr != tp.expectedChain {
		t.Fatalf(
			"Num elements: %d, expected: '%s', got: '%s'",
			tp.numElements,
			tp.expectedChain,
			chainStr,
		)
	}
}

func dataStr(listStr string) string {
	colonIdx := strings.Index(listStr, ":")
	gtIdx := strings.LastIndex(listStr, ">")

	fmt.Printf("%s\n", listStr)
	ds := listStr[colonIdx+2 : gtIdx]

	return ds
}
