"use client"
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, doc, deleteDoc, getDocs, getDoc, updateDoc } from "firebase/firestore";
import { usePathname } from "next/navigation"; 
import { formatDistanceToNow } from "date-fns"; 
import Link from "next/link";
import { FiMoreHorizontal, FiPlus, FiSmile, FiTrash } from "react-icons/fi";
import Avatar from "@/components/Avatar";
import { marked } from "marked";
import VoteModal from "@/components/VoteModal";
import PoopModal from "@/components/PoopModal";
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

const stamps = ["1", "2", "3"];

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
  const [isSmileDropdownOpen, setIsSmileDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const smileDropdownRef = useRef<HTMLDivElement>(null); 

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        isDropdownOpen
      ) {
        setIsDropdownOpen(false);
      }
  
      if (
        smileDropdownRef.current &&
        !smileDropdownRef.current.contains(event.target as Node) &&
        isSmileDropdownOpen
      ) {
        setIsSmileDropdownOpen(false);
      }
    };
  
    document.addEventListener("mousedown", handleClickOutside);
  
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen, isSmileDropdownOpen]);

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
  
  
  const handleVote = async (voteId: string, optionIndex: number) => {
    if (!roomId) {
      console.error("roomId is undefined");
      return;
    }
  
    const voteRef = doc(db, "rooms", roomId, "votes", voteId);
    const voteSnapshot = await getDoc(voteRef);
  
    if (voteSnapshot.exists()) {
      const updatedVotes = voteSnapshot.data().votes;
      updatedVotes[optionIndex] += 1;
  
      await updateDoc(voteRef, { votes: updatedVotes });
    }
  };  

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

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

  const deleteRoom = async () => {
    if (!roomId) return;
    try {
      const messagesRef = collection(db, "rooms", roomId, "messages");
      const messageSnapshot = await getDocs(messagesRef);
      messageSnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      await deleteDoc(doc(db, "rooms", roomId));
      console.log("Room deleted successfully");
      window.location.href = "/";
    } catch (error) {
      console.error("Error deleting room: ", error);
    }
  };

  const createVote = async () => {
    if (!voteQuestion || voteOptions.some((opt) => opt === "") || !roomId) return;  // Check if roomId is defined
  
    try {
      await addDoc(collection(db, "rooms", roomId, "votes"), {
        question: voteQuestion,
        options: voteOptions,
        createdAt: new Date(),
        votes: new Array(voteOptions.length).fill(0),  // Initial vote count for each option is 0
      });
  
      setVoteQuestion("");
      setVoteOptions(["", ""]);
      setIsVoteModalOpen(false);
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

  const handleStampClick = (stamp: string) => {
    setMessage(`:stamp_${stamp}`);
  };

  return (
    <div>
      {/* header */}
      <div className="px-8 py-4 flex items-center justify-center select-none h-16 bg-white sticky top-0 z-50">
        <Link href="/" className="flex items-center"><Image src="/logo.svg" alt="Logo" width={100} height={100} className="h-8 w-fit mr-2" /><p className="text-xl">{roomName || "Loading..."}</p></Link>
        <div className="relative z-10 ml-2">
          <button className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center duration-200 bg-white outline-none focus-visible:ring-2 ring-offset-2" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            <FiMoreHorizontal />
          </button>
              <div ref={dropdownRef} className={`absolute border border-zinc-200 right-0 mt-2 w-64 p-2 bg-white roboto rounded-lg shadow-lg overflow-hidden transition-all duration-200 ease-in-out ${ isDropdownOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"}`}>
                <button onClick={() => setIsVoteModalOpen(true)} className="w-full px-4 py-2 text-left hover:bg-zinc-50 duration-200 rounded-lg flex items-center">
                <FiPlus className="mr-2 text-zinc-400" />投票を作成する
                </button>
                <div className="my-2 border-t border-zinc-200" />
                <button onClick={deleteRoom} className="w-full text-red-600 px-4 py-2 text-left hover:bg-red-50 duration-200 rounded-lg flex items-center">
                  <FiTrash className="mr-2 text-red-400" />コミュニティを削除
                </button>
              </div>
          </div>
      </div>
      
    <div className="md:max-w-md w-full mx-auto py-8">
      {votes.length > 0 && (
        <div className="mt-8">
          <div className="space-y-4">
            {votes.map((vote) => (
              <div key={vote.id} className="p-4 rounded-lg border border-zinc-200 bg-white">
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
                  <div key={index} className="space-y-2">
                    <div className="flex items-center">
                      <p>{option}</p>
                      <span className="ml-2 text-sm relative text-zinc-400 roboto">{`(${vote.votes[index]})`}</span>
                    </div>
                    <button
                      onClick={() => handleVote(vote.id, index)}
                      className="w-full h-8 rounded-lg relative overflow-hidden bg-zinc-50"
                    >
                      <div
                        className={`absolute inset-0 ${hasVotes ? 'bg-green-400' : 'bg-zinc-50'}`}
                        style={{
                          width: hasVotes
                            ? `${Math.round((vote.votes[index] / totalVotes) * 100)}%`
                            : '0%'
                        }}
                      />
                    </button>
                  </div>
                );
              })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className=" space-y-4 flex flex-col max-h-[512px] overflow-y-auto">
        {messages.length > 0 ? (
          messages.map((msg, index) => {
            const formattedText = msg.text.replace(/:stamp_([a-zA-Z0-9_]+)/g, (match, stamp) => {
              return `<div class="max-h-16"><img src="/stamps/${stamp}.png" alt="stamp" class="h-16" /></div>`;
            });

            return (
              <div key={index} className="p-4 bg-white rounded-lg flex flex-col">
                <div className="flex items-center mb-2">
                  <Avatar name={msg.username} />
                  <p className="text-sm font-bold mx-2 line-clamp-1">{msg.username}</p>
                  <p className="text-sm text-zinc-400 whitespace-nowrap">{formatRelativeTime(msg.createdAt)}</p>
                </div>
                <div
                  className="md flex flex-col whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: marked(formattedText) }}
                />
              </div>
            );
          })
        ) : (
          <div className="text-center text-zinc-400">
            <p>No messages available.</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col border border-zinc-200 rounded-lg p-2 shadow-sm sticky bottom-8 bg-white">
        <input type="text" value={username} onChange={handleUsernameChange} className="px-4 py-2 bg-zinc-50 rounded-lg w-full placeholder:text-zinc-400" placeholder="表示名" />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="mt-2 px-4 py-2 bg-zinc-50 rounded-lg w-full placeholder:text-zinc-400" placeholder="メッセージを入力してください" rows={2}/>
        <div className="flex mt-2">
          <div className="relative">
            <button className="bg-blue-50 text-blue-400 w-8 h-8 aspect-square rounded-lg flex items-center justify-center" onClick={() => setIsSmileDropdownOpen(!isSmileDropdownOpen)}>
              <FiSmile />
            </button>
            <div ref={smileDropdownRef} className={`absolute z-10 bottom-10 left-0 w-64 bg-white border border-zinc-200 rounded-lg shadow-lg p-4 transition-all duration-200 ease-in-out ${ isSmileDropdownOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"}`}>
              <p className="mb-4">Stamps</p>
                <div className="flex flex-wrap gap-2">
                    {stamps.map((stamp) => (
                      <button
                        key={stamp}
                        onClick={() => handleStampClick(stamp)}
                        className="w-10 h-10 aspect-square outline-none focus-visible:ring-2 ring-offset-2 hover:bg-zinc-200 duration-200 rounded-lg flex items-center justify-center"
                      >
                        <img src={`/stamps/${stamp}.png`}
                          alt={stamp}
                          className="h-8"
                        />
                      </button>
                    ))}
                  </div>
                </div>
          </div>
          <button onClick={sendMessage} className="ml-auto bg-blue-600 text-white rounded-lg whitespace-nowrap px-3 py-1">
            送信
          </button>
        </div>
      </div>
      
      <VoteModal  isOpen={isVoteModalOpen}  closeModal={() => setIsVoteModalOpen(false)}  voteQuestion={voteQuestion}  setVoteQuestion={setVoteQuestion}  voteOptions={voteOptions}  setVoteOptions={setVoteOptions}  createVote={createVote} />
      <PoopModal isOpen={poopModalOpen} close={() => setPoopModalOpen(false)} />
    </div>
    </div>
  );
}