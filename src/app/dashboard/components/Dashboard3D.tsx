"use client";

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, OrthographicCamera, Environment } from '@react-three/drei';
import { GridSystem } from './GridSystem';
import { useGridStore } from '@/store/useGridStore';
import { Suspense, useEffect, useState } from 'react';
import { WorkspaceCube } from './WorkspaceCube';

export default function Dashboard3D() {
    const workspaces = useGridStore((state) => state.workspaces);
    const cameraView = useGridStore((state) => state.cameraView);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#0f172a' }}>
            <Canvas gl={{ antialias: true }}>
                <color attach="background" args={['#0f172a']} />

                {/* Camera Setup */}
                {cameraView === 'ISOMETRIC' ? (
                    <OrthographicCamera
                        makeDefault
                        position={[20, 20, 20]}
                        zoom={40}
                        near={-50}
                        far={200}
                        onUpdate={(c) => c.lookAt(0, 0, 0)}
                    />
                ) : (
                    <OrthographicCamera
                        makeDefault
                        position={[0, 50, 0]}
                        zoom={40}
                        near={-50}
                        far={200}
                        onUpdate={(c) => c.lookAt(0, 0, 0)}
                    />
                )}

                <OrbitControls
                    enableRotate={cameraView === 'ISOMETRIC'}
                    enableZoom={true}
                    maxPolarAngle={Math.PI / 2.1} // Don't go below ground
                    minZoom={20}
                    maxZoom={100}
                />

                {/* Lighting */}
                <ambientLight intensity={0.7} />
                <directionalLight position={[10, 20, 10]} intensity={1.5} />
                <Environment preset="city" />

                {/* World */}
                <GridSystem />

                {/* Workspaces */}
                <Suspense fallback={null}>
                    {workspaces.map((ws) => (
                        <WorkspaceCube key={ws.id} workspace={ws} />
                    ))}
                </Suspense>
            </Canvas>

            {/* UI Overlay */}
            <div style={{ position: 'absolute', top: 20, left: 20, pointerEvents: 'none' }}>
                <h1 className="text-2xl font-bold text-white mb-1">3D Growth Grid (Prototype)</h1>
                <p className="text-gray-400 text-sm">Drag & Drop available. <span className="text-xs border border-gray-600 px-1 rounded">Beta</span></p>
            </div>

            <div style={{ position: 'absolute', bottom: 30, right: 30, pointerEvents: 'auto' }}>
                <button
                    onClick={() => useGridStore.getState().setCameraView(cameraView === 'ISOMETRIC' ? 'TOP_DOWN' : 'ISOMETRIC')}
                    className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full hover:bg-white/20 transition-all flex items-center gap-2"
                >
                    {cameraView === 'ISOMETRIC' ? '✈️ Top-down View' : '🧊 Isometric View'}
                </button>
            </div>
        </div>
    );
}
