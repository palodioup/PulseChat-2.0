package main

import (
	"fmt"
	"log"
	"github.com/SherClockHolmes/webpush-go"
)

func main() {
	privateKey, publicKey, err := webpush.GenerateVAPIDKeys()
	if err != nil {
		log.Fatalf("Failed to generate keys: %v", err)
	}
	fmt.Println("\n🌟 VAPID KEYS GENERATED SUCCESSFULLY!")
	fmt.Println("=====================================")
	fmt.Printf("PUBLIC_VAPID_KEY=%s\n", publicKey)
	fmt.Printf("PRIVATE_VAPID_KEY=%s\n", privateKey)
	fmt.Println("=====================================\n")
}
