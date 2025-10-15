
import React, { useState, useCallback, useEffect } from 'react';
import type { GameScene, Choice, StoryLog } from './types';
import { generateAdventureStep } from './services/geminiService';
import LoadingSpinner from './components/LoadingSpinner';

const App: React.FC = () => {
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [currentScene, setCurrentScene] = useState<GameScene | null>(null);
    const [storyHistory, setStoryHistory] = useState<StoryLog[]>([]);
    const [apiKeyExists, setApiKeyExists] = useState<boolean>(true);
    
    useEffect(() => {
        if (!process.env.API_KEY) {
            setApiKeyExists(false);
        }
    }, []);

    const startGame = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setStoryHistory([]);
        
        const initialPrompt = "Start a new adventure for me. I've just woken up in a mysterious place.";
        
        try {
            const scene = await generateAdventureStep([], initialPrompt);
            setCurrentScene(scene);
            setStoryHistory([
                { role: 'user', text: initialPrompt },
                { role: 'model', text: JSON.stringify(scene) }
            ]);
        } catch (e) {
            setError("Failed to start the game. The ancient magic is unstable.");
            console.error(e);
        } finally {
            setGameStarted(true);
            setIsLoading(false);
        }
    }, []);

    const handleChoice = useCallback(async (choice: Choice) => {
        if (isLoading || !currentScene || currentScene.gameOver || currentScene.gameWin) return;

        setIsLoading(true);
        setError(null);
        
        const updatedHistory = [...storyHistory, { role: 'user' as 'user', text: choice.text }];

        try {
            const nextScene = await generateAdventureStep(updatedHistory, choice.text);
            setCurrentScene(nextScene);
            setStoryHistory([
                ...updatedHistory,
                { role: 'model', text: JSON.stringify(nextScene) }
            ]);
        } catch (e) {
            setError("A mysterious force prevents you from proceeding. Try another path or restart.");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, currentScene, storyHistory]);

    const renderStartScreen = () => (
        <div className="text-center p-8">
            <h1 className="text-5xl font-bold font-serif text-sky-300 mb-4 tracking-wider">Gemini Adventure</h1>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                An epic journey awaits where every decision carves a new reality. Powered by the storytelling magic of Gemini, no two adventures are the same.
            </p>
            {apiKeyExists ? (
                <button
                    onClick={startGame}
                    className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-transform transform hover:scale-105"
                    disabled={isLoading}
                >
                    {isLoading ? 'Summoning the World...' : 'Begin Your Quest'}
                </button>
            ) : (
                <div className="bg-red-900 border border-red-500 text-red-200 px-4 py-3 rounded-lg max-w-md mx-auto">
                    <strong className="font-bold">API Key Not Found!</strong>
                    <span className="block sm:inline"> Please set the `process.env.API_KEY` to start the game.</span>
                </div>
            )}
        </div>
    );

    const renderGameScreen = () => {
        if (isLoading && !currentScene) {
            return (
                 <div className="flex flex-col items-center justify-center p-8 text-slate-300">
                    <LoadingSpinner />
                    <p className="mt-4 text-lg font-serif animate-pulse">The mists of creation are swirling...</p>
                </div>
            );
        }
        
        if (error) {
            return <p className="text-red-400 p-8">{error}</p>;
        }
        
        if (!currentScene) {
            return <p className="text-slate-400 p-8">The story is waiting to be told.</p>;
        }

        const isGameEnded = currentScene.gameOver || currentScene.gameWin;

        return (
            <div className="p-4 md:p-8 flex flex-col h-full">
                <div className="flex-grow overflow-y-auto mb-6 pr-4">
                    <p className="text-slate-300 whitespace-pre-wrap font-serif leading-relaxed text-lg">
                        {currentScene.story}
                    </p>
                </div>

                {isGameEnded && (
                    <div className="text-center my-4 p-4 rounded-lg bg-slate-800 border border-slate-700">
                        <h2 className={`text-3xl font-bold font-serif mb-4 ${currentScene.gameWin ? 'text-green-400' : 'text-red-500'}`}>
                            {currentScene.gameWin ? 'Victory!' : 'Game Over'}
                        </h2>
                        <button
                            onClick={startGame}
                            className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105"
                        >
                            Play Again
                        </button>
                    </div>
                )}
                
                {!isGameEnded && (
                    <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentScene.choices.map((choice, index) => (
                            <button
                                key={index}
                                onClick={() => handleChoice(choice)}
                                disabled={isLoading}
                                className="w-full text-left bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:cursor-not-allowed text-slate-200 font-semibold p-4 rounded-lg shadow-md transition-all transform hover:scale-102 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50"
                            >
                                <span className="flex items-center">
                                  {isLoading && <LoadingSpinner />}
                                  <span className={isLoading ? "ml-3" : ""}>{choice.text}</span>
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <main className="bg-slate-900 text-white min-h-screen flex flex-col items-center justify-center font-sans">
            <div className="w-full max-w-4xl mx-auto bg-slate-800/50 rounded-2xl shadow-2xl backdrop-blur-sm border border-slate-700 min-h-[80vh] flex flex-col">
                {gameStarted ? renderGameScreen() : renderStartScreen()}
            </div>
            <footer className="text-center p-4 text-slate-500 text-sm">
                Powered by Google Gemini
            </footer>
        </main>
    );
};

export default App;
