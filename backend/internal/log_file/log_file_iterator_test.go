package log_file

import (
	"strings"
	"testing"
)

type TestDescriptor struct {
	Input    string
	Expected []string
}

func TestAll(t *testing.T) {
	runTests(t, []TestDescriptor{
		{
			Input:    "",
			Expected: []string{},
		},
		{
			Input:    "{1}",
			Expected: []string{"{1}"},
		},
		{
			Input:    "{1}{2}{3},,,,{4}",
			Expected: []string{"{1}", "{2}", "{3}", "{4}"},
		},
		{
			Input:    ",,,,,,",
			Expected: []string{},
		},
		{
			Input:    ",,,,,,,{1}",
			Expected: []string{"{1}"},
		},
		{
			Input:    ",,,\n,,\n,,{1}",
			Expected: []string{"{1}"},
		},
		{
			Input:    ",,,,,,,{1}\n{2}",
			Expected: []string{"{1}", "{2}"},
		},
		{
			Input:    ",,,random;;_-{1}\njfhjashjfa{5}",
			Expected: []string{"{1}", "{5}"},
		},
		{
			Input:    "}{1}",
			Expected: []string{"{1}"},
		},
		{
			Input:    "}}}}{1}",
			Expected: []string{"{1}"},
		},
		{
			Input:    "}}}}{{1}",
			Expected: []string{},
		},
		{
			Input:    "}}}{1}{{2}",
			Expected: []string{"{1}"},
		},
	})
}

func runTests(t *testing.T, tests []TestDescriptor) {
	for idx, test := range tests {
		output := NewJsonIterator(strings.NewReader(test.Input)).Collect()

		if len(output) != len(test.Expected) {
			t.Fatalf("test %d: expected: %v, got: %v\n", idx, test.Expected, output)
			return
		}

		for i, elem := range output {
			if elem != test.Expected[i] {
				t.Fatalf("test %d: elem %d is '%v', expected: '%v'\n", idx, i, elem, test.Expected[i])
			}
		}
	}
}
