import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

export const useSocket = () => {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // 環境変数から取得、なければ現在のホスト名を使用
        const getSocketUrl = () => {
            if (import.meta.env.VITE_API_URL) {
                // /api を削除（Socket.IOには不要）
                return import.meta.env.VITE_API_URL.replace(/\/api$/, '');
            }
            // LAN上の他端末からアクセスする場合、window.location.hostnameを使用
            const hostname = window.location.hostname;
            return `http://${hostname}:3001`;
        };

        const SOCKET_URL = getSocketUrl();
        console.log('Socket.IO接続URL:', SOCKET_URL);
        
        const socketInstance = io(SOCKET_URL);
        socketRef.current = socketInstance;

        socketInstance.on('connect', () => {
            console.log('Socket.IO接続成功');
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('Socket.IO切断');
            setIsConnected(false);
        });

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return { socketRef, isConnected };
};
