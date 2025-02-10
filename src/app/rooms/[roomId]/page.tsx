"use client"
import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { usePathname } from "next/navigation"; // usePathnameを使用
import { FaPaperPlane } from "react-icons/fa";

// メッセージの型定義
interface Message {
  text: string;
  createdAt: Timestamp;
  username: string; // ユーザー名を追加
}

export default function RoomPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]); // 型をMessage[]に変更
  const [username, setUsername] = useState(""); // ユーザー名の状態を管理
  const pathname = usePathname(); // 現在のURLパスを取得
  const roomId = pathname.split("/").pop(); // URLからルームIDを抽出

  // ユーザー名の設定
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  // メッセージ取得（リアルタイム）
  useEffect(() => {
    const fetchMessages = () => {
      if (!roomId) return; // roomIdが設定されていない場合は何もしない
      const messagesQuery = query(
        collection(db, "rooms", roomId, "messages"),
        orderBy("createdAt")
      );

      // Firestoreのリアルタイムリスナーを使用
      onSnapshot(messagesQuery, (querySnapshot) => {
        const messageList: Message[] = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            text: data.text,
            createdAt: data.createdAt,
            username: data.username, // ユーザー名も取得
          };
        });
        setMessages(messageList); // メッセージを更新
      });
    };

    if (roomId) {
      fetchMessages();
    }
  }, [roomId]);

  // メッセージ送信
  const sendMessage = async () => {
    if (!message || !roomId || !username) return;
    try {
      await addDoc(collection(db, "rooms", roomId, "messages"), {
        text: message,
        createdAt: new Date(),
        username: username, // ユーザー名を一緒に送信
      });
      setMessage(""); // メッセージ送信後、入力をリセット
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  return (
    <div className="md:max-w-md w-full md:mx-auto p-4 md:py-8">
      <div className="p-4 rounded-lg border border-zinc-200 shadow-sm">
        <div className="flex items-center mb-4">
          <h1 className="text-xl font-bold">{roomId}</h1>
        </div>
        <input type="text" value={username} onChange={handleUsernameChange} className="px-4 py-2 border border-zinc-200 rounded-lg w-full placeholder:text-zinc-400 outline-none duration-200 focus-visible:ring-2 ring-offset-2" placeholder="Name" />
      </div>


      <div className="space-y-4 my-8 flex flex-col border border-zinc-200 rounded-lg p-4 shadow-sm h-64 overflow-y-auto">
        <h2 className="text-xl font-bold">Chat</h2>
        {messages.map((msg, index) => (
          <div key={index} className="p-2 bg-zinc-50 rounded-lg">
            <div className="flex items-center">
              <p className="text-sm text-zinc-600">{msg.username}</p>
            </div>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center border border-zinc-200 rounded-lg p-2 shadow-sm sticky bottom-8">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="px-4 py-2 bg-zinc-50 rounded-lg w-full placeholder:text-zinc-400 outline-none duration-200 focus-visible:ring-2 ring-offset-2"
          placeholder="メッセージを入力"
        />
        <button
          onClick={sendMessage}
          className="bg-zinc-800 text-white w-10 h-10 aspect-square rounded-lg font-bold whitespace-nowrap flex items-center justify-center ml-2"
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
}