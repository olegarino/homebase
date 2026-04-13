import { invoke, Channel } from "@tauri-apps/api/core";
import { useEffect, useState, FormEvent } from "react";

interface ChatMessage {
    role: string;
    content: string;
}

interface ChatResponse {
    message: string;
}

const ChatComponent = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [models, setModels] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>("");

    useEffect(() => {
        const fetchModels = async () => {
            try {
                const fetchedModels: string[] = await invoke("get_models");
                setModels(fetchedModels);
                if (fetchedModels.length > 0) {
                    setSelectedModel(fetchedModels[0]);
                }
            } catch (error) {
                console.error("Error fetching models:", error);
            }
        };
        fetchModels();
    }, []);

    const sendMessage = async (e: FormEvent): Promise<void> => {
        e.preventDefault();
        if (!input.trim() || !selectedModel) return;
        const userMessage: ChatMessage = { role: "user", content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput("");

        const channel = new Channel<ChatResponse>();

        channel.onmessage = (data: ChatResponse) => {
            const messageContent = data.message;
            setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && lastMsg.role === "assistant") {
                    return [...prev.slice(0, -1), { role: "assistant", content: lastMsg.content + messageContent }];
                }
                return [...prev, { role: "assistant", content: messageContent }];
            });
        };

        try {
            await invoke("chat", {
                request: {
                    model: selectedModel,
                    messages: [...messages, userMessage],
                },
                onStream: channel,
            });
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => [...prev, { role: "assistant", content: "Error: " + (error as Error).message }]);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedModel(e.target.value);
    };

    return (
        <div className="chat-container">
            <div className="chat-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.role}`}>
                        <span className="message-label">{msg.role}</span>
                        <span className="message-content">{msg.content}</span>
                    </div>
                ))}
            </div>
            <form className="chat-controls" onSubmit={sendMessage}>
                <div className="model-selector-inline">
                    <label htmlFor="model-select">Model:</label>
                    <select id="inline-model-select" value={selectedModel} onChange={handleSelectChange}>
                        {models.map(model => (
                            <option key={model} value={model}>{model}</option>
                        ))}
                    </select>
                </div>
                <div className="input-actions">
                    <input
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Type your message..."
                        className="chat-input"
                    />
                    <button type="submit" className="chat-send-button">Send</button>
                </div>
            </form>
        </div>
    );
};

export default ChatComponent;