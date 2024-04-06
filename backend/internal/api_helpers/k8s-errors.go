package api_helpers

import (
	"strings"

	k8s_errors "k8s.io/apimachinery/pkg/api/errors"
)

func IsK8sResourcePermissionsError(err error) bool {
	return (k8s_errors.IsUnauthorized(err) ||
		k8s_errors.IsForbidden(err) ||
		strings.Contains(err.Error(), "is forbidden"))
}

func IsK8sResourceNotFound(err error) bool {
	normalNotFound := k8s_errors.IsNotFound(err)
	if normalNotFound {
		return true
	}

	// NOTE: it seems that either not correct error handling is setup
	// NOTE: or, such errors cannot be normally recognized because of this:
	// https://github.com/kubernetes/client-go/blob/master/tools/cache/reflector.go#L323
	return strings.Contains(
		err.Error(),
		"the server could not find the requested resource",
	)
}

func IsTimeout(err error) bool {
	return k8s_errors.IsServerTimeout(err) || k8s_errors.IsTimeout(err)
}

func IsServiceUnavailable(err error) bool {
	return k8s_errors.IsServiceUnavailable(err)
}
