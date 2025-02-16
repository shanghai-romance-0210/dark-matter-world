interface VoteModalProps {
  isOpen: boolean;
  closeModal: () => void;
  voteQuestion: string;
  setVoteQuestion: React.Dispatch<React.SetStateAction<string>>;
  voteOptions: string[];
  setVoteOptions: React.Dispatch<React.SetStateAction<string[]>>;
  createVote: () => void;
}

const VoteModal: React.FC<VoteModalProps> = ({ 
  isOpen, 
  closeModal, 
  voteQuestion, 
  setVoteQuestion, 
  voteOptions, 
  setVoteOptions, 
  createVote 
}) => {
  if (!isOpen) return null;

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-zinc-400 bg-opacity-50 backdrop-blur">
      <div className="bg-white p-6 rounded-lg w-3/4 md:w-1/4">
        <h2 className="text-lg font-bold mb-4">Create a New Vote</h2>
        <input
          type="text"
          value={voteQuestion}
          onChange={(e) => setVoteQuestion(e.target.value)}
          placeholder="Enter your question"
          className="placeholder:text-zinc-400 mb-4 w-full px-4 py-2 border border-zinc-200 rounded-lg outline-none duration-200 focus-visible:ring-2 ring-offset-2"
        />
        {voteOptions.map((option, index) => (
          <input
            key={index}
            type="text"
            value={option}
            onChange={(e) => {
              const updatedOptions = [...voteOptions];
              updatedOptions[index] = e.target.value;
              setVoteOptions(updatedOptions);
            }}
            placeholder={`Option ${index + 1}`}
            className="placeholder:text-zinc-400 mb-2 w-full px-4 py-2 border border-zinc-200 rounded-lg outline-none duration-200 focus-visible:ring-2 ring-offset-2"
          />
        ))}
        <button
          onClick={() => setVoteOptions([...voteOptions, ""])}
          className="text-zinc-600 mb-4 text-sm p-0 outline-none duration-200 focus-visible:ring-2 ring-offset-2"
        >
          Add another option
        </button>
        <div className="flex justify-end">
          <button
            onClick={closeModal}
            className="text-zinc-600 px-4 py-2 rounded-lg outline-none duration-200 focus-visible:ring-2 ring-offset-2 focus-visible:z-10"
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
  );
};

export default VoteModal;