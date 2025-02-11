"use client"
import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, doc, deleteDoc, getDocs, getDoc, updateDoc } from "firebase/firestore";
import { usePathname } from "next/navigation"; 
import { FaPaperPlane } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns"; 
import Link from "next/link";
import { FiChevronLeft, FiMoreHorizontal } from "react-icons/fi";

interface Message {
  text: string;
  createdAt: Timestamp;
  username: string;
}

interface Vote {
  id: string;
  question: string;
  options: string[];
  createdAt: Timestamp;
  votes: number[];
}

export default function RoomPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [username, setUsername] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const pathname = usePathname();
  const roomId = pathname.split("/").pop();
  const [roomName, setRoomName] = useState("");
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [voteQuestion, setVoteQuestion] = useState("");
  const [voteOptions, setVoteOptions] = useState<string[]>(["", ""]);
  const [votes, setVotes] = useState<Vote[]>([]);

  useEffect(() => {
    if (!roomId) return;
    const votesQuery = query(
      collection(db, "rooms", roomId, "votes"),
      orderBy("createdAt")
    );
  
    onSnapshot(votesQuery, (querySnapshot) => {
      const voteList: Vote[] = querySnapshot.docs.map((doc) => {
        return { id: doc.id, ...doc.data() } as Vote;
      });      
      setVotes(voteList);
    });
  }, [roomId]);
  
  // 投票の選択肢を選ぶ処理
  const handleVote = async (voteId: string, optionIndex: number) => {
    // roomIdがundefinedでないことをチェック
    if (!roomId) {
      console.error("roomId is undefined");
      return;
    }
  
    const voteRef = doc(db, "rooms", roomId, "votes", voteId);
    const voteSnapshot = await getDoc(voteRef);
  
    if (voteSnapshot.exists()) {
      const updatedVotes = voteSnapshot.data().votes;
      updatedVotes[optionIndex] += 1;  // 選択肢の投票数を1増やす
  
      await updateDoc(voteRef, { votes: updatedVotes });
    }
  };  
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

  useEffect(() => {
    const fetchRoomName = async () => {
      if (!roomId) return;
      try {
        const roomRef = doc(db, "rooms", roomId);
        const roomSnapshot = await getDoc(roomRef);
        if (roomSnapshot.exists()) {
          // Set the room name to the state
          setRoomName(roomSnapshot.data().name);
        }
      } catch (error) {
        console.error("Error fetching room name: ", error);
      }
    };
  
    if (roomId) {
      fetchRoomName();
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

  // モーダルを表示する関数
  const openVoteModal = () => setIsVoteModalOpen(true);

  // モーダルを閉じる関数
  const closeVoteModal = () => setIsVoteModalOpen(false);

  // 投票の質問を更新
  const handleVoteQuestionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVoteQuestion(e.target.value);
  };

  const handleVoteOptionChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newOptions = [...voteOptions];
    newOptions[index] = e.target.value;
    setVoteOptions(newOptions);
  };

  const createVote = async () => {
    if (!voteQuestion || voteOptions.some((opt) => opt === "") || !roomId) return;  // Check if roomId is defined
  
    try {
      // Ensure roomId is a valid string and prevent undefined
      await addDoc(collection(db, "rooms", roomId, "votes"), {
        question: voteQuestion,
        options: voteOptions,
        createdAt: new Date(),
        votes: new Array(voteOptions.length).fill(0),  // Initial vote count for each option is 0
      });
  
      setVoteQuestion("");
      setVoteOptions(["", ""]);
      closeVoteModal();
    } catch (error) {
      console.error("Error creating vote: ", error);
    }
  };  

  const deleteVote = async (voteId: string) => {
    if (!roomId) return;
    try {
      const voteRef = doc(db, "rooms", roomId, "votes", voteId);
      await deleteDoc(voteRef);
      console.log("Vote deleted successfully");
    } catch (error) {
      console.error("Error deleting vote: ", error);
    }
  };  

  return (
    <div className="md:max-w-md w-full md:mx-auto p-4 md:py-8">
      <div className="p-4 rounded-lg border border-zinc-200 shadow-sm">
        <div className="flex items-center mb-4">
          <Link href="/" className="w-8 h-8 rounded-full duration-200 hover:bg-zinc-200 flex items-center justify-center bg-zinc-50 aspect-square outline-none duration-200 focus-visible:ring-2 ring-offset-2">
            <FiChevronLeft className="text-xl" />
          </Link>
          <h1 className="text-xl font-bold mx-2 line-clamp-1">{roomName || "Loading..."}</h1>
          <div className="relative ml-auto">
            <button
              className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center duration-200 bg-white outline-none focus-visible:ring-2 ring-offset-2"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)} // ドロップダウンの開閉
            >
              <FiMoreHorizontal />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 p-2 bg-white border border-zinc-200 rounded-lg shadow-lg">
                <button onClick={openVoteModal} className="w-full px-4 py-2 text-left hover:bg-zinc-50 duration-200 rounded-lg">
                Create a new vote
                </button>
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
          placeholder="Your Name"
        />
      </div>

      <div className="my-8 flex md:hidden items-center border border-zinc-200 rounded-lg p-2 shadow-sm sticky top-4 bg-white">
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

      <div className="space-y-4 mt-8 flex flex-col border border-zinc-200 rounded-lg p-4 shadow-sm h-[640px] overflow-y-auto">
        <h2 className="text-xl font-bold">Chat</h2>
        {messages.map((msg, index) => (
          <div key={index} className="p-4 bg-zinc-50 rounded-lg">
            <div className="flex items-center mb-2">
              <img
                src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${msg.username}&backgroundColor=f472b6,facc15,60a5fa,4ade80,c084fc&eyesColor=ffffff&mouthColor=ffffff&shapeColor[]`}
                alt="Avatar"
                className="bg-white w-8 h-8 rounded-full aspetc-square mr-2"
              />
              <p className="text-sm font-bold mr-2 line-clamp-1">{msg.username}</p>
              <p className="text-sm text-zinc-400 whitespace-nowrap">{formatRelativeTime(msg.createdAt)}</p>
            </div>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 border border-zinc-200 rounded-lg p-4 shadow-sm bg-white">
        <h2 className="text-xl font-bold mb-4">Votes</h2>
        <div className="space-y-4">
          {votes.map((vote) => (
            <div key={vote.id} className="p-4 bg-zinc-50 shadow-sm rounded-lg">
              <div className="flex items-center mb-4">
                <h3 className="font-bold">{vote.question}</h3>
                <button
                  onClick={() => deleteVote(vote.id)}
                  className="ml-auto text-red-600 px-2 py-0.5 text-sm bg-red-50 rounded-lg"
                >
                  Delete
                </button>
              </div>
              <div className="space-y-2">
                {vote.options.map((option: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => handleVote(vote.id, index)}
                    className="w-full py-2 px-4 hover:bg-zinc-200 bg-white rounded-lg duration-200 text-left"
                  >
                    {option}
                      <span className="ml-2 text-sm text-zinc-400">
                        ({vote.votes[index]})
                      </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 hidden md:flex items-center border border-zinc-200 rounded-lg p-2 shadow-sm sticky bottom-8 bg-white">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="px-4 py-2 bg-zinc-50 rounded-lg w-full placeholder:text-zinc-400 outline-none duration-200 focus-visible:ring-2 ring-offset-2"
          placeholder="Enter a message..."
        />
        <button
          onClick={sendMessage}
          className="bg-zinc-800 text-white w-10 h-10 text-xl aspect-square rounded-lg font-bold whitespace-nowrap flex items-center justify-center ml-2 outline-none duration-200 focus-visible:ring-2 ring-offset-2"
        >
          <FaPaperPlane />
        </button>
      </div>
      {isVoteModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-zinc-400 bg-opacity-50 backdrop-blur">
          <div className="bg-white p-6 rounded-lg w-3/4 md:w-1/4">
            <h2 className="text-lg font-bold mb-4">Create a New Vote</h2>
            <input
              type="text"
              value={voteQuestion}
              onChange={handleVoteQuestionChange}
              placeholder="Enter your question"
              className="mb-4 w-full px-4 py-2 border border-zinc-200 rounded-lg"
            />
            {voteOptions.map((option, index) => (
              <input
                key={index}
                type="text"
                value={option}
                onChange={(e) => handleVoteOptionChange(e, index)}
                placeholder={`Option ${index + 1}`}
                className="mb-2 w-full px-4 py-2 border border-zinc-200 rounded-lg"
              />
            ))}
            <button
              onClick={() => setVoteOptions([...voteOptions, ""])}
              className="text-zinc-600 mb-4 text-sm p-0"
            >
              Add another option
            </button>
            <div className="flex justify-end">
              <button
                onClick={closeVoteModal}
                className="text-zinc-600 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={createVote}
                className="bg-zinc-800 text-white px-4 py-2 rounded-lg"
              >
                Create Vote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}