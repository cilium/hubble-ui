package retries

import (
	"context"
	"time"

	cilium_backoff "github.com/cilium/cilium/pkg/backoff"
	"google.golang.org/grpc/backoff"
)

type Retries struct {
	ciliumRetries *cilium_backoff.Exponential
}

// TODO: make it configurable
func New() *Retries {
	cr := &cilium_backoff.Exponential{
		Min:    1.0 * time.Second,
		Max:    7.0 * time.Second,
		Factor: 1.6,
		Jitter: true,
	}

	return &Retries{cr}
}

func NewFromGRPC(grpcBackoff *backoff.Config) *Retries {
	cr := &cilium_backoff.Exponential{
		Min:    1.0 * time.Second,
		Max:    grpcBackoff.MaxDelay,
		Factor: grpcBackoff.Multiplier,
		Jitter: grpcBackoff.Jitter > 1e-6,
	}

	return &Retries{cr}
}

func (r *Retries) Clone() *Retries {
	return &Retries{
		ciliumRetries: &cilium_backoff.Exponential{
			Min:         r.ciliumRetries.Min,
			Max:         r.ciliumRetries.Max,
			Factor:      r.ciliumRetries.Factor,
			Jitter:      r.ciliumRetries.Jitter,
			NodeManager: nil,
			Name:        "",
		},
	}
}

func (r *Retries) Wait(ctx context.Context) error {
	return r.ciliumRetries.Wait(ctx)
}

func (r *Retries) Duration(attempt int) time.Duration {
	return r.ciliumRetries.Duration(attempt)
}

func (r *Retries) Retry(ctx context.Context, op func(int) error) error {
	attempt := 0

	for {
		attempt += 1
		err := op(attempt)
		if err == nil {
			return nil
		}

		err = r.ciliumRetries.Wait(ctx)
		if err != nil {
			return err
		}
	}
}

func (r *Retries) RetryIf(
	ctx context.Context,
	op func(int) error,
	isRecoverableError func(err error) bool,
) error {
	attempt := 0

	for {
		attempt += 1
		err := op(attempt)
		if err == nil {
			return nil
		}

		if !isRecoverableError(err) {
			return err
		}

		err = r.ciliumRetries.Wait(ctx)
		if err != nil {
			return err
		}
	}
}

func (r *Retries) Max() time.Duration {
	return r.ciliumRetries.Max
}
