package errors

import (
	"fmt"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	cppb "github.com/cilium/hubble-ui/backend/proto/customprotocol"
)

func FromError(err error) *cppb.Error {
	if grpcStatus, ok := status.FromError(err); ok {
		return &cppb.Error{
			Kind:    cppb.Error_Grpc,
			Code:    int32(grpcStatus.Code()),
			Message: grpcStatus.Message(),
		}
	}

	return &cppb.Error{
		Kind:    cppb.Error_Unknown,
		Code:    0,
		Message: err.Error(),
	}
}

func ToError(err *cppb.Error) error {
	switch err.GetKind() {
	case cppb.Error_Unknown:
		return fmt.Errorf(
			"Kind: %s, Code: %d, Message: %s",
			err.GetKind().String(),
			err.GetCode(),
			err.GetMessage(),
		)
	case cppb.Error_Grpc:
		return ToGrpcError(err)
	}

	return nil
}

func ToGrpcError(err *cppb.Error) error {
	return status.Error(
		codes.Code(err.GetCode()),
		err.GetMessage(),
	)
}
