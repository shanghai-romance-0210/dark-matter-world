"use client"
import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { FiInfo, FiSearch } from "react-icons/fi";
import Image from "next/image";

interface Room {
  id: string;
  name: string;
}

export default function Home() {
  const [roomName, setRoomName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [showModal, setShowModal] = useState(false); // State for showing the modal

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "rooms"), (querySnapshot) => {
      const roomList: Room[] = querySnapshot.docs.map((doc) => {
        return {
          id: doc.id,
          name: doc.data().name,
        };
      });
      setRooms(roomList);
    });

    return () => unsubscribe();
  }, []);

  const createRoom = async () => {
    if (!roomName || !roomId) return;

    const validRoomId = /^[a-zA-Z0-9_.-]+$/.test(roomId);
    if (!validRoomId) {
      setErrorMessage("Invalid room ID. Only letters, numbers, '-', '_', and '.' are allowed.");
      return;
    }

    if (roomId.length > 10) {
      setErrorMessage("Room ID must not exceed 10 characters.");
      return;
    }

    setErrorMessage("");

    try {
      const roomRef = doc(db, "rooms", roomId.toLowerCase());
      await setDoc(roomRef, { name: roomName });
      setRoomName("");
      setRoomId("");
      setShowModal(false); // Close the modal after creating the room
    } catch (error) {
      console.error("Error creating room: ", error);
    }
  };

  return (
    <div>
      <div className="px-8 py-4 flex items-center h-16 bg-white sticky top-0 z-50">
        <Link href="/" className="flex items-center"><Image src="/logo.svg" alt="Logo" width={100} height={100} className="h-8 w-fit mr-2" /><p className="text-xl">野獣ドットコム</p></Link>
        <div className="ml-auto flex items-center">
          <button className="px-4 py-2 rounded-full bg-blue-600 text-white">ログイン</button>
        </div>
      </div>

      <div className="md:container mx-auto p-8">
        <div className="flex items-center px-4 py-2 rounded-lg bg-blue-200 text-blue-600 shadow">
          <FiInfo className="mr-2 hidden md:flex" /><p>アップデートしたので今日からこのサイトは野獣ドットコムという名前になります</p>
        </div>

        <div className="mt-8 p-8 bg-white rounded-lg">
          <div className="flex items-center">
            <p className="text-xl">タイムライン</p>
            <div className="flex items-center ml-auto">
              <button className="px-4 py-2 rounded-full bg-blue-200 text-blue-600">もっと見る</button>
            </div>
          </div>
          <div className="h-32 rounded-lg bg-blue-50 text-blue-400 flex items-center justify-center mt-4 p-4">
            <p>話題のポストは...まだありません...</p>
          </div>
        </div>

        <div className="mt-8 p-8 bg-white rounded-lg">
          <div className="flex items-center">
            <p className="text-xl">コミュニティ</p>
            <div className="flex items-center ml-auto">
              <button
                className="px-4 py-2 rounded-full bg-blue-200 text-blue-600"
                onClick={() => setShowModal(true)} // Show modal when clicked
              >
                新規作成
              </button>
            </div>
          </div>
          <div className="my-4">
            <div className="flex items-center px-4 h-10 overflow-hidden rounded-lg border border-zinc-200 shadow-sm">
              <FiSearch className="mr-4 text-zinc-400" /><input placeholder="コミュニティを検索する(まだできない)" className="bg-transparent outline-none h-10 w-full placeholder:text-zinc-400" />
            </div>
          </div>
          <div className="space-y-4 h-32 overflow-y-auto">
            {rooms.length === 0 ? (
              <div className="flex items-center justify-center">
                <p className="text-zinc-400">No rooms available.</p>
              </div>
            ) : (
              rooms.map((room, index) => (
                <div key={index} className="p-4 rounded-lg bg-zinc-50 flex items-center">
                  <p className="text-lg line-clamp-2 mr-4">{room.name}</p>
                  <div className="ml-auto flex">
                    <Link href={`/rooms/${room.id}`}><p className="px-4 py-2 rounded-full bg-blue-600 text-white">参加</p></Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 backdrop-blur">
          <div className="bg-white p-6 rounded-lg w-3/4 md:w-1/4">
            <h1 className="text-xl mb-4">ルームを新規作成</h1>
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
                className="bg-blue-200 text-blue-600 py-2 px-4 rounded-full"
              >
                Close
              </button>
              <button
                onClick={createRoom}
                className="bg-blue-600 text-white py-2 px-4 rounded-full ml-2"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}