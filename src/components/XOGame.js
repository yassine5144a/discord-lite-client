import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import './XOGame.css';

const WINNING_COMBOS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function checkWinner(board) {
  for (const [a,b,c] of WINNING_COMBOS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return board.every(Boolean) ? 'draw' : null;
}

export default function XOGame({ serverId, channelId, opponent, onClose }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [board, setBoard] = useState(Array(9).fill(null));
  const [mySymbol, setMySymbol] = useState('X');
  const [currentTurn, setCurrentTurn] = useState('X');
  const [winner, setWinner] = useState(null);
  const [gameId] = useState(`${serverId}-${channelId}-${Date.now()}`);

  useEffect(() => {
    if (!socket) return;

    socket.emit('xo:join', { gameId, serverId, channelId });

    socket.on('xo:start', ({ symbol }) => setMySymbol(symbol));

    socket.on('xo:move', ({ index, symbol, board: newBoard }) => {
      setBoard(newBoard);
      const w = checkWinner(newBoard);
      if (w) setWinner(w);
      else setCurrentTurn(symbol === 'X' ? 'O' : 'X');
    });

    socket.on('xo:reset', () => {
      setBoard(Array(9).fill(null));
      setWinner(null);
      setCurrentTurn('X');
    });

    return () => {
      socket.off('xo:start');
      socket.off('xo:move');
      socket.off('xo:reset');
      socket.emit('xo:leave', { gameId });
    };
  }, [socket, gameId]);

  const handleClick = (index) => {
    if (board[index] || winner || currentTurn !== mySymbol) return;
    const newBoard = [...board];
    newBoard[index] = mySymbol;
    const w = checkWinner(newBoard);
    socket.emit('xo:move', { gameId, index, symbol: mySymbol, board: newBoard });
    setBoard(newBoard);
    if (w) setWinner(w);
    else setCurrentTurn(mySymbol === 'X' ? 'O' : 'X');
  };

  const reset = () => {
    socket.emit('xo:reset', { gameId });
    setBoard(Array(9).fill(null));
    setWinner(null);
    setCurrentTurn('X');
  };

  const isMyTurn = currentTurn === mySymbol && !winner;

  return (
    <div className="xo-overlay" onClick={onClose}>
      <div className="xo-game" onClick={e => e.stopPropagation()}>
        <div className="xo-header">
          <span>🎮 XO Game</span>
          <button onClick={onClose} className="xo-close">✕</button>
        </div>

        <div className="xo-status">
          {winner
            ? winner === 'draw'
              ? "🤝 It's a draw!"
              : winner === mySymbol
                ? '🎉 You won!'
                : '😔 You lost!'
            : isMyTurn
              ? `Your turn (${mySymbol})`
              : `Opponent's turn...`
          }
        </div>

        <div className="xo-board">
          {board.map((cell, i) => (
            <button
              key={i}
              className={`xo-cell ${cell} ${!cell && isMyTurn ? 'hoverable' : ''}`}
              onClick={() => handleClick(i)}
            >
              {cell}
            </button>
          ))}
        </div>

        <div className="xo-actions">
          <button className="btn-primary" onClick={reset}>New Game</button>
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
