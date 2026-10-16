package debounce

import (
	"testing"
	"time"
)

func TestTriggeredDoesNotFireBeforeTouch(t *testing.T) {
	t.Parallel()

	d := New(20 * time.Millisecond)

	select {
	case <-d.Triggered():
		t.Fatal("debounce triggered before Touch")
	case <-time.After(60 * time.Millisecond):
	}
}

func TestTouchTriggersAfterDelay(t *testing.T) {
	t.Parallel()

	d := New(20 * time.Millisecond)
	start := time.Now()
	d.Touch()

	select {
	case <-d.Triggered():
		if elapsed := time.Since(start); elapsed < 15*time.Millisecond {
			t.Fatalf("debounce triggered too early: %s", elapsed)
		}
	case <-time.After(80 * time.Millisecond):
		t.Fatal("debounce did not trigger after Touch")
	}
}

func TestTouchResetsDelay(t *testing.T) {
	t.Parallel()

	d := New(30 * time.Millisecond)
	d.Touch()
	<-time.After(20 * time.Millisecond)
	d.Touch()

	select {
	case <-d.Triggered():
		t.Fatal("debounce triggered before the latest Touch delay elapsed")
	case <-time.After(15 * time.Millisecond):
	}

	select {
	case <-d.Triggered():
	case <-time.After(80 * time.Millisecond):
		t.Fatal("debounce did not trigger after the latest Touch")
	}
}
