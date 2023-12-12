package errors

import (
	grpc_runtime "github.com/grpc-ecosystem/grpc-gateway/runtime"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func HTTPStatusFromError(err error) int {
	code := status.Code(err)

	return grpc_runtime.HTTPStatusFromCode(code)
}

func IsUnauthenticated(err error) bool {
	return status.Code(err) == codes.Unauthenticated
}

func IsUnavailable(err error) bool {
	return status.Code(err) == codes.Unavailable
}

func IsConnClosing(err error) bool {
	return status.Code(err) == codes.Canceled
}

func IsCancelled(err error) bool {
	return IsConnClosing(err)
}

func IsRecoverable(err error) bool {
	return IsUnavailable(err)
}

func IsGRPCError(err error) (bool, *status.Status) {
	if err == nil {
		return false, nil
	}

	st := status.FromContextError(err)
	return st != nil, st
}
