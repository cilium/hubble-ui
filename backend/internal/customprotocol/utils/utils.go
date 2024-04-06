package utils

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"

	"github.com/pkg/errors"
	protobuf "google.golang.org/protobuf/proto"

	"github.com/cilium/hubble-ui/backend/internal/customprotocol/message"
	cppb "github.com/cilium/hubble-ui/backend/proto/customprotocol"
)

func GenBytesHash(nbytes int) (string, error) {
	bytes := make([]byte, nbytes)

	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}

	return hex.EncodeToString(bytes), nil
}

func ParseMessageFromBytes(b []byte, inJSON bool) (*message.Message, error) {
	if inJSON {
		return ParseMessageFromJSON(b)
	} else {
		return ParseMessageFromProtoBytes(b)
	}
}

func ParseMessageFromProtoBytes(b []byte) (*message.Message, error) {
	cpMessage := cppb.Message{}
	if err := protobuf.Unmarshal(b, &cpMessage); err != nil {
		return nil, errors.Wrapf(err, "failed to Unmarshal cppb.Message")
	}

	return message.NewFromProto(&cpMessage, nil), nil
}

func ParseMessageFromJSON(b []byte) (*message.Message, error) {
	cpMessage := cppb.Message{}
	if err := json.Unmarshal(b, &cpMessage); err != nil {
		return nil, errors.Wrapf(err, "failed to JSON Unmarshal cppb.Message")
	}

	return &message.Message{
		Proto: &cpMessage,
	}, nil
}

func CopyHeaders(dst, src http.Header) {
	for hname, hvalues := range src {
		for _, hvalue := range hvalues {
			dst.Add(hname, hvalue)
		}
	}
}
