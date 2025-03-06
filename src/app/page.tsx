"use client"
import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { FiPlus, FiSearch } from "react-icons/fi";
import Image from "next/image";

interface Room {
  id: string;
  name: string;
}

export default function Home() {
  const [roomName, setRoomName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "rooms"), (querySnapshot) => {
      const roomList: Room[] = querySnapshot.docs.map((doc) => {
        return {
          id: doc.id,
          name: doc.data().name,
        };
      });
      setRooms(roomList);
      setFilteredRooms(roomList); // Initially set filteredRooms to all rooms
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredRooms(rooms); // If search query is empty, show all rooms
    } else {
      const filtered = rooms.filter(room =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) || room.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRooms(filtered);
    }
  }, [searchQuery, rooms]);

  const createRoom = async () => {
    if (!roomName || !roomId) return;

    const validRoomId = /^[a-zA-Z0-9_.-]+$/.test(roomId);
    if (!validRoomId) {
      setErrorMessage("無効なルームIDです。使用できるのは、文字、数字、'-'、'_'、および '.' のみです。");
      return;
    }

    if (roomId.length > 10) {
      setErrorMessage("ルームIDは10文字を超えてはいけません。");
      return;
    }

    setErrorMessage("");

    try {
      const roomRef = doc(db, "rooms", roomId.toLowerCase());
      await setDoc(roomRef, { name: roomName });
      setRoomName("");
      setRoomId("");
      setShowModal(false);
    } catch (error) {
      console.error("Error creating room: ", error);
    }
  };

  return (
    <div>
      <div className="px-8 py-4 flex items-center justify-center select-none h-16 bg-white sticky top-0 z-50">
        <Link href="/" className="flex items-center"><Image src="/logo.svg" alt="Logo" width={100} height={100} className="h-8 w-fit mr-2" /><p className="text-xl">野獣ドットコム</p></Link>
      </div>

      <div className="md:container mx-auto p-4 md:p-8">
        <div className="flex items-center px-4 h-10 overflow-hidden rounded-lg border border-zinc-200 shadow-sm bg-white">
          <FiSearch className="mr-4 text-zinc-400" />
          <input
            placeholder="コミュニティを検索する"
            className="bg-transparent outline-none h-10 w-full placeholder:text-zinc-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} // Update search query on input change
          />
        </div>

        {/* Message when no communities found */}
        {filteredRooms.length === 0 && (
          <div className="mt-8 flex items-center justify-center">
            <p className="text-zinc-400">コミュニティが見つかりませんでした。</p>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          {filteredRooms.length > 0 && filteredRooms.map((room, index) => (
            <div key={index} className="rounded-lg bg-white overflow-hidden">
              <img src={`https://api.dicebear.com/9.x/identicon/svg?seed=${room.id}&rowColor=60a5fa&backgroundColor=bfdbfe`} alt="avatar" className="h-32 w-full object-cover" />
              <div className="flex p-4">
                <p className="text-lg line-clamp-2 mr-4">{room.name}</p>
                <div className="ml-auto flex">
                  <Link href={`/rooms/${room.id}`}>
                    <p className="px-4 py-2 rounded-lg bg-blue-600 text-white whitespace-nowrap">参加</p>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed right-8 bottom-8">
        <button className="px-4 py-2 rounded-full bg-blue-50 text-blue-600 whitespace-nowrap shadow-lg flex items-center" onClick={() => setShowModal(true)}>
          <FiPlus className="mr-2" />コミュニティを新規作成
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 backdrop-blur">
          <div className="bg-white p-6 rounded-lg w-3/4 md:w-1/4">
            <h1 className="text-xl mb-4">コミュニティを新規作成</h1>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="px-4 py-2 border border-zinc-200 rounded-lg mb-2 w-full"
              placeholder="ルームの名前"
            />
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toLowerCase())}
              className="px-4 py-2 border border-zinc-200 rounded-lg mb-4 w-full"
              placeholder="ルームID"
            />

            {errorMessage && <p className="text-red-400 text-sm mb-4">{errorMessage}</p>}

            <div className="flex items-center justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="bg-blue-50 text-blue-600 py-2 px-4 rounded-full"
              >
                キャンセル
              </button>
              <button
                onClick={createRoom}
                className="bg-blue-600 text-white py-2 px-4 rounded-full ml-2"
              >
                作成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}