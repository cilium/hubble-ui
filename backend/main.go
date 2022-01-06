package main

import (
	"fmt"
	"net"
	"os"
	"strconv"

	"github.com/cilium/hubble-ui/backend/proto/ui"
	gops "github.com/google/gops/agent"
	"github.com/sirupsen/logrus"
	"google.golang.org/grpc"

	"github.com/cilium/hubble-ui/backend/client"
	"github.com/cilium/hubble-ui/backend/internal/config"
	"github.com/cilium/hubble-ui/backend/internal/msg"
	"github.com/cilium/hubble-ui/backend/pkg/logger"
	"github.com/cilium/hubble-ui/backend/server"
)

var (
	log = logger.New("ui-backend")
)

const (
	EventsServerDefaultPort = 8090
)

func getServerAddr() string {
	port, ok := os.LookupEnv("EVENTS_SERVER_PORT")
	if !ok {
		port = fmt.Sprintf("%d", EventsServerDefaultPort)
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

func runServer(cfg *config.Config) {
	// observerAddr := getObserverAddr()
	srv := server.New(cfg)

	if err := srv.Run(); err != nil {
		log.Errorf(msg.ServerSetupRunError, err)
		os.Exit(1)
	}

	grpcServer := grpc.NewServer()
	ui.RegisterUIServer(grpcServer, srv)

	listener := setupListener()
	if err := grpcServer.Serve(listener); err != nil {
		log.Errorf(msg.ServerSetupRunError, err)
		os.Exit(1)
	}
}

func runClient(cfg *config.Config) {
	addr := cfg.UIServerListenAddr()
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

func runGops() {
	if enabled, _ := strconv.ParseBool(os.Getenv("GOPS_ENABLED")); !enabled {
		return
	}

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
}

func main() {
	runGops()

	cfg, err := config.Init()
	if err != nil {
		log.Errorf(msg.ServerSetupConfigInitError, err.Error())
		os.Exit(1)
	}

	if mode := getMode(); mode == "server" {
		runServer(cfg)
	} else {
		runClient(cfg)
	}
}
