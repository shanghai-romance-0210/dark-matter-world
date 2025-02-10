"use client"
import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, doc, deleteDoc, getDocs } from "firebase/firestore";
import { usePathname } from "next/navigation"; 
import { FaPaperPlane } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns"; 
import Link from "next/link";
import { FiChevronLeft, FiHelpCircle, FiMoreHorizontal } from "react-icons/fi";

// メッセージの型定義
interface Message {
  text: string;
  createdAt: Timestamp;
  username: string;
}

export default function RoomPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [username, setUsername] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // ドロップダウンの開閉状態
  const pathname = usePathname();
  const roomId = pathname.split("/").pop();

  // ユーザー名の設定
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  // メッセージ取得（リアルタイム）
  useEffect(() => {
    const fetchMessages = () => {
      if (!roomId) return;
      const messagesQuery = query(
        collection(db, "rooms", roomId, "messages"),
        orderBy("createdAt")
      );

      onSnapshot(messagesQuery, (querySnapshot) => {
        const messageList: Message[] = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            text: data.text,
            createdAt: data.createdAt,
            username: data.username,
          };
        });
        setMessages(messageList.reverse());
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
        username: username,
      });
      setMessage("");
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  // タイムスタンプを「何分前」などの形式で表示
  const formatRelativeTime = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // ルームを削除する処理
  const deleteRoom = async () => {
    if (!roomId) return;
    try {
      // まず、ルーム内のメッセージを削除
      const messagesRef = collection(db, "rooms", roomId, "messages");
      const messageSnapshot = await getDocs(messagesRef);
      messageSnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      // 次に、ルーム自体を削除
      await deleteDoc(doc(db, "rooms", roomId));
      console.log("Room deleted successfully");
      // ルーム削除後、ページ遷移
      window.location.href = "/";
    } catch (error) {
      console.error("Error deleting room: ", error);
    }
  };

  return (
    <div className="md:max-w-md w-full md:mx-auto p-4 md:py-8">
      <div className="flex items-center mb-4">
        <Link href="/" className="w-10 h-10 rounded-full duration-200 hover:bg-zinc-200 flex items-center justify-center bg-zinc-50">
          <FiChevronLeft className="text-xl" />
        </Link>
        <Link href="/help" className="w-10 h-10 rounded-full duration-200 hover:bg-zinc-200 flex items-center justify-center ml-auto bg-zinc-50">
          <FiHelpCircle className="text-xl" />
        </Link>
      </div>

      <div className="p-4 rounded-lg border border-zinc-200 shadow-sm">
        <div className="flex items-center mb-4">
          <h1 className="text-xl font-bold">{roomId}</h1>
          <div className="relative ml-auto">
            <button
              className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)} // ドロップダウンの開閉
            >
              <FiMoreHorizontal />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 p-2 bg-white border border-zinc-200 rounded-lg shadow-lg">
                <button onClick={deleteRoom} className="w-full text-red-600 px-4 py-2 text-left hover:bg-red-50 duration-200 rounded-lg">
                  Delete Room
                </button>
              </div>
            )}
          </div>
        </div>
        <input
          type="text"
          value={username}
          onChange={handleUsernameChange}
          className="px-4 py-2 border border-zinc-200 rounded-lg w-full placeholder:text-zinc-400 outline-none duration-200 focus-visible:ring-2 ring-offset-2"
          placeholder="Name"
        />
      </div>

      <div className="space-y-4 my-8 flex flex-col border border-zinc-200 rounded-lg p-4 shadow-sm h-[640px] overflow-y-auto">
        <h2 className="text-xl font-bold">Chat</h2>
        {messages.map((msg, index) => (
          <div key={index} className="p-4 bg-zinc-50 rounded-lg">
            <div className="flex items-center mb-2">
              <img
                src={`https://api.dicebear.com/9.x/open-peeps/svg?seed=${msg.username}`}
                alt="Avatar"
                className="bg-white w-8 h-8 rounded-full aspetc-square mr-2"
              />
              <p className="text-sm font-bold mr-2">{msg.username}</p>
              <p className="text-sm text-zinc-400">{formatRelativeTime(msg.createdAt)}</p>
            </div>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center border border-zinc-200 rounded-lg p-2 shadow-sm sticky bottom-8 bg-white">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="px-4 py-2 bg-zinc-50 rounded-lg w-full placeholder:text-zinc-400 outline-none duration-200 focus-visible:ring-2 ring-offset-2"
          placeholder="Enter a message..."
        />
        <button
          onClick={sendMessage}
          className="bg-zinc-800 text-white w-10 h-10 text-xl aspect-square rounded-lg font-bold whitespace-nowrap flex items-center justify-center ml-2"
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
}