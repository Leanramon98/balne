package main

import (
	"flag"
	"fmt"
	"os"

	"project-base/backend/internal/platform/manifest"
	"project-base/backend/internal/platform/module"
)

func main() {
	check := flag.String("check", "", "validate a deployment manifest and exit")
	flag.Parse()
	if *check == "" {
		fmt.Fprintln(os.Stderr, "--check is required")
		os.Exit(2)
	}
	file, err := os.Open(*check)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	defer file.Close()
	value, err := manifest.Decode(file)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	registry, err := module.NewRegistry(nil, []module.Capability{"postgres"})
	if err == nil {
		_, err = manifest.Validate(value, registry)
	}
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	fmt.Println("manifest valid; composition can proceed to readiness")
}
