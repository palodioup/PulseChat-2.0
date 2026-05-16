package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/SherClockHolmes/webpush-go"
)

type Keys struct {
	P256dh string `json:"p256dh"`
	Auth   string `json:"auth"`
}

type Subscription struct {
	Endpoint string `json:"endpoint"`
	Keys     Keys   `json:"keys"`
}

type PushRequest struct {
	Subscription Subscription `json:"subscription"`
	SenderName   string       `json:"senderName"`
	Text         string       `json:"text"`
}

type NotificationPayload struct {
	Title string `json:"title"`
	Body  string `json:"body"`
	Icon  string `json:"icon"`
}

func sendOfflinePushHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req PushRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	shortText := req.Text
	if len(shortText) > 35 {
		shortText = shortText[:32] + "..."
	}
	if shortText == "" {
		shortText = "📷 Sent an image attachment"
	}

	payloadData, err := json.Marshal(NotificationPayload{
		Title: fmt.Sprintf("New Message from %s", req.SenderName),
		Body:  shortText,
		Icon:  "/logo192.png",
	})
	if err != nil {
		http.Error(w, "Payload configuration failed", http.StatusInternalServerError)
		return
	}

	sub := webpush.Subscription{
		Endpoint: req.Subscription.Endpoint,
		Keys: webpush.Keys{
			P256dh: req.Subscription.Keys.P256dh,
			Auth:   req.Subscription.Keys.Auth,
		},
	}

	resp, err := webpush.SendNotification(payloadData, &sub, &webpush.Options{
		Subscriber:      "mailto:your-email@domain.com",
		VAPIDPublicKey:  os.Getenv("PUBLIC_VAPID_KEY"),
		VAPIDPrivateKey: os.Getenv("PRIVATE_VAPID_KEY"),
		TTL:             30, 
	})
	if err != nil {
		log.Printf("Go WebPush Execution Error: %v", err)
		http.Error(w, "Failed to push network notification", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

func main() {
	http.HandleFunc("/api/send-offline-push", sendOfflinePushHandler)

	fmt.Println("🚀 Go Push Microservice initialized on port 5000...")
	log.Fatal(http.ListenAndServe(":5000", nil))
}
