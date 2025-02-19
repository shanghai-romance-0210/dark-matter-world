"use client"
import { useState, useEffect } from "react";
import { FaPlus } from "react-icons/fa";
import { db } from "@/lib/firebaseConfig"; // Firestore設定がされているファイルをインポート
import { collection, addDoc, getDocs, doc, deleteDoc } from "firebase/firestore"; // Firestore関連の関数をインポート
import { FiTrash } from "react-icons/fi";

// 参加者の型を定義
interface Participant {
  name: string;
  role: string;
}

// ルームの型を定義
interface Room {
  id: string;
  roomName: string;
  participants: Participant[];
}

export default function Home() {
    const [participants, setParticipants] = useState<string[]>(["", "", "", ""]);
    const [roomName, setRoomName] = useState<string>("");
    const [rooms, setRooms] = useState<Room[]>([]); // ルーム情報の型を修正
    const [selectedParticipantRole, setSelectedParticipantRole] = useState<string>("");

    // 参加者の名前を更新するための関数
    const handleInputChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const newParticipants = [...participants];
        newParticipants[index] = event.target.value;
        setParticipants(newParticipants);
    };

    // ルーム名の入力を更新する関数
    const handleRoomNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRoomName(event.target.value);
    };

    // 役職をランダムに割り当てる関数
    const assignRoles = (numParticipants: number): string[] => {
        let roles: string[] = [];

        // 役職を人数ごとに設定
        switch (numParticipants) {
            case 4:
                roles = ["人狼", "ニート", "ニート", "GM"];
                break;
            case 5:
                roles = ["人狼", "ニート", "ニート", "騎士", "GM"];
                break;
            case 6:
                roles = ["人狼", "ニート", "騎士", "占い師", "GM", "ニート"];
                break;
            case 7:
                roles = ["人狼", "ニート", "騎士", "占い師", "GM", "狂人", "ニート"];
                break;
            case 8:
                roles = ["人狼", "ニート", "騎士", "占い師", "GM", "狂人", "ニート", "てるてる"];
                break;
            case 9:
                roles = ["人狼", "ニート", "騎士", "占い師", "GM", "狂人", "ニート", "てるてる", "妖狐"];
                break;
            case 10:
                roles = ["人狼", "ニート", "騎士", "占い師", "GM", "狂人", "ニート", "てるてる", "妖狐", "ニート"];
                break;
            default:
                roles = []; // 不正な人数の場合
                break;
        }

        // ランダムに役職をシャッフル
        roles = shuffleArray(roles);

        return roles;
    };

    // 配列をシャッフルする関数
    const shuffleArray = (array: string[]): string[] => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // 配列の要素を入れ替え
        }
        return array;
    };

    // 参加者にランダムに役職を割り当てる処理
    const assignRolesToParticipants = (participants: string[]): Participant[] => {
        const roles = assignRoles(participants.length);
        return participants.map((participant, index) => ({
            name: participant,
            role: roles[index] || "" // 名前と役職を合わせて返す
        }));
    };

    // Firestoreに参加者を追加する関数
    const addParticipantsToFirestore = async () => {
        try {
            const participantsWithRoles = assignRolesToParticipants(participants);
            
            // Firestoreのgamesコレクションにルーム名と参加者データを追加
            const docRef = await addDoc(collection(db, "games"), {
                roomName: roomName, // ルーム名
                participants: participantsWithRoles.map(p => ({
                    name: p.name,
                    role: p.role
                })) // 役職を含めて参加者を保存
            });
            console.log("Document written with ID: ", docRef.id);

            // フォームをクリア
            setRoomName(""); // ルーム名をリセット
            setParticipants(["", "", "", ""]); // 参加者リストをリセット

            // 保存されたルーム情報を再読み込み
            loadRooms();
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    };

    // Firestoreからルーム情報を読み込む関数
    const loadRooms = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "games"));
            const roomsData: Room[] = [];
            querySnapshot.forEach((doc) => {
                roomsData.push({ id: doc.id, ...doc.data() } as Room);
            });
            setRooms(roomsData); // ルーム情報を更新
        } catch (e) {
            console.error("Error loading rooms: ", e);
        }
    };

    // 参加者の名前をクリックしたときに役職を表示する関数
    const handleParticipantClick = (participantName: string) => {
        const room = rooms.find(room => room.participants.some((p) => p.name === participantName));
        const participant = room?.participants.find((p) => p.name === participantName);
        if (participant) {
            setSelectedParticipantRole(`${participant.name}の役職: ${participant.role}`);
        }
    };

    // 最低4人、最大10人を確認するフラグ
    const isFormValid = participants.filter(name => name.trim() !== "").length >= 4 && participants.filter(name => name.trim() !== "").length <= 10;

    // 追加ボタンを表示するかどうか
    const canAddMoreParticipants = participants.length < 10;

    // useEffectでコンポーネントがマウントされた後にルームデータをロード
    useEffect(() => {
        loadRooms(); // 初回レンダリング時にFirestoreからルーム情報を読み込む
    }, []); // 初回のレンダリング後にのみ実行

    const deleteRoom = async (roomId: string) => {
        try {
            const roomRef = doc(db, "games", roomId); // 削除するルームの参照を取得
            await deleteDoc(roomRef); // ドキュメントを削除
            console.log(`Room with ID ${roomId} deleted successfully`);
    
            // ルーム一覧を再読み込みして、UIを更新
            loadRooms();
        } catch (e) {
            console.error("Error deleting room: ", e);
        }
    };
    

    return (
        <div className="md:max-w-md w-full md:mx-auto p-4 md:py-8 shippori-mincho-regular">
            <h1 className="font-bold text-xl text-center">ワクワクドキドキ人狼ルーレット</h1>

            {/* ルーム名の入力フォーム */}
            <input
                type="text"
                placeholder="ルーム名"
                className="mt-8 px-4 py-2 rounded-lg outline-none bg-zinc-50 placeholder:text-zinc-400 w-full"
                value={roomName}
                onChange={handleRoomNameChange} // ルーム名の変更処理
            />

            <div className="mt-8 space-y-4">
                {participants.map((participant, index) => (
                    <input
                        key={index}
                        type="text"
                        placeholder={`参加者の名前 ${index + 1}`}
                        className="px-4 py-2 rounded-lg outline-none bg-zinc-50 placeholder:text-zinc-400 w-full"
                        value={participant}
                        onChange={(e) => handleInputChange(index, e)} // 入力時に状態を更新
                    />
                ))}

                {/* 参加者が10人未満の場合にのみ追加ボタンを表示 */}
                {canAddMoreParticipants && (
                    <button
                        className="px-4 py-2 h-10 flex items-center justify-center rounded-lg bg-zinc-200 text-zinc-400 w-full"
                        onClick={() => setParticipants([...participants, ""])} // 新しい入力フィールドを追加
                    >
                        <FaPlus />
                    </button>
                )}
            </div>

            <button
                className={`mt-8 font-bold px-4 py-2 rounded-lg ${isFormValid ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-zinc-400'} w-full`}
                onClick={addParticipantsToFirestore} // 新規作成ボタンの処理
                disabled={!isFormValid} // 参加者が4人未満または10人を超える場合、ボタンを無効化
            >
                新規作成
            </button>

            {/* 作成したルーム一覧 */}
            <div className="mt-8">
                <h2 className="font-bold text-xl">作成されたルーム達</h2>
                <div className="space-y-4 mt-4">
                    {rooms.length > 0 ? (
                        rooms.map((room) => (
                            <div key={room.id} className="border border-zinc-200 rounded-lg p-4">
                                <div className="flex items-center">
                                    <p className="font-bold text-xl">{room.roomName}</p>
                                    <button onClick={() => deleteRoom(room.id)} className="ml-auto"><FiTrash className="text-xl text-zinc-400" /></button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {room.participants.map((participant, index) => (
                                        <button
                                            key={index}
                                            className="px-2 py-0.5 bg-zinc-800 text-white rounded-lg"
                                            onClick={() => handleParticipantClick(participant.name)} // 参加者の名前をクリックして役職を表示
                                        >
                                            {participant.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-zinc-400">まだルームは作成されていません。</p>
                    )}
                </div>
            </div>

            {selectedParticipantRole && (
                <div className="mt-4 text-center text-xl text-gray-800">
                    {selectedParticipantRole}
                </div>
            )}
        </div>
    );
}