package main

import (
	"fmt"
	"net"
	"os"

	// "github.com/cilium/cilium/pkg/logging"
	// "github.com/cilium/cilium/pkg/logging/logfields"
	"github.com/cilium/hubble-ui/backend/proto/ui"
	gops "github.com/google/gops/agent"
	"github.com/sirupsen/logrus"
	"google.golang.org/grpc"

	"github.com/cilium/hubble-ui/backend/client"
	"github.com/cilium/hubble-ui/backend/internal/msg"
	"github.com/cilium/hubble-ui/backend/logger"
	"github.com/cilium/hubble-ui/backend/server"
)

var (
	log = logger.New("ui-backend")
)

const (
	EVENTS_SERVER_DEFAULT_PORT = 8090
)

func getServerAddr() string {
	port, ok := os.LookupEnv("EVENTS_SERVER_PORT")
	if !ok {
		port = fmt.Sprintf("%d", EVENTS_SERVER_DEFAULT_PORT)
		log.Warnf(msg.ServerSetupUsingDefPort, port)
	}

	return fmt.Sprintf("0.0.0.0:%s", port)
}

func setupListener() net.Listener {
	addr := getServerAddr()
	listener, err := net.Listen("tcp", addr)
	if err != nil {
		log.Errorf(msg.ServerSetupListenError, err)
		os.Exit(1)
	}

	log.Infof(msg.ServerSetupListeningAt, addr)
	return listener
}

func getObserverAddr() string {
	observerAddr, ok := os.LookupEnv("FLOWS_API_ADDR")
	if !ok {
		observerAddr = "0.0.0.0:50051"
		log.Warnf(msg.ServerSetupUsingDefRelayAddr, observerAddr)
	}

	return observerAddr
}

func runServer() {
	observerAddr := getObserverAddr()
	srv := server.New(observerAddr)

	if err := srv.Run(); err != nil {
		log.Errorf(msg.ServerSetupRunError, err)
		os.Exit(1)
	}

	grpcServer := grpc.NewServer()
	ui.RegisterUIServer(grpcServer, srv)

	listener := setupListener()
	grpcServer.Serve(listener)
}

func runClient() {
	addr := getServerAddr()
	log.Infof("connecting to server: %s\n", addr)

	cl := client.New(addr)
	cl.Run()
}

func getMode() string {
	mode, _ := os.LookupEnv("MODE")
	if mode == "client" {
		return "client"
	}

	return "server"
}

func main() {
	gopsPort := "0"
	if gopsPortEnv := os.Getenv("GOPS_PORT"); gopsPortEnv != "" {
		gopsPort = gopsPortEnv
	}
	// Open socket for using gops to get stacktraces of the agent.
	addr := fmt.Sprintf("127.0.0.1:%s", gopsPort)
	addrField := logrus.Fields{"address": addr}
	if err := gops.Listen(gops.Options{
		Addr:                   addr,
		ReuseSocketAddrAndPort: true,
	}); err != nil {
		log.WithError(err).WithFields(addrField).Fatal("Cannot start gops server")
	}
	log.WithFields(addrField).Info("Started gops server")

	if mode := getMode(); mode == "server" {
		runServer()
	} else {
		runClient()
	}
}
