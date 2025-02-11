"use client"
import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, doc, deleteDoc, getDocs, getDoc, updateDoc } from "firebase/firestore";
import { usePathname } from "next/navigation"; 
import { FaPaperPlane } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns"; 
import Link from "next/link";
import { FiChevronLeft, FiMoreHorizontal } from "react-icons/fi";
import Avatar from "@/app/components/Avatar";
import Image from "next/image";

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
  const [poopModalOpen, setPoopModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

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

  const sendMessage = async () => {
    if (!message || !roomId || !username) return;

    if (message.toLowerCase() === "poop") {
      setPoopModalOpen(true);
    }
  
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

      await deleteDoc(doc(db, "rooms", roomId));
      console.log("Room deleted successfully");
      // ルーム削除後、ページ遷移
      window.location.href = "/";
    } catch (error) {
      console.error("Error deleting room: ", error);
    }
  };

  const openVoteModal = () => setIsVoteModalOpen(true);
  const closeVoteModal = () => setIsVoteModalOpen(false);
  const openEventModal = () => setIsEventModalOpen(true);
  const closeEventModal = () => setIsEventModalOpen(false);

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
                <button onClick={openEventModal} className="w-full px-4 py-2 text-left hover:bg-zinc-50 duration-200 rounded-lg">
                Text Event List
                </button>
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
        <div className="mt-4 flex md:hidden items-center">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="px-4 py-2 border border-zinc-200 rounded-lg w-full placeholder:text-zinc-400 outline-none duration-200 focus-visible:ring-2 ring-offset-2"
          placeholder="Enter a message..."
        />
        <button
          onClick={sendMessage}
          className="bg-zinc-800 text-white w-10 h-10 text-xl aspect-square rounded-lg font-bold whitespace-nowrap flex items-center justify-center ml-4 placeholder:text-zinc-400"
        >
          <FaPaperPlane />
        </button>
      </div>
      </div>

      {votes.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Votes</h2>
          <div className="space-y-4">
            {votes.map((vote) => (
              <div key={vote.id} className="p-4 shadow-sm rounded-lg border border-zinc-200 rounded-lg p-4 shadow-sm bg-white">
                <div className="flex items-center mb-4">
                  <h3 className="font-bold mr-2">{vote.question}</h3>
                  <button
                    onClick={() => deleteVote(vote.id)}
                    className="ml-auto text-red-600 px-2 py-0.5 text-sm bg-red-50 rounded-lg"
                  >
                    Delete
                  </button>
                </div>
                <div className="space-y-4">
                {vote.options.map((option: string, index: number) => {
                const totalVotes = vote.votes.reduce((a, b) => a + b, 0);
                const hasVotes = totalVotes > 0;
                return (
                  <button
                    key={index}
                    onClick={() => handleVote(vote.id, index)}
                    className="w-full py-2 px-4 rounded-lg relative overflow-hidden bg-zinc-50"
                  >
                    <div
                      className={`absolute inset-0 ${hasVotes ? 'bg-zinc-200' : 'bg-zinc-50'}`}
                      style={{
                        width: hasVotes
                          ? `${Math.round((vote.votes[index] / totalVotes) * 100)}%`
                          : '0%'
                      }}
                    />
                    <span className="relative">{option}</span>
                    <span className="ml-2 text-sm relative text-zinc-400">
                      {`(${vote.votes[index]})`}
                    </span>
                  </button>
                );
              })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4 mt-8 flex flex-col border border-zinc-200 rounded-lg p-4 shadow-sm max-h-[640px] overflow-y-auto">
        <h2 className="text-xl font-bold">Chat</h2>
        {messages.length > 0 ? (
          messages.map((msg, index) => {
            const isStamp = msg.text.trim().startsWith("stamp") && !msg.text.trim().includes(" ");

            return (
              <div key={index} className="p-4 bg-zinc-50 rounded-lg flex flex-col">
                <div className="flex items-center mb-2">
                  <Avatar name={msg.username} />
                  <p className="text-sm font-bold mx-2 line-clamp-1">{msg.username}</p>
                  <p className="text-sm text-zinc-400 whitespace-nowrap">{formatRelativeTime(msg.createdAt)}</p>
                </div>
                {isStamp ? (
                  <div className="w-full flex items-center justify-center">
                    <Image
                      src={`/stamps/${msg.text}.png`}
                      alt={msg.text}
                      width={100}
                      className="w-32"
                      height={100}
                    />
                  </div>
                ) : (
                  <p>{msg.text}</p>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center text-zinc-400">
            <p>No messages available.</p>
          </div>
        )}
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
              className="placeholder:text-zinc-400 mb-4 w-full px-4 py-2 border border-zinc-200 rounded-lg outline-none duration-200 focus-visible:ring-2 ring-offset-2"
            />
            {voteOptions.map((option, index) => (
              <input
                key={index}
                type="text"
                value={option}
                onChange={(e) => handleVoteOptionChange(e, index)}
                placeholder={`Option ${index + 1}`}
                className="placeholder:text-zinc-400 mb-2 w-full px-4 py-2 border border-zinc-200 rounded-lg outline-none duration-200 focus-visible:ring-2 ring-offset-2"
              />
            ))}
            <button
              onClick={() => setVoteOptions([...voteOptions, ""])}
              className="text-zinc-600 mb-4 text-sm p-0 outline-none"
            >
              Add another option
            </button>
            <div className="flex justify-end">
              <button
                onClick={closeVoteModal}
                className="text-zinc-600 px-4 py-2 rounded-lg outline-none duration-200 focus-visible:ring-2 ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={createVote}
                className="bg-zinc-800 text-white px-4 py-2 rounded-lg outline-none duration-200 focus-visible:ring-2 ring-offset-2"
              >
                Create Vote
              </button>
            </div>
          </div>
        </div>
      )}
        {isEventModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-zinc-400 bg-opacity-50 backdrop-blur">
          <div className="bg-white p-6 rounded-lg w-3/4 md:w-1/4">
            <h2 className="text-lg font-bold mb-4">Text Event List</h2>
            <div className="flex flex-col space-y-4 mb-4 max-h-32 overflow-y-auto">
              <div className="flex items-center border p-2 border-zinc-200 rounded-lg">
                <Image src="/poop.png" alt="Stamp" width={100} height={100} className="w-8" />
                <p className="ml-2">poop</p>
              </div>
              <div className="flex items-center border p-2 border-zinc-200 rounded-lg">
                <Image src="/stamps/stamp1.png" alt="Stamp" width={100} height={100} className="w-8" />
                <p className="ml-2">stamp1</p>
              </div>
              <div className="flex items-center border p-2 border-zinc-200 rounded-lg">
                <Image src="/stamps/stamp2.png" alt="Stamp" width={100} height={100} className="w-8" />
                <p className="ml-2">stamp2</p>
              </div>
              <div className="flex items-center border p-2 border-zinc-200 rounded-lg">
                <Image src="/stamps/stamp3.png" alt="Stamp" width={100} height={100} className="w-8" />
                <p className="ml-2">stamp3</p>
              </div>
            </div>  
            <div className="flex justify-end">
              <button
                onClick={closeEventModal}
                className="bg-zinc-800 text-white px-4 py-2 rounded-lg outline-none duration-200 focus-visible:ring-2 ring-offset-2"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {poopModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-zinc-400 bg-opacity-50 backdrop-blur">
          <button onClick={() => setPoopModalOpen(false)} className="w-3/4 md:w-1/4 p-0">
             <Image src="/poop.png" alt="Image" width={100} height={100} className="w-full" />
          </button>
        </div>
      )}
    </div>
  );
}