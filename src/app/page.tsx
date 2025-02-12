"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import Link from "next/link";

interface Room {
  id: string;
  name: string;
}

export default function Home() {
  const [roomName, setRoomName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // onSnapshot を利用してリアルタイムでデータを取得
    const unsubscribe = onSnapshot(collection(db, "rooms"), (querySnapshot) => {
      const roomList: Room[] = querySnapshot.docs.map((doc) => {
        return {
          id: doc.id,
          name: doc.data().name,
        };
      });
      setRooms(roomList);
    });

    // コンポーネントがアンマウントされる際にリスナーを解除
    return () => unsubscribe();
  }, []);

  const createRoom = async () => {
    if (!roomName || !roomId) return;

    // roomId が許可された文字だけで構成されているかを確認
    const validRoomId = /^[a-zA-Z0-9_.-]+$/.test(roomId);
    if (!validRoomId) {
      setErrorMessage("Invalid room ID. Only letters, numbers, '-', '_', and '.' are allowed."); // エラーメッセージをセット
      return;
    }

    if (roomId.length > 10) {
      setErrorMessage("Room ID must not exceed 10 characters.");
      return;
    }

    setErrorMessage(""); // 入力が有効であればエラーメッセージをクリア

    try {
      const roomRef = doc(db, "rooms", roomId.toLowerCase()); // roomId を小文字に変換
      await setDoc(roomRef, { name: roomName });
      setRoomName("");
      setRoomId("");
    } catch (error) {
      console.error("Error creating room: ", error);
    }
  };

  return (
    <div className="md:max-w-md w-full md:mx-auto p-4 md:py-8"> 
      <div className="p-4 rounded-lg border border-zinc-200 shadow-sm">
        <h1 className="text-xl font-bold mb-4">Create a New Room</h1>
        <input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          className="px-4 py-2 border border-zinc-200 rounded-lg mb-4 w-full placeholder:text-zinc-400 outline-none duration-200 focus-visible:ring-2 ring-offset-2"
          placeholder="Room Name"
        />
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value.toLowerCase())} // 入力を小文字に変換
          className="px-4 py-2 border border-zinc-200 rounded-lg mb-4 w-full placeholder:text-zinc-400 outline-none duration-200 focus-visible:ring-2 ring-offset-2"
          placeholder="Room ID"
        />

        {errorMessage && <p className="text-red-400 text-sm mb-4">{errorMessage}</p>}

        <button
          onClick={createRoom}
          className="bg-zinc-800 text-white py-2 px-4 rounded-full w-full font-bold outline-none duration-200 focus-visible:ring-2 ring-offset-2"
        >
          Create
        </button>
      </div>
      <div className="mt-8 p-4 rounded-lg border border-zinc-200 shadow-sm">
        <h2 className="text-xl font-bold">Room List</h2>
        <div className="mt-4 space-y-2">
          {rooms.length === 0 ? (
            <div className="flex items-center justify-center">
              <p className="text-zinc-400">No rooms available.</p>
            </div>
          ) : (
            rooms.map((room, index) => (
              <div key={index} className="p-4 rounded-lg bg-zinc-50 shadow-sm flex items-center">
                <div className="mr-4">
                  <p className="font-bold line-clamp-2">{room.name}</p>
                  <p className="text-sm text-zinc-400 mt-0.5 roboto">{room.id}</p>
                </div>
                <div className="ml-auto flex">
                  <Link href={`/rooms/${room.id}`} className="rounded-full outline-none duration-200 focus-visible:ring-2 ring-offset-2">
                    <div className="px-4 py-2 rounded-full bg-zinc-800 text-white font-bold">Join</div>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}