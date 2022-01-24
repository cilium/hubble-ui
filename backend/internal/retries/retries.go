package retries

import (
	"context"
	"time"

	cilium_backoff "github.com/cilium/cilium/pkg/backoff"
	grpc_errors "github.com/cilium/hubble-ui/backend/internal/grpc/errors"
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

func (r *Retries) Wait(ctx context.Context) error {
	return r.ciliumRetries.Wait(ctx)
}

func (r *Retries) RetryIfGrpcUnavailable(
	ctx context.Context,
	grpcOperation func(int) error,
) (bool, error) {
	attempt := 1

	for {
		err := grpcOperation(attempt)
		if err == nil {
			break
		}

		if !grpc_errors.IsUnavailable(err) {
			return false, err
		}

		attempt++
		err = r.ciliumRetries.Wait(ctx)
		if err != nil {
			//nolint
			return true, nil
		}
	}

	// NOTE: we are here if grpcOperation successfully finished
	return false, nil
}
