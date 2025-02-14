import Link from "next/link";

export default function Archive() {
    return (
        <div className="md:max-w-md w-full md:mx-auto p-4 md:py-8">
            <h1 className="font-bold text-xl">Archived Novels(クソ小説リスト)</h1>

            <ul className="mt-8 space-y-4">
                <Link href="/archived/0001"><li className="list-disc list-inside hover:underline">尿惑（にょうわく）</li></Link>
            </ul>
        </div>
    )
}