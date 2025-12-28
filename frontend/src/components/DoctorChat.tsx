import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Stethoscope, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function DoctorChat({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const agentRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      from: "doctor",
      text: "Hello, I'm Dr. Mayur, your virtual health consultant. How can I help you today?",
    },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) setTimeout(() => agentRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (agentRef.current) agentRef.current.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.src = "https://bey.chat/1f5046d2-4965-4580-8d39-48ced5e17b58";
    iframe.style.width = "100%";
    iframe.style.height = "400px";
    iframe.style.border = "none";
    iframe.style.maxWidth = "100%";
    iframe.allow = "camera; microphone; fullscreen";
    iframe.allowFullscreen = true;
    agentRef.current.appendChild(iframe);
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { from: "user", text: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/doctor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setMessages((msgs) => [
        ...msgs,
        { from: "doctor", text: data.reply || "Sorry, I couldn't process that." },
      ]);
    } catch {
      setMessages((msgs) => [
        ...msgs,
        { from: "doctor", text: "Sorry, there was a problem connecting to the doctor." },
      ]);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto p-0 overflow-hidden border border-teal-200">
        {/* Header */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-teal-600 to-blue-500 px-6 py-4">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border-4 border-white shadow-md">
            <Stethoscope className="w-7 h-7 text-teal-600" />
          </div>
          <div>
            <div className="font-bold text-lg text-white flex items-center gap-2">
              Dr. Mayur
            </div>
            <div className="text-xs text-blue-100">Virtual Health Consultant</div>
          </div>
          <button className="ml-auto text-white/80 hover:text-white text-xl" onClick={onClose}>&times;</button>
        </div>
        {/* Video Avatar */}
        <div ref={agentRef} className="w-full flex justify-center items-center min-h-[320px] bg-slate-50 rounded-b-xl" />
        {/* Chat UI */}
        <div className="px-4 py-3 bg-white border-t border-gray-100">
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the doctor anything..."
              className="flex-1 rounded-full bg-slate-100 border border-blue-200"
              disabled={loading}
              autoFocus
            />
            <Button type="submit" className="rounded-full px-4" disabled={loading || !input.trim()}>
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
