package main

import (
	"crypto/rand"
	"fmt"
	"github.com/xx-labs/sleeve/wallet"
	"syscall/js"
)

func main() {
	// register javascript functions
	js.Global().Set("newSleeveWallet", js.FuncOf(NewSleeveWallet))
	select {}
}

// NewSleeveWallet generates a new sleeve wallet
// using go's crypto/rand for entropy
func NewSleeveWallet(jsV js.Value, inputs []js.Value) interface{} {
	// generate sleeve
	passphrase := inputs[0].String()

	sleeve, err := wallet.NewSleeve(rand.Reader, passphrase, wallet.DefaultGenSpec())

	if err != nil {
		fmt.Printf("An error occured: %s\n", err)
		return map[string]interface{}{
			"success": false,
			"msg": err.Error(),
		}
	}

	// return result in json format
	return map[string]interface{}{
		"success": true,
		"msg": "",
		"mnemonics": map[string]interface{}{
			"quantum": sleeve.GetMnemonic(),
			"standard": sleeve.GetOutputMnemonic(),
		},
	}
}
