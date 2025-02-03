// Code generated by go-swagger; DO NOT EDIT.

// Copyright Authors of Cilium
// SPDX-License-Identifier: Apache-2.0

package daemon

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

// GetMapReader is a Reader for the GetMap structure.
type GetMapReader struct {
	formats strfmt.Registry
}

// ReadResponse reads a server response into the received o.
func (o *GetMapReader) ReadResponse(response runtime.ClientResponse, consumer runtime.Consumer) (interface{}, error) {
	switch response.Code() {
	case 200:
		result := NewGetMapOK()
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		return result, nil
	default:
		return nil, runtime.NewAPIError("[GET /map] GetMap", response, response.Code())
	}
}

// NewGetMapOK creates a GetMapOK with default headers values
func NewGetMapOK() *GetMapOK {
	return &GetMapOK{}
}

/*
GetMapOK describes a response with status code 200, with default header values.

Success
*/
type GetMapOK struct {
	Payload *models.BPFMapList
}

// IsSuccess returns true when this get map o k response has a 2xx status code
func (o *GetMapOK) IsSuccess() bool {
	return true
}

// IsRedirect returns true when this get map o k response has a 3xx status code
func (o *GetMapOK) IsRedirect() bool {
	return false
}

// IsClientError returns true when this get map o k response has a 4xx status code
func (o *GetMapOK) IsClientError() bool {
	return false
}

// IsServerError returns true when this get map o k response has a 5xx status code
func (o *GetMapOK) IsServerError() bool {
	return false
}

// IsCode returns true when this get map o k response a status code equal to that given
func (o *GetMapOK) IsCode(code int) bool {
	return code == 200
}

// Code gets the status code for the get map o k response
func (o *GetMapOK) Code() int {
	return 200
}

func (o *GetMapOK) Error() string {
	payload, _ := json.Marshal(o.Payload)
	return fmt.Sprintf("[GET /map][%d] getMapOK %s", 200, payload)
}

func (o *GetMapOK) String() string {
	payload, _ := json.Marshal(o.Payload)
	return fmt.Sprintf("[GET /map][%d] getMapOK %s", 200, payload)
}

func (o *GetMapOK) GetPayload() *models.BPFMapList {
	return o.Payload
}

func (o *GetMapOK) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	o.Payload = new(models.BPFMapList)

	// response payload
	if err := consumer.Consume(response.Body(), o.Payload); err != nil && err != io.EOF {
		return err
	}

	return nil
}
