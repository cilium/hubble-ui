package customprotocol

import (
	"github.com/cilium/hubble-ui/backend/internal/customprotocol/channel"
	"github.com/cilium/hubble-ui/backend/internal/customprotocol/message"
	"github.com/cilium/hubble-ui/backend/internal/customprotocol/route"
	"github.com/cilium/hubble-ui/backend/internal/customprotocol/router"
)

type Message = message.Message
type Channel = channel.Channel
type ChannelMiddleware = channel.ChannelMiddleware
type Router = router.Router
type RouteHandler = route.RouteHandler
