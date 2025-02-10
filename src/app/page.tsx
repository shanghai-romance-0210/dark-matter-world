"use client"

import { useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, query, getDocs, doc, setDoc } from "firebase/firestore";
import { useEffect } from "react";
import Link from "next/link";

interface Room {
  id: string;
  name: string;
}

export default function Home() {
  const [roomName, setRoomName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    const fetchRooms = async () => {
      const roomsQuery = query(collection(db, "rooms"));
      const querySnapshot = await getDocs(roomsQuery);
      const roomList: Room[] = querySnapshot.docs.map((doc) => {
        return {
          id: doc.id,
          name: doc.data().name,
        };
      });
      setRooms(roomList);
    };
    fetchRooms();
  }, []);

  const createRoom = async () => {
    if (!roomName || !roomId) return;
    try {
      const roomRef = doc(db, "rooms", roomId);
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
        <input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} className="px-4 py-2 border border-zinc-200 rounded-lg mb-4 w-full placeholder:text-zinc-400 outline-none duration-200 focus-visible:ring-2 ring-offset-2" placeholder="Room Name" />
        <input type="text" value={roomId} onChange={(e) => setRoomId(e.target.value)} className="px-4 py-2 border border-zinc-200 rounded-lg mb-4 w-full placeholder:text-zinc-400 outline-none duration-200 focus-visible:ring-2 ring-offset-2" placeholder="Room ID" />

        <button onClick={createRoom} className="bg-zinc-800 text-white py-2 px-4 rounded-full w-full font-bold outline-none duration-200 focus-visible:ring-2 ring-offset-2">
          Create
        </button>
      </div>
      <div className="mt-8 p-4 rounded-lg border border-zinc-200 shadow-sm">
        <h2 className="text-xl font-bold">Room List</h2>
        <div className="mt-4 space-y-2">
          {rooms.map((room, index) => (
              <div key={index} className="p-4 rounded-lg bg-zinc-50 shadow-sm flex items-center">
                <div>
                  <p className="font-bold">{room.name}</p>
                  <p className="text-sm text-zinc-400 mt-0.5">{room.id}</p>
                </div>
                <div className="ml-auto flex">
                 <Link href={`/rooms/${room.id}`}><div className="px-4 py-2 rounded-full bg-zinc-800 text-white font-bold">Join</div></Link>
                </div>
              </div>
          ))}
        </div>
      </div>
    </div>
  );
}