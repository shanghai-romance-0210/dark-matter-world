"use client"
import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { usePathname } from "next/navigation"; // usePathnameを使用

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
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">ルーム: {roomId}</h1>

      {/* ユーザー名設定フォーム */}
      <div className="mb-4">
        <input
          type="text"
          value={username}
          onChange={handleUsernameChange}
          className="p-2 border border-gray-300 rounded-md w-full"
          placeholder="名前を入力"
        />
      </div>

      <div className="border-b mb-4"></div>

      <div className="space-y-4 mb-4">
        {messages.map((msg, index) => (
          <div key={index} className="p-2 bg-gray-100 rounded-md">
            <p className="font-semibold">{msg.username}: </p>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>

      <div className="flex">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="p-2 border border-gray-300 rounded-l-md w-full"
          placeholder="メッセージを入力"
        />
        <button
          onClick={sendMessage}
          className="bg-primary text-white py-2 px-4 rounded-r-md"
        >
          送信
        </button>
      </div>
    </div>
  );
}