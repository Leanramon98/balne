// User-owned: HTTP transport configuration for the reverse proxy.
//
// The generated proxyHandler in main_generated.go uses http.DefaultTransport
// (via httputil.ReverseProxy.getTransport()), which has IdleConnTimeout=90s.
// When backend services restart or idle connections time out on the Docker
// network, the proxy gets "EOF" errors because it tries to reuse a stale
// connection from the pool.
//
// This file reduces IdleConnTimeout so stale connections are recycled long
// before the backend closes them. It also caps MaxIdleConnsPerHost to keep
// the pool small and predictable.
package main

import (
	"net/http"
	"time"
)

func init() {
	// Modifies http.DefaultTransport in-place so ALL reverse proxies
	// (including generated routes in main_generated.go) benefit.
	if tr, ok := http.DefaultTransport.(*http.Transport); ok {
		tr.CloseIdleConnections()
		tr.MaxIdleConns = 50
		tr.MaxIdleConnsPerHost = 5
		tr.IdleConnTimeout = 10 * time.Second
		tr.DisableKeepAlives = true
	}
}
