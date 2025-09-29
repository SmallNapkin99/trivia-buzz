const GameEnd = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-24 min-h-screen px-4">
      <h1 className="text-8xl md:text-9xl lg:text-[10rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 drop-shadow-2xl">
        Game Over
      </h1>
      <h1 className="text-4xl text-yellow-400 drop-shadow-2xl">
        Thank you for playing Trivia Buzz!
      </h1>
    </div>
  );
};

export default GameEnd;
