"use client"
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, doc, deleteDoc, getDocs, getDoc, updateDoc } from "firebase/firestore";
import { usePathname } from "next/navigation"; 
import { FaPaperPlane } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns"; 
import Link from "next/link";
import { FiChevronDown, FiChevronLeft, FiChevronUp, FiMoreHorizontal, FiPlus, FiSmile, FiTrash } from "react-icons/fi";
import Avatar from "@/components/Avatar";
import { marked } from "marked";
import VoteModal from "@/components/VoteModal";
import PoopModal from "@/components/PoopModal";

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
      // ルーム削除後、ページ遷移
      window.location.href = "/";
    } catch (error) {
      console.error("Error deleting room: ", error);
    }
  };

  const openVoteModal = () => setIsVoteModalOpen(true);
  const closeVoteModal = () => setIsVoteModalOpen(false);

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

    const renderMarkdown = (text: string) => {
      const stampRegex = /:stamp_([a-zA-Z0-9_]+)/g;
      const replacedText = text.replace(stampRegex, (match, stamp) => {
        return `<div class="max-h-16"><img src="/stamps/${stamp}.png" alt="stamp" class="h-16 " /></div>`;
      });
      return marked(replacedText);
    }; 

    const handleStampClick = (stamp: string) => {
      setMessage(`:stamp_${stamp}`);
    };    

  return (
    <div className="md:max-w-md w-full md:mx-auto p-4 md:py-8">
      <div className="p-4 rounded-lg border border-zinc-200">
        <div className="flex items-center">
          <Link href="/" className="duration-200 flex outline-none duration-200 focus-visible:ring-2 ring-offset-2">
            <FiChevronLeft />
          </Link>
          <h1 className="font-bold mx-2 line-clamp-1">{roomName || "Loading..."}</h1>
          <div className="relative ml-auto z-10">
            <button
              className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center duration-200 bg-white outline-none focus-visible:ring-2 ring-offset-2"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)} // ドロップダウンの開閉
            >
              <FiMoreHorizontal />
            </button>
              <div ref={dropdownRef} className={`absolute right-0 mt-2 w-64 p-2 bg-white border border-zinc-200 roboto rounded-lg shadow-lg overflow-hidden transition-all duration-200 ease-in-out ${ isDropdownOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"}`}>
                <button onClick={openVoteModal} className="w-full px-4 py-2 text-left hover:bg-zinc-50 duration-200 rounded-lg flex items-center">
                <FiPlus className="mr-2 text-zinc-400" />Create a new vote
                </button>
                <div className="my-2 border-t border-zinc-200" />
                <button onClick={deleteRoom} className="w-full text-red-600 px-4 py-2 text-left hover:bg-red-50 duration-200 rounded-lg flex items-center">
                  <FiTrash className="mr-2 text-red-400" />Delete Room
                </button>
              </div>
          </div>
        </div>
        {isMenuOpen && (
        <div className="flex flex-col mt-4">
          <input type="text" value={username} onChange={handleUsernameChange} className="px-4 py-2 bg-zinc-50 rounded-lg w-full placeholder:text-zinc-400 outline-none duration-200 focus-visible:ring-2 ring-offset-2" placeholder="Your Name" />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="md:hidden mt-2 px-4 py-2 bg-zinc-50 rounded-lg w-full placeholder:text-zinc-400 outline-none duration-200 focus-visible:ring-2 ring-offset-2" placeholder="Enter a message..." rows={2}/>
          <div className="mt-2 flex md:hidden">
          <div className="relative">
            <button
              className="bg-zinc-50 text-zinc-600 w-8 h-8 aspect-square rounded-lg flex items-center justify-center outline-none duration-200 focus-visible:ring-2 ring-offset-2"
              onClick={() => setIsSmileDropdownOpen(!isSmileDropdownOpen)}
            >
              <FiSmile />
            </button>
                <div ref={smileDropdownRef} className={`absolute z-10 top-10 left-0 w-64 bg-white border border-zinc-200 rounded-lg shadow-lg p-4 transition-all duration-200 ease-in-out ${ isSmileDropdownOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"}`}>
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
            <button onClick={sendMessage} className="bg-zinc-800 text-white w-8 h-8 aspect-square rounded-lg flex items-center justify-center ml-auto">
              <FaPaperPlane />
            </button>
          </div>
        </div>
        )}

        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="outline-none duration-200 focus-visible:ring-2 ring-offset-2 mt-2 mx-auto bg-white menu-button w-8 h-4 text-zinc-400 rounded-full border border-zinc-200 flex items-center justify-center shadow-sm">
          {isMenuOpen ? <FiChevronUp /> : <FiChevronDown />}
        </button>
      </div>

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

      <div className="space-y-4 mt-8 flex flex-col max-h-[640px] overflow-y-auto">
        <h2 className="text-xl font-bold">Chat</h2>
        {messages.length > 0 ? (
          messages.map((msg, index) => {
            return (
              <div key={index} className="p-4 bg-white rounded-lg flex flex-col bg-zinc-50">
                <div className="flex items-center mb-2">
                  <Avatar name={msg.username} />
                  <p className="text-sm font-bold mx-2 line-clamp-1">{msg.username}</p>
                  <p className="text-sm text-zinc-400 whitespace-nowrap">{formatRelativeTime(msg.createdAt)}</p>
                </div>
                <div
                  className="md flex flex-col"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
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

      <div className="mt-8 hidden md:flex flex-col border border-zinc-200 rounded-lg p-2 shadow-sm sticky bottom-8 bg-white">
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="px-4 py-2 bg-zinc-50 rounded-lg w-full placeholder:text-zinc-400 outline-none duration-200 focus-visible:ring-2 ring-offset-2" placeholder="Enter a message..." rows={2}/>
        <div className="flex mt-2">
          <div className="relative">
            <button className="bg-zinc-50 text-zinc-600 w-8 h-8 aspect-square rounded-lg flex items-center justify-center outline-none duration-200 focus-visible:ring-2 ring-offset-2" onClick={() => setIsSmileDropdownOpen(!isSmileDropdownOpen)}>
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
          <button onClick={sendMessage} className="ml-auto bg-zinc-800 text-white w-8 h-8 aspect-square rounded-lg font-bold whitespace-nowrap flex items-center justify-center outline-none duration-200 focus-visible:ring-2 ring-offset-2">
            <FaPaperPlane />
          </button>
        </div>
      </div>

      <VoteModal  isOpen={isVoteModalOpen}  closeModal={closeVoteModal}  voteQuestion={voteQuestion}  setVoteQuestion={setVoteQuestion}  voteOptions={voteOptions}  setVoteOptions={setVoteOptions}  createVote={createVote} />
      <PoopModal isOpen={poopModalOpen} close={() => setPoopModalOpen(false)} />
    </div>
  );
}