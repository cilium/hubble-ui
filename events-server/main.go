package main

import (
	"fmt"
	"net"
	"os"

	"github.com/cilium/cilium/api/v1/relay"
	"google.golang.org/grpc"

	"github.com/cilium/hubble-ui/events-server/client"
	"github.com/cilium/hubble-ui/events-server/logger"
	"github.com/cilium/hubble-ui/events-server/server"
)

var (
	log = logger.New("main")
)

const (
	EVENTS_SERVER_DEFAULT_PORT = 8090
)

func getServerAddr() string {
	port, ok := os.LookupEnv("EVENTS_SERVER_PORT")
	if !ok {
		port = fmt.Sprintf("%d", EVENTS_SERVER_DEFAULT_PORT)
		log.Warnf("server port is set to default (%s)\n", port)
	}

	return fmt.Sprintf("0.0.0.0:%s", port)
}

func setupListener() net.Listener {
	addr := getServerAddr()
	log.Infof("listening at: %s\n", addr)

	listener, err := net.Listen("tcp", addr)
	if err != nil {
		log.Errorf("failed to listen: %v", err)
		os.Exit(1)
	}

	return listener
}

func getObserverAddr() string {
	observerAddr, ok := os.LookupEnv("FLOWS_API_ADDR")
	if !ok {
		observerAddr = "0.0.0.0:50051"
		log.Warnf("observer addr is set to default (%s)\n", observerAddr)
	}

	return observerAddr
}

func runServer() {
	observerAddr := getObserverAddr()
	srv := server.New(observerAddr)

	if err := srv.Run(); err != nil {
		log.Errorf("failed to run server: %v\n", err)
		os.Exit(1)
	}

	grpcServer := grpc.NewServer()
	relay.RegisterHubbleRelayServer(grpcServer, srv)

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
	if mode := getMode(); mode == "server" {
		runServer()
	} else {
		runClient()
	}
}
