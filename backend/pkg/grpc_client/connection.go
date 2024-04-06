package grpc_client

import (
	"context"
	"fmt"
	"sync"

	"github.com/sirupsen/logrus"
	"google.golang.org/grpc"
	"google.golang.org/grpc/connectivity"
)

type ConnectionDesc = *grpc.ClientConn

// NOTE: Mutex `mx` is used by value here, so no copying is allowed
type Connection struct {
	Tag        ConnectionTag
	Connection ConnectionDesc

	addr           string
	dialOpts       []grpc.DialOption
	mx             sync.Mutex
	disconnectOnce sync.Once
}

type ConnectionsMap map[string]*Connection

func (uc *Connection) String() string {
	return fmt.Sprintf(
		"Connection at %p { key: %s, state: %v }",
		uc,
		uc.Tag.Key,
		uc.Connection.GetState(),
	)
}

func (uc *Connection) connect(ctx context.Context) error {
	conn, err := grpc.DialContext(ctx, uc.addr, uc.dialOpts...)
	if err != nil {
		return err
	}

	uc.Connection = conn
	uc.disconnectOnce = sync.Once{}
	return nil
}

func (uc *Connection) Disconnect() error {
	uc.lock()
	defer uc.unlock()

	if uc.Connection == nil {
		return nil
	}

	var err error = nil
	uc.disconnectOnce.Do(func() {
		err = uc.Connection.Close()
	})

	return err
}

func (uc *Connection) IsConnected() bool {
	uc.lock()
	defer uc.unlock()

	return uc.isReady()
}

func (uc *Connection) isReady() bool {
	conn := uc.Connection
	if conn == nil {
		return false
	}

	return conn.GetState() == connectivity.Ready
}

func (uc *Connection) lock() {
	uc.mx.Lock()
}

func (uc *Connection) unlock() {
	uc.mx.Unlock()
}

func (uc *Connection) logFields() logrus.Fields {
	fields := logrus.Fields{
		"key":  uc.Tag.Key,
		"addr": uc.addr,
	}

	conn := uc.Connection
	if conn != nil {
		fields["grpc-state"] = conn.GetState()
	} else {
		fields["handle-is-nil"] = true
	}

	return fields
}

func initConection(
	tag ConnectionTag, addr string, dialOpts []grpc.DialOption,
) *Connection {
	conn := new(Connection)
	conn.Tag = tag

	conn.mx = sync.Mutex{}
	conn.addr = addr
	conn.dialOpts = dialOpts
	conn.disconnectOnce = sync.Once{}

	return conn
}
