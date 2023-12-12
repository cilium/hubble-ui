package grpc_utils

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/grpc/connectivity"
)

// NOTE: Returns true if we got into failure connection state
func WaitUntilConnected(
	ctx context.Context,
	conn *grpc.ClientConn,
) (connectivity.State, bool, error) {
	for i := 0; ; {
		select {
		case <-ctx.Done():
			s := conn.GetState()
			notConnected := s != connectivity.Ready

			return s, notConnected, ctx.Err()
		default:
			s := conn.GetState()
			if s == connectivity.TransientFailure && i == 0 {
				i += 1

				ctxIsNotExpired := conn.WaitForStateChange(ctx, s)
				if !ctxIsNotExpired {
					return s, conn.GetState() != connectivity.Ready, ctx.Err()
				} else {
					continue
				}
			}

			if s == connectivity.Shutdown || s == connectivity.TransientFailure {
				return s, true, nil
			}

			if s == connectivity.Ready {
				return s, false, nil
			}

			if i > 0 && s == connectivity.Idle {
				return s, true, nil
			}

			ctxIsNotExpired := conn.WaitForStateChange(ctx, s)
			if !ctxIsNotExpired {
				s := conn.GetState()
				notConnected := s != connectivity.Ready

				return s, notConnected, ctx.Err()
			}
		}
	}
}
