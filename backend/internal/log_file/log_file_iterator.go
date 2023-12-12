package log_file

import (
	"bufio"
	"io"
	"strings"
	"unicode"
)

type JsonIterator struct {
	bufReader *bufio.Reader

	next      *string
	afterNext *string

	done bool
}

func NewJsonIterator(src io.Reader) *JsonIterator {
	return &JsonIterator{
		bufReader: bufio.NewReader(src),
	}
}

func (lfi *JsonIterator) Next() string {
	next := ""
	if lfi.next != nil {
		next = *lfi.next
	}

	lfi.advance()
	return next
}

func (lfi *JsonIterator) HasNext() bool {
	if lfi.next != nil {
		return true
	}

	if lfi.done {
		return false
	}

	if lfi.next == nil {
		lfi.advance()
	}

	return lfi.next != nil
}

func (lfi *JsonIterator) Collect() []string {
	entries := []string{}

	for lfi.HasNext() {
		entries = append(entries, lfi.Next())
	}

	return entries
}

func (lfi *JsonIterator) advance() {
	lfi.next = lfi.afterNext
	lfi.afterNext = nil

	if lfi.next == nil {
		next, err := lfi.readNextObject()
		if err != nil {
			lfi.done = true
			return
		}

		lfi.next = &next
	}

	if lfi.afterNext == nil {
		afterNext, err := lfi.readNextObject()
		if err != nil {
			lfi.done = true
			return
		}

		lfi.afterNext = &afterNext
	}
}

func (lfi *JsonIterator) readNextObject() (string, error) {
	entry := strings.Builder{}
	stack := 0

	for {
		r, _, err := lfi.bufReader.ReadRune()
		if err != nil {
			return "", err
		}

		if r == unicode.ReplacementChar {
			continue
		}

		if entry.Len() == 0 && r != '{' {
			continue
		}

		// NOTE: In fact this method returns nil error
		if _, err := entry.WriteRune(r); err != nil {
			return "", err
		}

		if r == '{' {
			stack += 1
		}

		if r == '}' {
			stack -= 1
		}

		if stack == 0 {
			break
		}

		if stack < 0 {
			entry.Reset()
			stack = 0
		}
	}

	return entry.String(), nil
}
