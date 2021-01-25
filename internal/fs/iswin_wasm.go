// +build js,wasm

package fs

import (
	"os"
	"strings"
)

var checkedIfWindows bool
var cachedIfWindows bool

func checkIfWindows() bool {
	if !checkedIfWindows {
		cachedIfWindows = false

		// Hack: Assume that we're on Windows if we're running WebAssembly and the
		// "windir" environment variable is set. This is a workaround for a bug in
		// Go's WebAssembly support: https://github.com/golang/go/issues/43768.
		for _, env := range os.Environ() {
			if strings.EqualFold(env, "windir") {
				cachedIfWindows = true
				break
			}
		}
	}

	return cachedIfWindows
}
