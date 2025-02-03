// Code generated by go-swagger; DO NOT EDIT.

// Copyright Authors of Cilium
// SPDX-License-Identifier: Apache-2.0

package prefilter

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"encoding/json"
	"fmt"
	"io"

	"github.com/go-openapi/runtime"
	"github.com/go-openapi/strfmt"

	"github.com/cilium/cilium/api/v1/models"
)

// DeletePrefilterReader is a Reader for the DeletePrefilter structure.
type DeletePrefilterReader struct {
	formats strfmt.Registry
}

// ReadResponse reads a server response into the received o.
func (o *DeletePrefilterReader) ReadResponse(response runtime.ClientResponse, consumer runtime.Consumer) (interface{}, error) {
	switch response.Code() {
	case 200:
		result := NewDeletePrefilterOK()
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		return result, nil
	case 403:
		result := NewDeletePrefilterForbidden()
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		return nil, result
	case 461:
		result := NewDeletePrefilterInvalidCIDR()
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		return nil, result
	case 500:
		result := NewDeletePrefilterFailure()
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		return nil, result
	default:
		return nil, runtime.NewAPIError("[DELETE /prefilter] DeletePrefilter", response, response.Code())
	}
}

// NewDeletePrefilterOK creates a DeletePrefilterOK with default headers values
func NewDeletePrefilterOK() *DeletePrefilterOK {
	return &DeletePrefilterOK{}
}

/*
DeletePrefilterOK describes a response with status code 200, with default header values.

Deleted
*/
type DeletePrefilterOK struct {
	Payload *models.Prefilter
}

// IsSuccess returns true when this delete prefilter o k response has a 2xx status code
func (o *DeletePrefilterOK) IsSuccess() bool {
	return true
}

// IsRedirect returns true when this delete prefilter o k response has a 3xx status code
func (o *DeletePrefilterOK) IsRedirect() bool {
	return false
}

// IsClientError returns true when this delete prefilter o k response has a 4xx status code
func (o *DeletePrefilterOK) IsClientError() bool {
	return false
}

// IsServerError returns true when this delete prefilter o k response has a 5xx status code
func (o *DeletePrefilterOK) IsServerError() bool {
	return false
}

// IsCode returns true when this delete prefilter o k response a status code equal to that given
func (o *DeletePrefilterOK) IsCode(code int) bool {
	return code == 200
}

// Code gets the status code for the delete prefilter o k response
func (o *DeletePrefilterOK) Code() int {
	return 200
}

func (o *DeletePrefilterOK) Error() string {
	payload, _ := json.Marshal(o.Payload)
	return fmt.Sprintf("[DELETE /prefilter][%d] deletePrefilterOK %s", 200, payload)
}

func (o *DeletePrefilterOK) String() string {
	payload, _ := json.Marshal(o.Payload)
	return fmt.Sprintf("[DELETE /prefilter][%d] deletePrefilterOK %s", 200, payload)
}

func (o *DeletePrefilterOK) GetPayload() *models.Prefilter {
	return o.Payload
}

func (o *DeletePrefilterOK) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	o.Payload = new(models.Prefilter)

	// response payload
	if err := consumer.Consume(response.Body(), o.Payload); err != nil && err != io.EOF {
		return err
	}

	return nil
}

// NewDeletePrefilterForbidden creates a DeletePrefilterForbidden with default headers values
func NewDeletePrefilterForbidden() *DeletePrefilterForbidden {
	return &DeletePrefilterForbidden{}
}

/*
DeletePrefilterForbidden describes a response with status code 403, with default header values.

Forbidden
*/
type DeletePrefilterForbidden struct {
}

// IsSuccess returns true when this delete prefilter forbidden response has a 2xx status code
func (o *DeletePrefilterForbidden) IsSuccess() bool {
	return false
}

// IsRedirect returns true when this delete prefilter forbidden response has a 3xx status code
func (o *DeletePrefilterForbidden) IsRedirect() bool {
	return false
}

// IsClientError returns true when this delete prefilter forbidden response has a 4xx status code
func (o *DeletePrefilterForbidden) IsClientError() bool {
	return true
}

// IsServerError returns true when this delete prefilter forbidden response has a 5xx status code
func (o *DeletePrefilterForbidden) IsServerError() bool {
	return false
}

// IsCode returns true when this delete prefilter forbidden response a status code equal to that given
func (o *DeletePrefilterForbidden) IsCode(code int) bool {
	return code == 403
}

// Code gets the status code for the delete prefilter forbidden response
func (o *DeletePrefilterForbidden) Code() int {
	return 403
}

func (o *DeletePrefilterForbidden) Error() string {
	return fmt.Sprintf("[DELETE /prefilter][%d] deletePrefilterForbidden", 403)
}

func (o *DeletePrefilterForbidden) String() string {
	return fmt.Sprintf("[DELETE /prefilter][%d] deletePrefilterForbidden", 403)
}

func (o *DeletePrefilterForbidden) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	return nil
}

// NewDeletePrefilterInvalidCIDR creates a DeletePrefilterInvalidCIDR with default headers values
func NewDeletePrefilterInvalidCIDR() *DeletePrefilterInvalidCIDR {
	return &DeletePrefilterInvalidCIDR{}
}

/*
DeletePrefilterInvalidCIDR describes a response with status code 461, with default header values.

Invalid CIDR prefix
*/
type DeletePrefilterInvalidCIDR struct {
	Payload models.Error
}

// IsSuccess returns true when this delete prefilter invalid c Id r response has a 2xx status code
func (o *DeletePrefilterInvalidCIDR) IsSuccess() bool {
	return false
}

// IsRedirect returns true when this delete prefilter invalid c Id r response has a 3xx status code
func (o *DeletePrefilterInvalidCIDR) IsRedirect() bool {
	return false
}

// IsClientError returns true when this delete prefilter invalid c Id r response has a 4xx status code
func (o *DeletePrefilterInvalidCIDR) IsClientError() bool {
	return true
}

// IsServerError returns true when this delete prefilter invalid c Id r response has a 5xx status code
func (o *DeletePrefilterInvalidCIDR) IsServerError() bool {
	return false
}

// IsCode returns true when this delete prefilter invalid c Id r response a status code equal to that given
func (o *DeletePrefilterInvalidCIDR) IsCode(code int) bool {
	return code == 461
}

// Code gets the status code for the delete prefilter invalid c Id r response
func (o *DeletePrefilterInvalidCIDR) Code() int {
	return 461
}

func (o *DeletePrefilterInvalidCIDR) Error() string {
	payload, _ := json.Marshal(o.Payload)
	return fmt.Sprintf("[DELETE /prefilter][%d] deletePrefilterInvalidCIdR %s", 461, payload)
}

func (o *DeletePrefilterInvalidCIDR) String() string {
	payload, _ := json.Marshal(o.Payload)
	return fmt.Sprintf("[DELETE /prefilter][%d] deletePrefilterInvalidCIdR %s", 461, payload)
}

func (o *DeletePrefilterInvalidCIDR) GetPayload() models.Error {
	return o.Payload
}

func (o *DeletePrefilterInvalidCIDR) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	// response payload
	if err := consumer.Consume(response.Body(), &o.Payload); err != nil && err != io.EOF {
		return err
	}

	return nil
}

// NewDeletePrefilterFailure creates a DeletePrefilterFailure with default headers values
func NewDeletePrefilterFailure() *DeletePrefilterFailure {
	return &DeletePrefilterFailure{}
}

/*
DeletePrefilterFailure describes a response with status code 500, with default header values.

Prefilter delete failed
*/
type DeletePrefilterFailure struct {
	Payload models.Error
}

// IsSuccess returns true when this delete prefilter failure response has a 2xx status code
func (o *DeletePrefilterFailure) IsSuccess() bool {
	return false
}

// IsRedirect returns true when this delete prefilter failure response has a 3xx status code
func (o *DeletePrefilterFailure) IsRedirect() bool {
	return false
}

// IsClientError returns true when this delete prefilter failure response has a 4xx status code
func (o *DeletePrefilterFailure) IsClientError() bool {
	return false
}

// IsServerError returns true when this delete prefilter failure response has a 5xx status code
func (o *DeletePrefilterFailure) IsServerError() bool {
	return true
}

// IsCode returns true when this delete prefilter failure response a status code equal to that given
func (o *DeletePrefilterFailure) IsCode(code int) bool {
	return code == 500
}

// Code gets the status code for the delete prefilter failure response
func (o *DeletePrefilterFailure) Code() int {
	return 500
}

func (o *DeletePrefilterFailure) Error() string {
	payload, _ := json.Marshal(o.Payload)
	return fmt.Sprintf("[DELETE /prefilter][%d] deletePrefilterFailure %s", 500, payload)
}

func (o *DeletePrefilterFailure) String() string {
	payload, _ := json.Marshal(o.Payload)
	return fmt.Sprintf("[DELETE /prefilter][%d] deletePrefilterFailure %s", 500, payload)
}

func (o *DeletePrefilterFailure) GetPayload() models.Error {
	return o.Payload
}

func (o *DeletePrefilterFailure) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	// response payload
	if err := consumer.Consume(response.Body(), &o.Payload); err != nil && err != io.EOF {
		return err
	}

	return nil
}
