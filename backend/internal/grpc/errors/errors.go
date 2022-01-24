package errors

import (
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func IsUnavailable(err error) bool {
	return status.Code(err) == codes.Unavailable
}
