import React, { useEffect, useState } from "react";
import "./Messenger.css";

interface Message {
  text: string;
  sender: string;
}

interface Profile {
  username: string;
}

interface MessengerProps {
  profile: Profile | null;
}

const Messenger: React.FC<MessengerProps> = ({ profile }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/messages/", {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Error ${res.status}: ${text}`);
        }
        return res.json();
      })
      .then((data: unknown) => {
        if (!Array.isArray(data)) {
          throw new Error("Response is not an array");
        }
        setMessages(data as Message[]);
        setError("");
      })
      .catch((err) => {
        console.error("Failed to fetch messages:", err);
        setError("Failed to load messages. Are you logged in?");
      })
      .finally(() => setLoading(false));
  }, []);

  const getColor = (sender: string): string => {
    const colors = ["#FF6B6B", "#6BCB77", "#4D96FF", "#FFD93D", "#9D4EDD"];
    let hash = 0;
    for (let i = 0; i < sender.length; i++) {
      hash += sender.charCodeAt(i);
    }
    return colors.length > 0 ? colors[hash % colors.length] ?? "#000000" : "#000000";
  };

  const handleSend = () => {
    if (input.trim() === "") return;

    const newMessage: Message = {
      text: input,
      sender: profile?.username || "user",
    };

    fetch("http://127.0.0.1:8000/api/messages/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(newMessage),
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Send failed: ${text}`);
        }
        return res.json();
      })
      .then((data: Message) => {
        setMessages((prev) => [...prev, data]);
        setInput("");
        setError("");
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to send message.");
      });
  };

  if (loading) return <div>Loading messages...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div className="messenger-container">
      <div className="messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${
              msg.sender === profile?.username ? "right" : "left"
            }`}
            style={{ backgroundColor: getColor(msg.sender) }}
          >
            <strong>{msg.sender}</strong>
            <br />
            {msg.text}
          </div>
        ))}
      </div>
      <div className="input-container">
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default Messenger;
